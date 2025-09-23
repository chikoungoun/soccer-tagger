from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import User
from auth import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    get_current_active_user,
    require_super_admin,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_token_from_cookie
)
from utils.session_manager import SessionManager
from utils.notification_manager import NotificationManager

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "tagger"

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str
    screen_resolution: Optional[str] = None

class ActivityRequest(BaseModel):
    activity_type: str  # page_visit, action, api_call
    page_url: Optional[str] = None
    action_name: Optional[str] = None
    additional_data: Optional[dict] = None

@router.post("/register", response_model=UserResponse)
async def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Register a new user (only super admins can create users)"""
    # Check if username already exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Validate role
    if user_data.role not in ["super_admin", "tagger"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either 'super_admin' or 'tagger'"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.post("/login", response_model=UserResponse)
async def login_for_access_token(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login endpoint with httpOnly cookie and session tracking"""

    # Log login attempt
    user = authenticate_user(db, form_data.username, form_data.password)

    if not user:
        # Log failed attempt
        SessionManager.log_login_attempt(
            db=db,
            username=form_data.username,
            request=request,
            success=False,
            failure_reason="invalid_credentials"
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Log successful attempt
    SessionManager.log_login_attempt(
        db=db,
        username=form_data.username,
        request=request,
        success=True,
        user_id=user.id
    )

    # Create session
    session = SessionManager.create_session(
        db=db,
        user=user,
        request=request,
        screen_resolution=getattr(form_data, 'screen_resolution', None)
    )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "session_token": session.session_token},
        expires_delta=access_token_expires
    )

    # Set httpOnly cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax"
    )

    return user

@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Logout endpoint that clears the httpOnly cookie and ends session"""
    try:
        # Get session token from cookie
        token = get_token_from_cookie(request)
        from jose import jwt
        from auth import SECRET_KEY, ALGORITHM

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        session_token = payload.get("session_token")

        if session_token:
            # End the session
            SessionManager.end_session(db, session_token)
    except:
        # If token extraction fails, just clear the cookie
        pass

    response.delete_cookie(key="access_token", samesite="lax")
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user profile"""
    return current_user

@router.get("/users", response_model=list[UserResponse])
async def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Get all users (only super admins)"""
    users = db.query(User).all()
    return users

@router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Toggle user active status (only super admins)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.is_active = not user.is_active
    db.commit()

    return {"message": f"User {'activated' if user.is_active else 'deactivated'} successfully"}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Delete a user (only super admins)"""
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}

# Activity tracking endpoints
@router.post("/track-activity")
async def track_activity(
    request: Request,
    activity_data: ActivityRequest,
    db: Session = Depends(get_db)
):
    """Track user activity"""
    try:
        # Get session token from cookie
        token = get_token_from_cookie(request)
        from jose import jwt
        from auth import SECRET_KEY, ALGORITHM

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        session_token = payload.get("session_token")

        if session_token:
            # Update activity
            success = SessionManager.update_activity(
                db=db,
                session_token=session_token,
                activity_type=activity_data.activity_type,
                page_url=activity_data.page_url,
                action_name=activity_data.action_name,
                additional_data=activity_data.additional_data
            )

            if success:
                return {"message": "Activity tracked successfully"}
            else:
                return {"message": "Session not found"}
        else:
            return {"message": "No session token found"}

    except Exception as e:
        return {"message": f"Error tracking activity: {str(e)}"}

# Analytics endpoints (super admin only)
@router.get("/analytics/sessions")
async def get_session_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
    limit: int = 100
):
    """Get session analytics"""
    from models import UserSession
    from sqlalchemy import desc

    sessions = db.query(UserSession).order_by(desc(UserSession.login_time)).limit(limit).all()

    return {
        "sessions": [
            {
                "id": session.id,
                "user_id": session.user_id,
                "username": session.user.username,
                "login_time": session.login_time,
                "logout_time": session.logout_time,
                "last_activity": session.last_activity,
                "is_active": session.is_active,
                "device_type": session.device_type,
                "browser_name": session.browser_name,
                "browser_version": session.browser_version,
                "os_name": session.os_name,
                "os_version": session.os_version,
                "ip_address": session.ip_address,
                "pages_visited": session.pages_visited,
                "actions_performed": session.actions_performed,
                "session_duration": session.session_duration
            }
            for session in sessions
        ]
    }

@router.get("/analytics/login-attempts")
async def get_login_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
    limit: int = 100
):
    """Get login attempts analytics"""
    from models import LoginAttempt
    from sqlalchemy import desc

    attempts = db.query(LoginAttempt).order_by(desc(LoginAttempt.timestamp)).limit(limit).all()

    return {
        "login_attempts": [
            {
                "id": attempt.id,
                "username": attempt.username,
                "ip_address": attempt.ip_address,
                "success": attempt.success,
                "failure_reason": attempt.failure_reason,
                "timestamp": attempt.timestamp,
                "user_id": attempt.user_id
            }
            for attempt in attempts
        ]
    }

@router.get("/analytics/user-activity")
async def get_user_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
    user_id: Optional[int] = None,
    limit: int = 100
):
    """Get user activity analytics"""
    from models import UserActivity
    from sqlalchemy import desc

    query = db.query(UserActivity)
    if user_id:
        query = query.filter(UserActivity.user_id == user_id)

    activities = query.order_by(desc(UserActivity.timestamp)).limit(limit).all()

    return {
        "activities": [
            {
                "id": activity.id,
                "user_id": activity.user_id,
                "session_id": activity.session_id,
                "activity_type": activity.activity_type,
                "page_url": activity.page_url,
                "action_name": activity.action_name,
                "additional_data": activity.additional_data,
                "timestamp": activity.timestamp
            }
            for activity in activities
        ]
    }

# Notification endpoints
@router.get("/notifications")
async def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    unread_only: bool = False,
    limit: int = 50
):
    """Get notifications for current user"""
    notifications = NotificationManager.get_user_notifications(
        db=db,
        user_id=current_user.id,
        unread_only=unread_only,
        limit=limit
    )

    return {
        "notifications": [
            {
                "id": notification.id,
                "title": notification.title,
                "message": notification.message,
                "type": notification.type,
                "is_read": notification.is_read,
                "fixture_id": notification.fixture_id,
                "gameweek_id": notification.gameweek_id,
                "created_at": notification.created_at,
                "read_at": notification.read_at
            }
            for notification in notifications
        ]
    }

@router.get("/notifications/unread-count")
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get count of unread notifications"""
    count = NotificationManager.get_unread_count(db=db, user_id=current_user.id)
    return {"unread_count": count}

@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark a notification as read"""
    success = NotificationManager.mark_notification_read(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id
    )

    if success:
        return {"message": "Notification marked as read"}
    else:
        raise HTTPException(status_code=404, detail="Notification not found")

@router.patch("/notifications/mark-all-read")
async def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark all notifications as read for current user"""
    count = NotificationManager.mark_all_read(db=db, user_id=current_user.id)
    return {"message": f"Marked {count} notifications as read"}