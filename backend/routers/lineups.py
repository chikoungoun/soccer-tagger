from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from database import get_db
from models import Lineup, Fixture, Team, Player, User
from auth import get_current_active_user, require_tagger_or_admin
from schemas import (
    Lineup as LineupSchema,
    LineupCreate,
    LineupUpdate,
    LineupWithPlayer,
    TeamLineup,
    FixtureWithLineups
)

router = APIRouter()

@router.get("/fixture/{fixture_id}", response_model=FixtureWithLineups)
def get_fixture_lineups(fixture_id: int, db: Session = Depends(get_db)):
    """Get fixture with complete lineups for both teams"""
    fixture = db.query(Fixture).options(
        joinedload(Fixture.home_team),
        joinedload(Fixture.away_team),
        joinedload(Fixture.lineups).joinedload(Lineup.player)
    ).filter(Fixture.id == fixture_id).first()

    if fixture is None:
        raise HTTPException(status_code=404, detail="Fixture not found")

    # Organize lineups by team
    home_lineups = [l for l in fixture.lineups if l.team_id == fixture.home_team_id]
    away_lineups = [l for l in fixture.lineups if l.team_id == fixture.away_team_id]

    # Separate starters and substitutes
    home_starters = [l for l in home_lineups if l.is_starter]
    home_subs = [l for l in home_lineups if not l.is_starter]
    away_starters = [l for l in away_lineups if l.is_starter]
    away_subs = [l for l in away_lineups if not l.is_starter]

    # Build response
    fixture_dict = {
        "id": fixture.id,
        "gameweek_id": fixture.gameweek_id,
        "home_team_id": fixture.home_team_id,
        "away_team_id": fixture.away_team_id,
        "match_date": fixture.match_date,
        "venue": fixture.venue,
        "status": fixture.status,
        "home_score": fixture.home_score,
        "away_score": fixture.away_score,
        "created_at": fixture.created_at,
        "updated_at": fixture.updated_at,
        "home_team": fixture.home_team,
        "away_team": fixture.away_team,
        "home_lineup": {
            "team_id": fixture.home_team_id,
            "team": fixture.home_team,
            "starters": home_starters,
            "substitutes": home_subs
        } if home_lineups else None,
        "away_lineup": {
            "team_id": fixture.away_team_id,
            "team": fixture.away_team,
            "starters": away_starters,
            "substitutes": away_subs
        } if away_lineups else None
    }

    return fixture_dict

@router.post("/", response_model=LineupSchema)
def create_lineup(lineup: LineupCreate, db: Session = Depends(get_db), current_user: User = Depends(require_tagger_or_admin)):
    """Add a player to a fixture lineup"""
    # Verify fixture exists
    fixture = db.query(Fixture).filter(Fixture.id == lineup.fixture_id).first()
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")

    # Verify team is part of the fixture
    if lineup.team_id not in [fixture.home_team_id, fixture.away_team_id]:
        raise HTTPException(status_code=400, detail="Team is not part of this fixture")

    # Verify player belongs to the team
    player = db.query(Player).filter(
        Player.id == lineup.player_id,
        Player.team_id == lineup.team_id
    ).first()
    if not player:
        raise HTTPException(status_code=400, detail="Player not found or doesn't belong to this team")

    # Check if player is already in the lineup
    existing = db.query(Lineup).filter(
        Lineup.fixture_id == lineup.fixture_id,
        Lineup.player_id == lineup.player_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Player is already in the lineup")

    # Check lineup limits (11 starters max per team)
    if lineup.is_starter:
        starter_count = db.query(Lineup).filter(
            Lineup.fixture_id == lineup.fixture_id,
            Lineup.team_id == lineup.team_id,
            Lineup.is_starter == True
        ).count()
        if starter_count >= 11:
            raise HTTPException(status_code=400, detail="Team already has 11 starters")

    db_lineup = Lineup(**lineup.dict())
    db.add(db_lineup)
    db.commit()
    db.refresh(db_lineup)
    return db_lineup

@router.put("/{lineup_id}", response_model=LineupSchema)
def update_lineup(lineup_id: int, lineup_update: LineupUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_tagger_or_admin)):
    """Update a lineup entry"""
    db_lineup = db.query(Lineup).filter(Lineup.id == lineup_id).first()
    if db_lineup is None:
        raise HTTPException(status_code=404, detail="Lineup entry not found")

    # If changing to starter, check team starter limit
    if lineup_update.is_starter is True and not db_lineup.is_starter:
        starter_count = db.query(Lineup).filter(
            Lineup.fixture_id == db_lineup.fixture_id,
            Lineup.team_id == db_lineup.team_id,
            Lineup.is_starter == True
        ).count()
        if starter_count >= 11:
            raise HTTPException(status_code=400, detail="Team already has 11 starters")

    update_data = lineup_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_lineup, field, value)

    db.commit()
    db.refresh(db_lineup)
    return db_lineup

