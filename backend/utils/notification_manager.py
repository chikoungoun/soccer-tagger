from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models import User, Notification, Fixture, Gameweek

class NotificationManager:
    """Manages notifications for users"""

    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        notification_type: str,
        fixture_id: Optional[int] = None,
        gameweek_id: Optional[int] = None
    ) -> Notification:
        """Create a new notification for a user"""

        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type,
            fixture_id=fixture_id,
            gameweek_id=gameweek_id
        )

        db.add(notification)
        db.commit()
        db.refresh(notification)

        return notification

    @staticmethod
    def notify_fixture_created(db: Session, fixture: Fixture, created_by_user_id: int):
        """Create notifications when a fixture is created"""

        # Get all users with tagger role (they need to know about new fixtures)
        taggers = db.query(User).filter(User.role == 'tagger').all()

        title = f"New Fixture: {fixture.home_team.name} vs {fixture.away_team.name}"
        message = f"A new fixture has been scheduled for {fixture.match_date.strftime('%d/%m/%Y at %H:%M')}. The match is between {fixture.home_team.name} and {fixture.away_team.name}."

        for tagger in taggers:
            # Don't notify the user who created the fixture
            if tagger.id != created_by_user_id:
                NotificationManager.create_notification(
                    db=db,
                    user_id=tagger.id,
                    title=title,
                    message=message,
                    notification_type="fixture_created",
                    fixture_id=fixture.id
                )

    @staticmethod
    def notify_gameweek_created(db: Session, gameweek: Gameweek, created_by_user_id: int):
        """Create notifications when a gameweek is created"""

        # Get all users (both super_admin and tagger roles need to know about new gameweeks)
        all_users = db.query(User).filter(User.role.in_(['super_admin', 'tagger'])).all()

        title = f"New Gameweek: {gameweek.name}"
        message = f"Gameweek {gameweek.week_number} '{gameweek.name}' has been created for the period {gameweek.start_date.strftime('%d/%m/%Y')} to {gameweek.end_date.strftime('%d/%m/%Y')}."

        for user in all_users:
            # Don't notify the user who created the gameweek
            if user.id != created_by_user_id:
                NotificationManager.create_notification(
                    db=db,
                    user_id=user.id,
                    title=title,
                    message=message,
                    notification_type="gameweek_created",
                    gameweek_id=gameweek.id
                )

    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: int,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Notification]:
        """Get notifications for a specific user"""

        query = db.query(Notification).filter(Notification.user_id == user_id)

        if unread_only:
            query = query.filter(Notification.is_read == False)

        notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()

        return notifications

    @staticmethod
    def mark_notification_read(db: Session, notification_id: int, user_id: int) -> bool:
        """Mark a notification as read"""

        notification = db.query(Notification).filter(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
        ).first()

        if notification:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            db.commit()
            return True

        return False

    @staticmethod
    def mark_all_read(db: Session, user_id: int) -> int:
        """Mark all notifications as read for a user"""

        notifications = db.query(Notification).filter(
            and_(
                Notification.user_id == user_id,
                Notification.is_read == False
            )
        ).all()

        count = 0
        for notification in notifications:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            count += 1

        db.commit()

        return count

    @staticmethod
    def get_unread_count(db: Session, user_id: int) -> int:
        """Get count of unread notifications for a user"""

        count = db.query(Notification).filter(
            and_(
                Notification.user_id == user_id,
                Notification.is_read == False
            )
        ).count()

        return count

    @staticmethod
    def delete_old_notifications(db: Session, days_old: int = 30) -> int:
        """Delete notifications older than specified days"""

        from datetime import timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)

        old_notifications = db.query(Notification).filter(
            Notification.created_at < cutoff_date
        ).all()

        count = len(old_notifications)

        for notification in old_notifications:
            db.delete(notification)

        db.commit()

        return count