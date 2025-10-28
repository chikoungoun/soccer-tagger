from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List, Dict, Optional
from datetime import datetime, date
from database import get_db
from models import MatchEvent, MatchTimer, Player, Fixture, Lineup, User
from pydantic import BaseModel
from auth import get_current_active_user, require_tagger_or_admin
from services.reward_service import RewardService

router = APIRouter()

def calculate_player_minutes(fixture_id: int, db: Session):
    """Calculate minutes played for all players in a fixture considering 2 halves, substitutions, and red cards"""

    # Get all events for this fixture, ordered by time
    events = db.query(MatchEvent).filter(
        MatchEvent.fixture_id == fixture_id
    ).order_by(
        MatchEvent.half,
        MatchEvent.minute,
        MatchEvent.created_at
    ).all()

    # Get all lineups for this fixture
    lineups = db.query(Lineup).filter(Lineup.fixture_id == fixture_id).all()

    # Get timer to know match progress
    timer = db.query(MatchTimer).filter(MatchTimer.fixture_id == fixture_id).first()

    # Initialize player minutes tracking
    player_minutes = {}

    for lineup in lineups:
        player_id = lineup.player_id
        player_minutes[player_id] = {
            'total_minutes': 0,
            'is_on_field': lineup.is_starter,  # Starters begin on field
            'last_event_minute': 0 if lineup.is_starter else None,  # Track when they entered
            'last_event_half': 1 if lineup.is_starter else None,
            'red_carded': False
        }

    # Process each event chronologically
    for event in events:
        player_id = event.player_id

        if player_id not in player_minutes:
            continue

        player_data = player_minutes[player_id]

        # Calculate minutes since last event for players currently on field and not red carded
        if player_data['is_on_field'] and not player_data['red_carded']:
            minutes_since_last = calculate_minutes_between_events(
                player_data['last_event_half'], player_data['last_event_minute'],
                event.half, event.minute
            )
            player_data['total_minutes'] += minutes_since_last

        # Handle different event types
        if event.event_type == 'substitution_out':
            if player_data['is_on_field']:
                player_data['is_on_field'] = False

        elif event.event_type == 'substitution_in':
            if not player_data['is_on_field'] and not player_data['red_carded']:
                player_data['is_on_field'] = True
                player_data['last_event_minute'] = event.minute
                player_data['last_event_half'] = event.half

        elif event.event_type == 'red_card':
            if player_data['is_on_field']:
                player_data['is_on_field'] = False
                player_data['red_carded'] = True

        # Update last event tracking for players on field
        if player_data['is_on_field']:
            player_data['last_event_minute'] = event.minute
            player_data['last_event_half'] = event.half

    # Calculate final minutes for players still on field at match end
    if timer:
        current_half = timer.current_half
        current_minute = get_current_match_minute(timer)

        for player_id, player_data in player_minutes.items():
            if player_data['is_on_field'] and not player_data['red_carded']:
                # Add minutes from last event to current time
                if player_data['last_event_half'] is not None:
                    final_minutes = calculate_minutes_between_events(
                        player_data['last_event_half'], player_data['last_event_minute'],
                        current_half, current_minute
                    )
                    player_data['total_minutes'] += final_minutes

    # Note: minutes_played field removed from database schema
    return player_minutes

def calculate_minutes_between_events(start_half: int, start_minute: int, end_half: int, end_minute: int) -> int:
    """Calculate minutes between two match events, handling half transitions"""
    if start_half == end_half:
        return max(0, end_minute - start_minute)

    if start_half == 1 and end_half == 2:
        # Minutes remaining in first half + minutes in second half
        first_half_remaining = max(0, 45 - start_minute)
        second_half_minutes = end_minute
        return first_half_remaining + second_half_minutes

    return 0  # Shouldn't happen in normal cases

