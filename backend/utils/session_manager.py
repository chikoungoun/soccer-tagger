import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models import User, UserSession, UserActivity, LoginAttempt
from utils.device_detection import extract_device_info, get_client_ip
from utils.geolocation import get_geolocation_from_ip

class SessionManager:
    """Manages user sessions and tracking"""

    @staticmethod
    def create_session(
        db: Session,
        user: User,
        request,
        screen_resolution: Optional[str] = None
    ) -> UserSession:
        """Create a new user session"""

        # Get device information
        user_agent = request.headers.get('User-Agent', '')
        ip_address = get_client_ip(request)
        device_info = extract_device_info(user_agent, ip_address)

        # Get geolocation information
        geo_info = get_geolocation_from_ip(ip_address)

        # Generate unique session token
        session_token = str(uuid.uuid4())

        # Create session record
        session = UserSession(
            user_id=user.id,
            session_token=session_token,
            ip_address=device_info["ip_address"],
            user_agent=user_agent,
            device_type=device_info["device_type"],
            browser_name=device_info["browser_name"],
            browser_version=device_info["browser_version"],
            os_name=device_info["os_name"],
            os_version=device_info["os_version"],
            screen_resolution=screen_resolution,
            country=geo_info["country"],
            country_code=geo_info["country_code"],
            region=geo_info["region"],
            city=geo_info["city"],
            latitude=geo_info["latitude"],
            longitude=geo_info["longitude"],
            timezone=geo_info["timezone"]
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        return session

    @staticmethod
    def end_session(db: Session, session_token: str) -> bool:
        """End a user session"""
        session = db.query(UserSession).filter(
            and_(
                UserSession.session_token == session_token,
                UserSession.is_active == True
            )
        ).first()

        if session:
            session.logout_time = datetime.utcnow()
            session.is_active = False

            # Calculate session duration
            if session.login_time:
                duration = (session.logout_time - session.login_time).total_seconds()
                session.session_duration = int(duration)

            db.commit()
            return True

        return False

    @staticmethod
    def update_activity(
        db: Session,
        session_token: str,
        activity_type: str,
        page_url: Optional[str] = None,
        action_name: Optional[str] = None,
        additional_data: Optional[Dict] = None
    ) -> bool:
        """Update user activity and session"""
        session = db.query(UserSession).filter(
            and_(
                UserSession.session_token == session_token,
                UserSession.is_active == True
            )
        ).first()

        if not session:
            return False

        # Update session last activity
        session.last_activity = datetime.utcnow()

        # Increment counters based on activity type
        if activity_type == "page_visit":
            session.pages_visited += 1
        elif activity_type == "action":
            session.actions_performed += 1

        # Create activity record
        activity = UserActivity(
            user_id=session.user_id,
            session_id=session.id,
            activity_type=activity_type,
            page_url=page_url,
            action_name=action_name,
            additional_data=json.dumps(additional_data) if additional_data else None
        )

        db.add(activity)
        db.commit()

        return True

    @staticmethod
    def log_login_attempt(
        db: Session,
        username: str,
        request,
        success: bool,
        user_id: Optional[int] = None,
        failure_reason: Optional[str] = None
    ) -> LoginAttempt:
        """Log a login attempt"""

        user_agent = request.headers.get('User-Agent', '')
        ip_address = get_client_ip(request)

        attempt = LoginAttempt(
            username=username,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            user_id=user_id,
            failure_reason=failure_reason
        )

        db.add(attempt)
        db.commit()
        db.refresh(attempt)

        return attempt

    @staticmethod
    def get_active_sessions(db: Session, user_id: int) -> list:
        """Get all active sessions for a user"""
        return db.query(UserSession).filter(
            and_(
                UserSession.user_id == user_id,
                UserSession.is_active == True
            )
        ).all()

    @staticmethod
    def get_session_by_token(db: Session, session_token: str) -> Optional[UserSession]:
        """Get session by token"""
        return db.query(UserSession).filter(
            UserSession.session_token == session_token
        ).first()

    @staticmethod
    def cleanup_expired_sessions(db: Session, hours: int = 24) -> int:
        """Clean up sessions that have been inactive for specified hours"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)

        expired_sessions = db.query(UserSession).filter(
            and_(
                UserSession.is_active == True,
                UserSession.last_activity < cutoff_time
            )
        )

        count = expired_sessions.count()

        # Mark as inactive and set logout time
        for session in expired_sessions:
            session.is_active = False
            session.logout_time = session.last_activity

        db.commit()
        return count