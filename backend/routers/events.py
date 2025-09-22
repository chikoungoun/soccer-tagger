from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List, Dict, Optional
from datetime import datetime, date
from database import get_db
from models import MatchEvent, MatchTimer, Player, Fixture, Lineup, User
from pydantic import BaseModel
from auth import get_current_active_user, require_tagger_or_admin

router = APIRouter()

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
    event_type: str
    minute: int
    half: int
    extra_info: Optional[str]
    created_at: datetime

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
    player = db.query(Player).filter(Player.id == event.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Validate event type
    valid_events = ["goal", "yellow_card", "red_card", "substitution_in", "substitution_out", "penalty_miss", "penalty_saved"]
    if event.event_type not in valid_events:
        raise HTTPException(status_code=400, detail=f"Invalid event type. Must be one of: {', '.join(valid_events)}")

    # Create event
    db_event = MatchEvent(
        fixture_id=fixture_id,
        player_id=event.player_id,
        event_type=event.event_type,
        minute=event.minute,
        half=event.half,
        extra_info=event.extra_info
    )

    db.add(db_event)

    # Special handling for red card: automatically remove player from lineup
    if event.event_type == "red_card":
        # Find the player's lineup entry for this fixture
        lineup_entry = db.query(Lineup).filter(
            Lineup.fixture_id == fixture_id,
            Lineup.player_id == event.player_id
        ).first()

        if lineup_entry:
            # Remove the player from the lineup (they're sent off)
            db.delete(lineup_entry)

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

    # Return event with player info
    return EventResponse(
        id=db_event.id,
        fixture_id=db_event.fixture_id,
        player_id=db_event.player_id,
        player_name=player.name,
        player_position=player.position,
        player_birth_date=player.birth_date,
        event_type=db_event.event_type,
        minute=db_event.minute,
        half=db_event.half,
        extra_info=db_event.extra_info,
        created_at=db_event.created_at
    )

@router.get("/fixtures/{fixture_id}/events", response_model=List[EventResponse])
async def get_fixture_events(fixture_id: int, db: Session = Depends(get_db)):
    """Get all events for a fixture, ordered by minute"""
    events = db.query(MatchEvent).options(
        joinedload(MatchEvent.player)
    ).filter(
        MatchEvent.fixture_id == fixture_id
    ).order_by(
        desc(MatchEvent.half),
        desc(MatchEvent.minute),
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
            event_type=event.event_type,
            minute=event.minute,
            half=event.half,
            extra_info=event.extra_info,
            created_at=event.created_at
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
    player = db.query(Player).filter(Player.id == event_data.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # Validate event type
    valid_events = ["goal", "yellow_card", "red_card", "substitution_in", "substitution_out", "penalty_miss", "penalty_saved"]
    if event_data.event_type not in valid_events:
        raise HTTPException(status_code=400, detail=f"Invalid event type. Must be one of: {', '.join(valid_events)}")

    # Store old event type for comparison
    old_event_type = event.event_type
    old_player_id = event.player_id

    # Update event
    event.player_id = event_data.player_id
    event.event_type = event_data.event_type
    event.minute = event_data.minute
    event.half = event_data.half
    event.extra_info = event_data.extra_info

    # Handle red card logic
    if event_data.event_type == "red_card" and old_event_type != "red_card":
        # Event changed TO red card - remove player from lineup
        lineup_entry = db.query(Lineup).filter(
            Lineup.fixture_id == event.fixture_id,
            Lineup.player_id == event_data.player_id
        ).first()
        if lineup_entry:
            db.delete(lineup_entry)
    elif old_event_type == "red_card" and event_data.event_type != "red_card":
        # Event changed FROM red card to something else
        # Note: We don't automatically add the player back to lineup as they might have been substituted
        # This would need manual intervention by the match manager
        pass

    # Handle goal scoring changes
    fixture = db.query(Fixture).filter(Fixture.id == event.fixture_id).first()
    old_player = db.query(Player).filter(Player.id == old_player_id).first()
    new_player = db.query(Player).filter(Player.id == event_data.player_id).first()

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

    # Return event with player info
    return EventResponse(
        id=event.id,
        fixture_id=event.fixture_id,
        player_id=event.player_id,
        player_name=player.name,
        player_position=player.position,
        player_birth_date=player.birth_date,
        event_type=event.event_type,
        minute=event.minute,
        half=event.half,
        extra_info=event.extra_info,
        created_at=event.created_at
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

    db.delete(event)
    db.commit()

    return {"message": "Event deleted successfully"}