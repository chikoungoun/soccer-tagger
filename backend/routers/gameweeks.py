from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date, datetime, time, timedelta
import random
from database import get_db
from models import Gameweek, Team, Fixture
from schemas import (
    Gameweek as GameweekSchema,
    GameweekCreate,
    GameweekUpdate,
    GameweekWithFixtures,
    FixtureCreate
)

router = APIRouter()

@router.get("/", response_model=List[GameweekSchema])
def get_gameweeks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    gameweeks = db.query(Gameweek).offset(skip).limit(limit).all()
    return gameweeks

@router.get("/{gameweek_id}", response_model=GameweekWithFixtures)
def get_gameweek(gameweek_id: int, db: Session = Depends(get_db)):
    gameweek = db.query(Gameweek).options(
        joinedload(Gameweek.fixtures).joinedload(Fixture.home_team),
        joinedload(Gameweek.fixtures).joinedload(Fixture.away_team)
    ).filter(Gameweek.id == gameweek_id).first()

    if gameweek is None:
        raise HTTPException(status_code=404, detail="Gameweek not found")
    return gameweek

@router.post("/", response_model=GameweekSchema)
def create_gameweek(gameweek: GameweekCreate, db: Session = Depends(get_db)):
    db_gameweek = Gameweek(**gameweek.dict())
    db.add(db_gameweek)
    db.commit()
    db.refresh(db_gameweek)
    return db_gameweek

@router.put("/{gameweek_id}", response_model=GameweekSchema)
def update_gameweek(gameweek_id: int, gameweek_update: GameweekUpdate, db: Session = Depends(get_db)):
    db_gameweek = db.query(Gameweek).filter(Gameweek.id == gameweek_id).first()
    if db_gameweek is None:
        raise HTTPException(status_code=404, detail="Gameweek not found")

    update_data = gameweek_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_gameweek, field, value)

    db.commit()
    db.refresh(db_gameweek)
    return db_gameweek

@router.delete("/{gameweek_id}")
def delete_gameweek(gameweek_id: int, db: Session = Depends(get_db)):
    db_gameweek = db.query(Gameweek).filter(Gameweek.id == gameweek_id).first()
    if db_gameweek is None:
        raise HTTPException(status_code=404, detail="Gameweek not found")

    db.delete(db_gameweek)
    db.commit()
    return {"message": "Gameweek deleted successfully"}

@router.post("/{gameweek_id}/generate-fixtures")
def generate_fixtures_for_gameweek(gameweek_id: int, db: Session = Depends(get_db)):
    """Generate 8 fixtures for a gameweek using all available teams"""
    gameweek = db.query(Gameweek).filter(Gameweek.id == gameweek_id).first()
    if gameweek is None:
        raise HTTPException(status_code=404, detail="Gameweek not found")

    # Check if gameweek already has the maximum number of fixtures (8)
    existing_fixtures = db.query(Fixture).filter(Fixture.gameweek_id == gameweek_id).count()
    if existing_fixtures >= 8:
        raise HTTPException(status_code=400, detail="This gameweek already has the maximum number of fixtures (8)")

    # Get all teams
    teams = db.query(Team).all()
    if len(teams) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 teams to generate fixtures")

    # Generate fixtures (unique pairings for up to 8 fixtures total)
    fixtures_created = []
    team_count = len(teams)
    max_fixtures = min(8, (team_count * (team_count - 1)) // 2)  # Maximum possible unique pairings

    # Get existing matchups to avoid duplicates
    existing_fixtures_data = db.query(Fixture).filter(Fixture.gameweek_id == gameweek_id).all()
    existing_pairings = set()
    for fixture in existing_fixtures_data:
        # Store both directions of the pairing
        existing_pairings.add((fixture.home_team_id, fixture.away_team_id))
        existing_pairings.add((fixture.away_team_id, fixture.home_team_id))

    # Generate all possible unique pairings
    all_pairings = []
    for i in range(team_count):
        for j in range(i + 1, team_count):
            home_id = teams[i].id
            away_id = teams[j].id
            # Check if this pairing already exists
            if (home_id, away_id) not in existing_pairings and (away_id, home_id) not in existing_pairings:
                all_pairings.append((i, j))

    # Shuffle to randomize and take remaining slots
    random.shuffle(all_pairings)
    remaining_slots = 8 - existing_fixtures
    fixtures_to_create = min(remaining_slots, len(all_pairings))

    for i in range(fixtures_to_create):
        home_team_idx, away_team_idx = all_pairings[i]

        # Create fixture at the start of the gameweek
        # Convert date to datetime and add hour offset
        hour_offset = 10 + ((existing_fixtures + i) * 2)  # Continue from where existing fixtures left off
        fixture_time = time(hour=hour_offset % 24)  # Ensure hour is within 0-23
        fixture_datetime = datetime.combine(gameweek.start_date, fixture_time)

        db_fixture = Fixture(
            gameweek_id=gameweek_id,
            home_team_id=teams[home_team_idx].id,
            away_team_id=teams[away_team_idx].id,
            match_date=fixture_datetime,
            status="scheduled",
            home_score=0,
            away_score=0
        )

        db.add(db_fixture)
        fixtures_created.append({
            "home_team": teams[home_team_idx].name,
            "away_team": teams[away_team_idx].name,
            "match_date": db_fixture.match_date
        })

    db.commit()

    total_fixtures = existing_fixtures + len(fixtures_created)
    return {
        "message": f"Added {len(fixtures_created)} new fixtures to gameweek {gameweek.name}. Total fixtures: {total_fixtures}/8",
        "fixtures": fixtures_created
    }

@router.patch("/{gameweek_id}/activate")
def activate_gameweek(gameweek_id: int, db: Session = Depends(get_db)):
    """Activate a gameweek and deactivate all others"""
    # Deactivate all gameweeks
    db.query(Gameweek).update({"is_active": False})

    # Activate the specified gameweek
    db_gameweek = db.query(Gameweek).filter(Gameweek.id == gameweek_id).first()
    if db_gameweek is None:
        raise HTTPException(status_code=404, detail="Gameweek not found")

    db_gameweek.is_active = True
    db.commit()
    db.refresh(db_gameweek)

    return {"message": f"Gameweek {db_gameweek.name} activated successfully"}