@router.delete("/{lineup_id}")
def delete_lineup(lineup_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_tagger_or_admin)):
    """Remove a player from lineup"""
    db_lineup = db.query(Lineup).filter(Lineup.id == lineup_id).first()
    if db_lineup is None:
        raise HTTPException(status_code=404, detail="Lineup entry not found")

    db.delete(db_lineup)
    db.commit()
    return {"message": "Player removed from lineup successfully"}

@router.delete("/fixture/{fixture_id}/team/{team_id}")
def clear_team_lineup(fixture_id: int, team_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_tagger_or_admin)):
    """Clear all lineup entries for a team in a fixture"""
    # Verify fixture exists and team is part of it
    fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")

    if team_id not in [fixture.home_team_id, fixture.away_team_id]:
        raise HTTPException(status_code=400, detail="Team is not part of this fixture")

    # Delete all lineup entries for this team in this fixture
    deleted_count = db.query(Lineup).filter(
        Lineup.fixture_id == fixture_id,
        Lineup.team_id == team_id
    ).delete()

    db.commit()
    return {"message": f"Cleared lineup for team (removed {deleted_count} players)"}

@router.post("/fixture/{fixture_id}/team/{team_id}/bulk", response_model=List[LineupSchema])
def set_team_lineup(
    fixture_id: int,
    team_id: int,
    lineups: List[LineupCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tagger_or_admin)
):
    """Set complete lineup for a team (replaces existing lineup)"""
    # Verify fixture exists and team is part of it
    fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")

    if team_id not in [fixture.home_team_id, fixture.away_team_id]:
        raise HTTPException(status_code=400, detail="Team is not part of this fixture")

    # Validate lineup data
    starters = [l for l in lineups if l.is_starter]
    if len(starters) > 11:
        raise HTTPException(status_code=400, detail="Cannot have more than 11 starters")

    # Verify all players belong to the team
    player_ids = [l.player_id for l in lineups]
    valid_players = db.query(Player).filter(
        Player.id.in_(player_ids),
        Player.team_id == team_id
    ).count()

    if valid_players != len(player_ids):
        raise HTTPException(status_code=400, detail="Some players don't belong to this team")

    # Clear existing lineup for this team
    db.query(Lineup).filter(
        Lineup.fixture_id == fixture_id,
        Lineup.team_id == team_id
    ).delete()

    # Add new lineup entries
    db_lineups = []
    for lineup_data in lineups:
        # Ensure correct fixture_id and team_id
        lineup_dict = lineup_data.dict()
        lineup_dict["fixture_id"] = fixture_id
        lineup_dict["team_id"] = team_id

        db_lineup = Lineup(**lineup_dict)
        db.add(db_lineup)
        db_lineups.append(db_lineup)

    db.commit()

    # Query the created lineups to return fresh data with all relationships
    created_lineups = db.query(Lineup).filter(
        Lineup.fixture_id == fixture_id,
        Lineup.team_id == team_id
    ).all()

    return created_lineups