def get_current_match_minute(timer: MatchTimer) -> int:
    """Get current minute of the match considering paused time"""
    if timer.current_half <= 0 or timer.current_half >= 3:
        return 0

    if not timer.half_start_time:
        return 0

    if timer.is_paused and timer.pause_time:
        elapsed_seconds = (timer.pause_time - timer.half_start_time).total_seconds()
    else:
        elapsed_seconds = (datetime.utcnow() - timer.half_start_time).total_seconds()

    total_minutes = int((elapsed_seconds - (timer.total_pause_duration or 0)) / 60)

    # Adjust for second half
    if timer.current_half == 2:
        return min(45, total_minutes)  # Second half minutes (0-45)
    else:
        return min(45, total_minutes)  # First half minutes (0-45)

class CreateEventRequest(BaseModel):
    player_id: int
    event_type: str
    minute: int
    half: int
    extra_info: Optional[str] = None

class EventResponse(BaseModel):
    id: int
    fixture_id: int
    player_id: int
    player_name: str
    player_position: str
    player_birth_date: Optional[date]
    team_code: Optional[str]
    event_type: str
    minute: int
    half: int
    extra_info: Optional[str]
    created_by: Optional[int]
    tagger_name: Optional[str]
    created_at: datetime
    is_admin_corrected: Optional[bool] = False

    class Config:
        from_attributes = True

class TimerResponse(BaseModel):
    fixture_id: int
    current_half: int
    current_minute: int
    is_paused: bool
    half_start_time: Optional[datetime]

    class Config:
        from_attributes = True

@router.post("/fixtures/{fixture_id}/timer/start-half")
async def start_half(fixture_id: int, half: int, db: Session = Depends(get_db), current_user: User = Depends(require_tagger_or_admin)):
    """Start a specific half of the match"""
    if half not in [1, 2]:
        raise HTTPException(status_code=400, detail="Half must be 1 or 2")

    # Check if fixture exists
    fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")

    # Check if lineups are set for both teams
    home_lineup = db.query(Lineup).filter(
        Lineup.fixture_id == fixture_id,
        Lineup.team_id == fixture.home_team_id
    ).first()

    away_lineup = db.query(Lineup).filter(
        Lineup.fixture_id == fixture_id,
        Lineup.team_id == fixture.away_team_id
    ).first()

    if not home_lineup or not away_lineup:
        raise HTTPException(
            status_code=400,
            detail="Lineups must be set for both teams before starting the match"
        )

    # Get or create timer
    timer = db.query(MatchTimer).filter(MatchTimer.fixture_id == fixture_id).first()
    if not timer:
        timer = MatchTimer(fixture_id=fixture_id)
        db.add(timer)

    # Start the half
    timer.current_half = half
    timer.half_start_time = datetime.utcnow()
    timer.is_paused = False
    timer.pause_time = None
    timer.total_pause_duration = 0  # Reset pause duration for new half

    # Update fixture status to live
    fixture.status = "live"

    db.commit()
    db.refresh(timer)

    return {"message": f"Half {half} started", "timer": timer}

@router.post("/fixtures/{fixture_id}/timer/end-half")
async def end_half(fixture_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_tagger_or_admin)):
    """End the current half"""
    timer = db.query(MatchTimer).filter(MatchTimer.fixture_id == fixture_id).first()
    if not timer:
        raise HTTPException(status_code=404, detail="Timer not found")

    if timer.current_half == 0 or timer.current_half == -1:
        raise HTTPException(status_code=400, detail="No half is currently active")

    current_half = timer.current_half

    # Calculate final minute for this half
    if timer.half_start_time and not timer.is_paused:
        elapsed_seconds = (datetime.utcnow() - timer.half_start_time).total_seconds()
        final_minute = int((elapsed_seconds - timer.total_pause_duration) / 60)
    else:
        final_minute = 0

    # If ending second half, complete the match
    if timer.current_half == 2:
        # Get fixture and update status to completed
        fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
        if fixture:
            fixture.status = "completed"

        # Set timer to finished state (half 3 indicates finished)
        timer.current_half = 3
        timer.is_paused = True  # Timer is stopped
        timer.pause_time = datetime.utcnow()
        timer.half_start_time = None
    else:
        # End first half - stop the timer completely and mark as halftime
        timer.is_paused = True
        timer.pause_time = datetime.utcnow()
        # Set to special halftime state (-1) to distinguish from "not started" (0)
        timer.current_half = -1

    db.commit()
    db.refresh(timer)

    message = f"Half {current_half} ended"
    if current_half == 2:
        message = "Match completed"

    return {"message": message, "timer": timer, "final_minute": final_minute}

