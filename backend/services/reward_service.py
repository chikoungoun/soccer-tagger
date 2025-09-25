"""
Reward Service - Handles tagger accuracy tracking and reward calculations
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from models import MatchEvent, EventEditLog, MatchReward, User
from schemas import EventEditLogCreate, MatchRewardCreate
from datetime import datetime
from typing import Optional, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)

class RewardService:
    def __init__(self, db: Session):
        self.db = db

    def log_event_edit(
        self,
        event_id: int,
        original_tagger_id: int,
        editor_id: int,
        edit_type: str,
        field_changed: Optional[str] = None,
        old_value: Any = None,
        new_value: Any = None,
        correction_reason: Optional[str] = None,
        severity: str = "minor"
    ) -> EventEditLog:
        """
        Log an edit made to a match event

        Args:
            event_id: ID of the event being edited
            original_tagger_id: ID of the user who originally created the event
            editor_id: ID of the user making the edit
            edit_type: Type of edit (correction, enhancement, deletion, addition)
            field_changed: Which field was changed
            old_value: Previous value
            new_value: New value
            correction_reason: Why this was corrected
            severity: Severity of the error (minor, major, critical)
        """
        try:
            # Convert values to JSON strings if they're complex objects
            old_value_str = json.dumps(old_value) if old_value and not isinstance(old_value, str) else str(old_value) if old_value else None
            new_value_str = json.dumps(new_value) if new_value and not isinstance(new_value, str) else str(new_value) if new_value else None

            edit_log = EventEditLog(
                event_id=event_id,
                original_tagger_id=original_tagger_id,
                editor_id=editor_id,
                edit_type=edit_type,
                field_changed=field_changed,
                old_value=old_value_str,
                new_value=new_value_str,
                correction_reason=correction_reason,
                severity=severity
            )

            self.db.add(edit_log)

            # Update the event tracking fields
            event = self.db.query(MatchEvent).filter(MatchEvent.id == event_id).first()
            if event:
                event.edit_count += 1
                if edit_type == "correction":
                    event.is_admin_corrected = True
                    event.admin_correction_reason = correction_reason
                event.modified_by = editor_id

            self.db.commit()

            # Recalculate rewards for this tagger on this fixture
            if event:
                self._update_tagger_reward(event.fixture_id, original_tagger_id)

            return edit_log

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error logging event edit: {str(e)}")
            raise

    def create_or_update_match_reward(self, fixture_id: int, tagger_id: int) -> MatchReward:
        """
        Create or update the reward record for a tagger on a specific match
        """
        try:
            # Check if reward record already exists
            reward = self.db.query(MatchReward).filter(
                and_(MatchReward.fixture_id == fixture_id, MatchReward.tagger_id == tagger_id)
            ).first()

            if not reward:
                # Create new reward record
                reward = MatchReward(
                    fixture_id=fixture_id,
                    tagger_id=tagger_id,
                    base_reward=50.0,
                    events_logged=0,
                    admin_corrections=0,
                    events_added_by_admin=0,
                    events_removed_by_admin=0,
                    price_per_event=0.0,
                    accuracy_percentage=100.0,
                    final_reward=50.0
                )
                self.db.add(reward)

            # Calculate current stats
            self._calculate_reward_stats(reward)
            self.db.commit()

            return reward

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating/updating match reward: {str(e)}")
            raise

    def _calculate_reward_stats(self, reward: MatchReward) -> None:
        """
        Calculate and update reward statistics
        """
        # Count events logged by this tagger for this fixture
        events_logged = self.db.query(func.count(MatchEvent.id)).filter(
            and_(
                MatchEvent.fixture_id == reward.fixture_id,
                MatchEvent.created_by == reward.tagger_id
            )
        ).scalar() or 0

        # Count admin corrections (events where admin made corrections)
        admin_corrections = self.db.query(func.count(MatchEvent.id)).filter(
            and_(
                MatchEvent.fixture_id == reward.fixture_id,
                MatchEvent.created_by == reward.tagger_id,
                MatchEvent.is_admin_corrected == True
            )
        ).scalar() or 0

        # Count events admin had to add (events created by admin for this fixture)
        # This represents events the tagger missed
        events_added_by_admin = self.db.query(func.count(MatchEvent.id)).filter(
            and_(
                MatchEvent.fixture_id == reward.fixture_id,
                MatchEvent.created_by != reward.tagger_id,  # Created by someone else (admin)
                MatchEvent.created_by.isnot(None)  # Not null (has a creator)
            )
        ).scalar() or 0

        # Count events tagger created that admin had to remove
        # (This would be tracked through edit logs with edit_type='deletion')
        events_removed_by_admin = self.db.query(func.count(EventEditLog.id)).filter(
            and_(
                EventEditLog.original_tagger_id == reward.tagger_id,
                EventEditLog.edit_type == "deletion",
                # Join with match event to get fixture_id
                EventEditLog.event_id.in_(
                    self.db.query(MatchEvent.id).filter(MatchEvent.fixture_id == reward.fixture_id)
                )
            )
        ).scalar() or 0

        # Update reward record
        reward.events_logged = events_logged
        reward.admin_corrections = admin_corrections
        reward.events_added_by_admin = events_added_by_admin
        reward.events_removed_by_admin = events_removed_by_admin

        # Calculate reward
        if events_logged > 0:
            reward.price_per_event = reward.base_reward / events_logged

            # Total errors = corrections + missed events + false events
            total_errors = admin_corrections + events_added_by_admin + events_removed_by_admin

            # Calculate accuracy (prevent negative accuracy)
            total_expected_events = events_logged + events_added_by_admin
            if total_expected_events > 0:
                correct_events = total_expected_events - total_errors
                reward.accuracy_percentage = max(0, (correct_events / total_expected_events) * 100)
            else:
                reward.accuracy_percentage = 100.0

            # Calculate final reward
            penalty = total_errors * reward.price_per_event
            reward.final_reward = max(0, reward.base_reward - penalty)
        else:
            # No events logged - if there were events to be logged, this is 0 reward
            reward.price_per_event = 0
            if events_added_by_admin > 0:
                reward.accuracy_percentage = 0.0
                reward.final_reward = 0.0
            else:
                reward.accuracy_percentage = 100.0
                reward.final_reward = reward.base_reward

    def _update_tagger_reward(self, fixture_id: int, tagger_id: int) -> None:
        """
        Update the reward calculation for a specific tagger on a specific fixture
        """
        reward = self.db.query(MatchReward).filter(
            and_(MatchReward.fixture_id == fixture_id, MatchReward.tagger_id == tagger_id)
        ).first()

        if reward:
            self._calculate_reward_stats(reward)

    def finalize_match_rewards(self, fixture_id: int) -> Dict[str, Any]:
        """
        Finalize rewards for all taggers who worked on this match
        Should be called when the match is completed
        """
        try:
            # Get all taggers who worked on this match
            tagger_ids = self.db.query(MatchEvent.created_by).filter(
                and_(
                    MatchEvent.fixture_id == fixture_id,
                    MatchEvent.created_by.isnot(None)
                )
            ).distinct().all()

            finalized_rewards = []

            for (tagger_id,) in tagger_ids:
                if tagger_id:
                    reward = self.create_or_update_match_reward(fixture_id, tagger_id)
                    reward.is_finalized = True
                    reward.finalized_at = datetime.utcnow()
                    finalized_rewards.append({
                        'tagger_id': tagger_id,
                        'final_reward': reward.final_reward,
                        'accuracy_percentage': reward.accuracy_percentage,
                        'events_logged': reward.events_logged,
                        'total_errors': reward.admin_corrections + reward.events_added_by_admin + reward.events_removed_by_admin
                    })

            self.db.commit()

            return {
                'fixture_id': fixture_id,
                'rewards': finalized_rewards,
                'total_rewards': sum(r['final_reward'] for r in finalized_rewards)
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error finalizing match rewards: {str(e)}")
            raise

    def get_tagger_performance(self, tagger_id: int, fixture_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Get performance statistics for a tagger
        """
        query_filter = [MatchReward.tagger_id == tagger_id]
        if fixture_id:
            query_filter.append(MatchReward.fixture_id == fixture_id)

        rewards = self.db.query(MatchReward).filter(and_(*query_filter)).all()

        if not rewards:
            return {
                'tagger_id': tagger_id,
                'matches_tagged': 0,
                'total_earnings': 0.0,
                'average_accuracy': 0.0,
                'total_events_logged': 0,
                'total_corrections': 0
            }

        return {
            'tagger_id': tagger_id,
            'matches_tagged': len(rewards),
            'total_earnings': sum(r.final_reward for r in rewards),
            'average_accuracy': sum(r.accuracy_percentage for r in rewards) / len(rewards),
            'total_events_logged': sum(r.events_logged for r in rewards),
            'total_corrections': sum(r.admin_corrections for r in rewards),
            'matches': [
                {
                    'fixture_id': r.fixture_id,
                    'accuracy': r.accuracy_percentage,
                    'reward': r.final_reward,
                    'events_logged': r.events_logged,
                    'is_finalized': r.is_finalized
                } for r in rewards
            ] if fixture_id else None
        }