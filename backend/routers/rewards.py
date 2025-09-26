"""
Rewards router - Handles tagger reward calculation and tracking
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from database import get_db
from auth import get_current_active_user, require_super_admin, require_tagger_or_admin
from models import User, MatchReward, EventEditLog, MatchEvent, Fixture, Team
from schemas import MatchReward as MatchRewardSchema, EventEditLog as EventEditLogSchema
from services.reward_service import RewardService

router = APIRouter()

@router.get("/match/{fixture_id}/rewards", response_model=List[MatchRewardSchema])
async def get_match_rewards(
    fixture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tagger_or_admin)
):
    """Get all rewards for a specific match"""
    rewards = db.query(MatchReward).filter(MatchReward.fixture_id == fixture_id).all()
    return rewards

@router.get("/tagger/{tagger_id}/performance")
async def get_tagger_performance(
    tagger_id: int,
    fixture_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tagger_or_admin)
):
    """Get performance statistics for a tagger"""
    # Taggers can only view their own performance, admins can view anyone's
    if current_user.role != "super_admin" and current_user.id != tagger_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own performance"
        )

    reward_service = RewardService(db)
    return reward_service.get_tagger_performance(tagger_id, fixture_id)

@router.get("/tagger/{tagger_id}/match-history")
async def get_tagger_match_history(
    tagger_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tagger_or_admin)
):
    """Get detailed match-by-match history for a tagger with fixture details"""
    # Taggers can only view their own history, admins can view anyone's
    if current_user.role != "super_admin" and current_user.id != tagger_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own match history"
        )

    # Get all rewards for this tagger ordered by creation date
    rewards = db.query(MatchReward)\
        .filter(MatchReward.tagger_id == tagger_id)\
        .order_by(MatchReward.created_at.desc())\
        .all()

    # Build detailed match history
    match_history = []
    for reward in rewards:
        fixture = db.query(Fixture).filter(Fixture.id == reward.fixture_id).first()
        if not fixture:
            continue

        home_team = db.query(Team).filter(Team.id == fixture.home_team_id).first()
        away_team = db.query(Team).filter(Team.id == fixture.away_team_id).first()

        if not home_team or not away_team:
            continue

        match_history.append({
            'fixture_id': reward.fixture_id,
            'fixture_date': fixture.match_date.isoformat() if fixture.match_date else None,
            'home_team': {
                'id': home_team.id,
                'name': home_team.name,
                'short_name': home_team.team_code_name or home_team.name[:3].upper()
            },
            'away_team': {
                'id': away_team.id,
                'name': away_team.name,
                'short_name': away_team.team_code_name or away_team.name[:3].upper()
            },
            'score': f"{fixture.home_score}-{fixture.away_score}" if fixture.home_score is not None else "TBD",
            'status': fixture.status,
            'gameweek': fixture.gameweek.week_number if fixture.gameweek else None,

            # Reward details
            'events_logged': reward.events_logged,
            'admin_corrections': reward.admin_corrections,
            'events_added_by_admin': reward.events_added_by_admin,
            'events_removed_by_admin': reward.events_removed_by_admin,
            'accuracy_percentage': float(reward.accuracy_percentage),
            'base_reward': float(reward.base_reward),
            'price_per_event': float(reward.price_per_event),
            'final_reward': float(reward.final_reward),
            'is_finalized': reward.is_finalized,
            'finalized_at': reward.finalized_at.isoformat() if reward.finalized_at else None,
            'created_at': reward.created_at.isoformat() if reward.created_at else None,
            'updated_at': reward.updated_at.isoformat() if reward.updated_at else None
        })

    return match_history

@router.get("/test")
async def test_rewards_endpoint():
    """Test endpoint to verify rewards router is working"""
    return {"message": "Rewards router is working", "endpoint": "test"}

@router.post("/event/{event_id}/mark-corrected")
async def mark_event_corrected(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Mark an event as corrected by admin, applying penalty to tagger"""
    # Get the event
    event = db.query(MatchEvent).filter(MatchEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if not event.created_by:
        raise HTTPException(status_code=400, detail="Event has no tagger to penalize")

    if event.created_by == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot correct your own event")

    if event.is_admin_corrected:
        raise HTTPException(status_code=400, detail="Event already marked as corrected")

    # Log the correction
    reward_service = RewardService(db)
    reward_service.log_event_edit(
        event_id=event.id,
        original_tagger_id=event.created_by,
        editor_id=current_user.id,
        edit_type="correction",
        field_changed="admin_correction",
        old_value="Not corrected",
        new_value="Marked as corrected by admin",
        correction_reason="Manual admin correction via correct button",
        severity="minor"
    )

    # Mark event as corrected
    event.is_admin_corrected = True
    event.admin_correction_reason = "Manual admin correction via correct button"
    db.commit()

    # Recalculate reward
    reward = reward_service.create_or_update_match_reward(event.fixture_id, event.created_by)

    return {
        'message': 'Event marked as corrected and penalty applied',
        'event_id': event_id,
        'tagger_id': event.created_by,
        'new_accuracy': reward.accuracy_percentage,
        'new_reward': reward.final_reward
    }

@router.post("/event/{event_id}/remove-correction")
async def uncorrect_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Remove correction from an event, restoring tagger's reward"""
    # Get the event
    event = db.query(MatchEvent).filter(MatchEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if not event.is_admin_corrected:
        raise HTTPException(status_code=400, detail="Event is not marked as corrected")

    if not event.created_by:
        raise HTTPException(status_code=400, detail="Event has no tagger")

    # Remove the correction
    event.is_admin_corrected = False
    event.admin_correction_reason = None

    # Remove all edit logs for this event with "correction" type
    reward_service = RewardService(db)
    edit_logs = db.query(EventEditLog).filter(
        and_(
            EventEditLog.event_id == event_id,
            EventEditLog.edit_type == "correction"
        )
    ).all()

    for log in edit_logs:
        db.delete(log)

    db.commit()

    # Recalculate reward
    reward = reward_service.create_or_update_match_reward(event.fixture_id, event.created_by)

    return {
        'message': 'Correction removed and reward restored',
        'event_id': event_id,
        'tagger_id': event.created_by,
        'new_accuracy': reward.accuracy_percentage,
        'new_reward': reward.final_reward
    }

@router.post("/match/{fixture_id}/calculate")
async def calculate_match_rewards(
    fixture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Calculate/recalculate rewards for all taggers who worked on this match"""
    reward_service = RewardService(db)

    # Get all taggers who worked on this match
    tagger_ids = db.query(MatchEvent.created_by).filter(
        and_(
            MatchEvent.fixture_id == fixture_id,
            MatchEvent.created_by.isnot(None)
        )
    ).distinct().all()

    calculated_rewards = []
    for (tagger_id,) in tagger_ids:
        if tagger_id:
            reward = reward_service.create_or_update_match_reward(fixture_id, tagger_id)
            calculated_rewards.append({
                'tagger_id': tagger_id,
                'final_reward': reward.final_reward,
                'accuracy_percentage': reward.accuracy_percentage,
                'events_logged': reward.events_logged,
                'total_errors': reward.admin_corrections + reward.events_added_by_admin + reward.events_removed_by_admin
            })

    return {
        'fixture_id': fixture_id,
        'rewards': calculated_rewards,
        'message': f'Calculated rewards for {len(calculated_rewards)} taggers'
    }

@router.post("/match/{fixture_id}/finalize")
async def finalize_match_rewards(
    fixture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Finalize rewards for all taggers who worked on this match"""
    reward_service = RewardService(db)
    return reward_service.finalize_match_rewards(fixture_id)

@router.get("/match/{fixture_id}/edit-logs", response_model=List[EventEditLogSchema])
async def get_match_edit_logs(
    fixture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Get all edit logs for events in a specific match"""
    # Get all events for this fixture
    event_ids = db.query(MatchEvent.id).filter(MatchEvent.fixture_id == fixture_id).all()
    event_ids = [id[0] for id in event_ids]

    if not event_ids:
        return []

    edit_logs = db.query(EventEditLog).filter(EventEditLog.event_id.in_(event_ids)).all()
    return edit_logs

@router.get("/tagger/{tagger_id}/edit-logs", response_model=List[EventEditLogSchema])
async def get_tagger_edit_logs(
    tagger_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tagger_or_admin)
):
    """Get all edit logs for a specific tagger"""
    # Taggers can only view their own edit logs, admins can view anyone's
    if current_user.role != "super_admin" and current_user.id != tagger_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own edit logs"
        )

    edit_logs = db.query(EventEditLog).filter(EventEditLog.original_tagger_id == tagger_id).all()
    return edit_logs

@router.get("/leaderboard")
async def get_tagger_leaderboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tagger_or_admin),
    limit: int = 10
):
    """Get tagger leaderboard based on performance metrics"""
    # Get aggregated performance data
    from sqlalchemy import func, desc

    leaderboard = db.query(
        MatchReward.tagger_id,
        User.username,
        func.count(MatchReward.id).label('matches_tagged'),
        func.sum(MatchReward.final_reward).label('total_earnings'),
        func.avg(MatchReward.accuracy_percentage).label('average_accuracy'),
        func.sum(MatchReward.events_logged).label('total_events_logged')
    ).join(User, MatchReward.tagger_id == User.id)\
    .filter(MatchReward.is_finalized == True)\
    .group_by(MatchReward.tagger_id, User.username)\
    .order_by(desc('average_accuracy'), desc('total_earnings'))\
    .limit(limit)\
    .all()

    return [
        {
            'tagger_id': row.tagger_id,
            'username': row.username,
            'matches_tagged': row.matches_tagged,
            'total_earnings': float(row.total_earnings or 0),
            'average_accuracy': float(row.average_accuracy or 0),
            'total_events_logged': row.total_events_logged or 0
        }
        for row in leaderboard
    ]

@router.get("/stats")
async def get_reward_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Get overall reward system statistics"""
    from sqlalchemy import func

    total_rewards_paid = db.query(func.sum(MatchReward.final_reward)).filter(
        MatchReward.is_finalized == True
    ).scalar() or 0

    total_matches_tagged = db.query(func.count(MatchReward.id)).filter(
        MatchReward.is_finalized == True
    ).scalar() or 0

    average_accuracy = db.query(func.avg(MatchReward.accuracy_percentage)).filter(
        MatchReward.is_finalized == True
    ).scalar() or 0

    total_corrections = db.query(func.sum(MatchReward.admin_corrections)).filter(
        MatchReward.is_finalized == True
    ).scalar() or 0

    active_taggers = db.query(func.count(func.distinct(MatchReward.tagger_id))).filter(
        MatchReward.is_finalized == True
    ).scalar() or 0

    return {
        'total_rewards_paid': float(total_rewards_paid),
        'total_matches_tagged': total_matches_tagged,
        'average_accuracy': float(average_accuracy),
        'total_corrections': total_corrections,
        'active_taggers': active_taggers,
        'average_reward_per_match': float(total_rewards_paid / total_matches_tagged) if total_matches_tagged > 0 else 0
    }

@router.get("/all-users-performance")
async def get_all_users_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Get performance summary for all users (admin only)"""
    from sqlalchemy import func

    # Get all users with their performance data
    users_performance = db.query(
        MatchReward.tagger_id,
        User.username,
        func.count(MatchReward.id).label('matches_tagged'),
        func.sum(MatchReward.final_reward).label('total_earnings'),
        func.avg(MatchReward.accuracy_percentage).label('average_accuracy'),
        func.sum(MatchReward.events_logged).label('total_events_logged'),
        func.sum(MatchReward.admin_corrections + MatchReward.events_added_by_admin + MatchReward.events_removed_by_admin).label('total_corrections')
    ).join(User, MatchReward.tagger_id == User.id)\
    .filter(MatchReward.is_finalized == True)\
    .group_by(MatchReward.tagger_id, User.username)\
    .order_by(func.avg(MatchReward.accuracy_percentage).desc())\
    .all()

    return [
        {
            'tagger_id': row.tagger_id,
            'username': row.username,
            'matches_tagged': row.matches_tagged,
            'total_earnings': float(row.total_earnings or 0),
            'average_accuracy': float(row.average_accuracy or 0),
            'total_events_logged': row.total_events_logged or 0,
            'total_corrections': row.total_corrections or 0
        }
        for row in users_performance
    ]