@router.post("/fixtures/{fixture_id}/timer/pause")
async def pause_timer(fixture_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_tagger_or_admin)):
    """Pause the match timer"""
    timer = db.query(MatchTimer).filter(MatchTimer.fixture_id == fixture_id).first()
    if not timer:
        raise HTTPException(status_code=404, detail="Timer not found")

    if timer.is_paused:
        raise HTTPException(status_code=400, detail="Timer is already paused")

    timer.is_paused = True
    timer.pause_time = datetime.utcnow()

    db.commit()

    return {"message": "Timer paused"}

@router.post("/fixtures/{fixture_id}/timer/resume")
async def resume_timer(fixture_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_tagger_or_admin)):
    """Resume the match timer"""
    timer = db.query(MatchTimer).filter(MatchTimer.fixture_id == fixture_id).first()
    if not timer:
        raise HTTPException(status_code=404, detail="Timer not found")

    if not timer.is_paused:
        raise HTTPException(status_code=400, detail="Timer is not paused")

    if timer.pause_time:
        pause_duration = (datetime.utcnow() - timer.pause_time).total_seconds()
        timer.total_pause_duration += int(pause_duration)

    timer.is_paused = False
    timer.pause_time = None

    db.commit()

    return {"message": "Timer resumed"}

@router.get("/fixtures/{fixture_id}/timer")
async def get_timer(fixture_id: int, db: Session = Depends(get_db)):
    """Get current timer status"""
    timer = db.query(MatchTimer).filter(MatchTimer.fixture_id == fixture_id).first()
    if not timer or timer.current_half == 0:
        return {
            "fixture_id": fixture_id,
            "current_half": 0,
            "current_minute": 0,
            "is_paused": False,
            "half_start_time": None
        }

    current_minute = 0
    if timer.half_start_time and not timer.is_paused:
        elapsed_seconds = (datetime.utcnow() - timer.half_start_time).total_seconds()
        current_minute = int((elapsed_seconds - timer.total_pause_duration) / 60)
    elif timer.half_start_time and timer.is_paused and timer.pause_time:
        elapsed_seconds = (timer.pause_time - timer.half_start_time).total_seconds()
        current_minute = int((elapsed_seconds - timer.total_pause_duration) / 60)

    return {
        "fixture_id": fixture_id,
        "current_half": timer.current_half,
        "current_minute": current_minute,
        "is_paused": timer.is_paused,
        "half_start_time": timer.half_start_time
    }

@router.post("/fixtures/{fixture_id}/events", response_model=EventResponse)
async def create_event(fixture_id: int, event: CreateEventRequest, db: Session = Depends(get_db), current_user: User = Depends(require_tagger_or_admin)):
    """Create a new match event"""
    # Validate fixture exists
    fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")

    # Validate player exists
    player = db.query(Player).options(joinedload(Player.team)).filter(Player.id == event.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Validate event type
    valid_events = ["goal", "assist", "yellow_card", "red_card", "substitution_in", "substitution_out", "penalty_miss", "penalty_saved"]
    if event.event_type not in valid_events:
        raise HTTPException(status_code=400, detail=f"Invalid event type. Must be one of: {', '.join(valid_events)}")

    # Create event
    db_event = MatchEvent(
        fixture_id=fixture_id,
        player_id=event.player_id,
        event_type=event.event_type,
        minute=event.minute,
        half=event.half,
        extra_info=event.extra_info,
        created_by=current_user.id
    )

    db.add(db_event)

    # Special handling for second yellow card: automatically create red card
    if event.event_type == "yellow_card":
        # Check if player already has a yellow card in this match
        existing_yellow_cards = db.query(MatchEvent).filter(
            MatchEvent.fixture_id == fixture_id,
            MatchEvent.player_id == event.player_id,
            MatchEvent.event_type == "yellow_card",
            MatchEvent.id != db_event.id  # Exclude the current event we just added
        ).count()

        # If this is their second yellow card, automatically create a red card
        if existing_yellow_cards >= 1:  # They already had 1, now they have 2
            # Commit the yellow card first so we can get its created_at time
            db.commit()

            # Create red card with a timestamp slightly after the yellow card
            from datetime import datetime, timedelta
            red_card_event = MatchEvent(
                fixture_id=fixture_id,
                player_id=event.player_id,
                event_type="red_card",
                minute=event.minute,
                half=event.half,
                extra_info="Second yellow card",
                created_by=current_user.id
            )
            # Set the created_at to be slightly after the yellow card for proper ordering
            red_card_event.created_at = datetime.utcnow() + timedelta(seconds=1)
            db.add(red_card_event)

            # Mark player as sent off instead of removing from lineup
            lineup_entry = db.query(Lineup).filter(
                Lineup.fixture_id == fixture_id,
                Lineup.player_id == event.player_id
            ).first()
            if lineup_entry:
                lineup_entry.sent_off = True

    # Special handling for red card: mark player as sent off instead of removing from lineup
    if event.event_type == "red_card":
        # Find the player's lineup entry for this fixture
        lineup_entry = db.query(Lineup).filter(
            Lineup.fixture_id == fixture_id,
            Lineup.player_id == event.player_id
        ).first()

        if lineup_entry:
            # Mark the player as sent off instead of removing them from lineup
            lineup_entry.sent_off = True

    # Special handling for goal: automatically update fixture score
    if event.event_type == "goal":
        # Determine which team scored by checking if the player belongs to home or away team
        if player.team_id == fixture.home_team_id:
            # Home team scored
            fixture.home_score = (fixture.home_score or 0) + 1
        elif player.team_id == fixture.away_team_id:
            # Away team scored
            fixture.away_score = (fixture.away_score or 0) + 1

    db.commit()
    db.refresh(db_event)

    # Recalculate player minutes after event creation
    calculate_player_minutes(fixture_id, db)

    # Return event with player info
    return EventResponse(
        id=db_event.id,
        fixture_id=db_event.fixture_id,
        player_id=db_event.player_id,
        player_name=player.name,
        player_position=player.position,
        player_birth_date=player.birth_date,
        team_code=player.team.team_code_name if player.team else None,
        event_type=db_event.event_type,
        minute=db_event.minute,
        half=db_event.half,
        extra_info=db_event.extra_info,
        created_by=db_event.created_by,
        tagger_name=current_user.username,
        created_at=db_event.created_at,
        is_admin_corrected=db_event.is_admin_corrected or False
    )

@router.get("/fixtures/{fixture_id}/events", response_model=List[EventResponse])
async def get_fixture_events(fixture_id: int, db: Session = Depends(get_db)):
    """Get all events for a fixture, ordered by when they were recorded (created_at timestamp)"""
    events = db.query(MatchEvent).options(
        joinedload(MatchEvent.player).joinedload(Player.team),
        joinedload(MatchEvent.creator)
    ).filter(
        MatchEvent.fixture_id == fixture_id
    ).order_by(
        desc(MatchEvent.created_at)
    ).all()

    return [
        EventResponse(
            id=event.id,
            fixture_id=event.fixture_id,
            player_id=event.player_id,
            player_name=event.player.name,
            player_position=event.player.position,
            player_birth_date=event.player.birth_date,
            team_code=event.player.team.team_code_name if event.player and event.player.team else None,
            event_type=event.event_type,
            minute=event.minute,
            half=event.half,
            extra_info=event.extra_info,
            created_by=event.created_by,
            tagger_name=event.creator.username if event.creator else "Unknown",
            created_at=event.created_at,
            is_admin_corrected=event.is_admin_corrected or False
        )
        for event in events
    ]

@router.put("/events/{event_id}", response_model=EventResponse)
async def update_event(event_id: int, event_data: CreateEventRequest, db: Session = Depends(get_db), current_user: User = Depends(require_tagger_or_admin)):
    """Update a match event"""
    event = db.query(MatchEvent).filter(MatchEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Validate player exists
    player = db.query(Player).options(joinedload(Player.team)).filter(Player.id == event_data.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Validate event type
    valid_events = ["goal", "assist", "yellow_card", "red_card", "substitution_in", "substitution_out", "penalty_miss", "penalty_saved"]
    if event_data.event_type not in valid_events:
        raise HTTPException(status_code=400, detail=f"Invalid event type. Must be one of: {', '.join(valid_events)}")

    # Store old event type for comparison
    old_event_type = event.event_type
    old_player_id = event.player_id

    # Track changes for reward calculation
    original_tagger_id = event.created_by
    changes_made = []

    if event.player_id != event_data.player_id:
        changes_made.append(f"player_id: {event.player_id} → {event_data.player_id}")
    if event.event_type != event_data.event_type:
        changes_made.append(f"event_type: {event.event_type} → {event_data.event_type}")
    if event.minute != event_data.minute:
        changes_made.append(f"minute: {event.minute} → {event_data.minute}")
    if event.half != event_data.half:
        changes_made.append(f"half: {event.half} → {event_data.half}")
    if event.extra_info != event_data.extra_info:
        changes_made.append(f"extra_info: {event.extra_info} → {event_data.extra_info}")

    # Update event
    event.player_id = event_data.player_id
    event.event_type = event_data.event_type
    event.minute = event_data.minute
    event.half = event_data.half
    event.extra_info = event_data.extra_info
    # Track who modified this event
    event.modified_by = current_user.id

    # Handle red card logic
    if event_data.event_type == "red_card" and old_event_type != "red_card":
        # Event changed TO red card - mark player as sent off
        lineup_entry = db.query(Lineup).filter(
            Lineup.fixture_id == event.fixture_id,
            Lineup.player_id == event_data.player_id
        ).first()
        if lineup_entry:
            lineup_entry.sent_off = True
    elif old_event_type == "red_card" and event_data.event_type != "red_card":
        # Event changed FROM red card to something else - unmark sent off status
        lineup_entry = db.query(Lineup).filter(
            Lineup.fixture_id == event.fixture_id,
            Lineup.player_id == event_data.player_id
        ).first()
        if lineup_entry:
            lineup_entry.sent_off = False

    # Handle goal scoring changes
    fixture = db.query(Fixture).filter(Fixture.id == event.fixture_id).first()
    old_player = db.query(Player).options(joinedload(Player.team)).filter(Player.id == old_player_id).first()
    new_player = db.query(Player).options(joinedload(Player.team)).filter(Player.id == event_data.player_id).first()

    if fixture and old_player and new_player:
        # Handle removal of old goal (if it was a goal)
        if old_event_type == "goal":
            if old_player.team_id == fixture.home_team_id:
                fixture.home_score = max(0, (fixture.home_score or 0) - 1)
            elif old_player.team_id == fixture.away_team_id:
                fixture.away_score = max(0, (fixture.away_score or 0) - 1)

        # Handle addition of new goal (if it's now a goal)
        if event_data.event_type == "goal":
            if new_player.team_id == fixture.home_team_id:
                fixture.home_score = (fixture.home_score or 0) + 1
            elif new_player.team_id == fixture.away_team_id:
                fixture.away_score = (fixture.away_score or 0) + 1

    db.commit()
    db.refresh(event)

    # Log the edit for reward tracking if changes were made by admin
    if changes_made and original_tagger_id and current_user.role == "super_admin" and original_tagger_id != current_user.id:
        reward_service = RewardService(db)
        reward_service.log_event_edit(
            event_id=event.id,
            original_tagger_id=original_tagger_id,
            editor_id=current_user.id,
            edit_type="correction",
            field_changed="multiple" if len(changes_made) > 1 else changes_made[0].split(":")[0] if changes_made else None,
            old_value="; ".join(changes_made),
            new_value="Event updated by admin",
            correction_reason="Admin correction",
            severity="minor"
        )

    # Recalculate player minutes after event update
    calculate_player_minutes(event.fixture_id, db)

    # Get creator info
    creator = db.query(User).filter(User.id == event.created_by).first() if event.created_by else None

    # Return event with player info
    return EventResponse(
        id=event.id,
        fixture_id=event.fixture_id,
        player_id=event.player_id,
        player_name=player.name,
        player_position=player.position,
        player_birth_date=player.birth_date,
        team_code=player.team.team_code_name if player and player.team else None,
        event_type=event.event_type,
        minute=event.minute,
        half=event.half,
        extra_info=event.extra_info,
        created_by=event.created_by,
        tagger_name=creator.username if creator else "Unknown",
        created_at=event.created_at,
        is_admin_corrected=event.is_admin_corrected or False
    )

@router.delete("/events/{event_id}")
async def delete_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_tagger_or_admin)):
    """Delete a match event"""
    event = db.query(MatchEvent).filter(MatchEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Get fixture and player information before deleting the event
    fixture = db.query(Fixture).filter(Fixture.id == event.fixture_id).first()
    player = db.query(Player).filter(Player.id == event.player_id).first()

    # Special handling for goal deletion: automatically update fixture score
    if event.event_type == "goal" and fixture and player:
        # Determine which team scored and decrement the score
        if player.team_id == fixture.home_team_id:
            # Home team goal being removed
            fixture.home_score = max(0, (fixture.home_score or 0) - 1)
        elif player.team_id == fixture.away_team_id:
            # Away team goal being removed
            fixture.away_score = max(0, (fixture.away_score or 0) - 1)

    # Note: If deleting a red card event, the player would need to be manually
    # added back to the lineup if desired, as we don't store their original position
    # This prevents automatic re-addition that might be incorrect

    # Store information before deleting event
    fixture_id = event.fixture_id
    original_tagger_id = event.created_by
    event_info = f"{event.event_type} by {player.name if player else 'Unknown'} at {event.minute}'"

    # Log the deletion for reward tracking if deleted by admin
    if original_tagger_id and current_user.role == "super_admin" and original_tagger_id != current_user.id:
        reward_service = RewardService(db)
        reward_service.log_event_edit(
            event_id=event.id,
            original_tagger_id=original_tagger_id,
            editor_id=current_user.id,
            edit_type="deletion",
            field_changed="entire_event",
            old_value=event_info,
            new_value="DELETED",
            correction_reason="Event deleted by admin",
            severity="major"
        )

    db.delete(event)
    db.commit()

    # Recalculate player minutes after event deletion
    calculate_player_minutes(fixture_id, db)

    return {"message": "Event deleted successfully"}

@router.get("/fixtures/{fixture_id}/player-minutes")
async def get_player_minutes(fixture_id: int, db: Session = Depends(get_db)):
    """Get minutes played for all players in a fixture"""

    # First recalculate to ensure up-to-date data
    player_minutes = calculate_player_minutes(fixture_id, db)

    # Get updated lineup data with player info
    lineups = db.query(Lineup).options(
        joinedload(Lineup.player)
    ).filter(
        Lineup.fixture_id == fixture_id
    ).all()

    # Format response
    result = []
    for lineup in lineups:
        result.append({
            "player_id": lineup.player_id,
            "player_name": lineup.player.name,
            "player_position": lineup.player.position,
            "is_starter": lineup.is_starter,
            "position_played": lineup.position_played,
            "team_id": lineup.team_id
        })

    return result
