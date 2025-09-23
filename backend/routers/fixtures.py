from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from database import get_db
from models import Fixture, Team, User
from schemas import Fixture as FixtureSchema, FixtureCreate, FixtureUpdate, FixtureWithTeams
from auth import get_current_active_user
from utils.notification_manager import NotificationManager

router = APIRouter()

@router.get("/", response_model=List[FixtureWithTeams])
def get_fixtures(skip: int = 0, limit: int = 100, team_id: int = None, status: str = None, db: Session = Depends(get_db)):
    query = db.query(Fixture).options(
        joinedload(Fixture.home_team),
        joinedload(Fixture.away_team)
    )

    if team_id:
        query = query.filter(
            (Fixture.home_team_id == team_id) | (Fixture.away_team_id == team_id)
        )

    if status:
        query = query.filter(Fixture.status == status)

    fixtures = query.order_by(Fixture.match_date.desc()).offset(skip).limit(limit).all()
    return fixtures

@router.get("/{fixture_id}", response_model=FixtureWithTeams)
def get_fixture(fixture_id: int, db: Session = Depends(get_db)):
    fixture = db.query(Fixture).options(
        joinedload(Fixture.home_team),
        joinedload(Fixture.away_team)
    ).filter(Fixture.id == fixture_id).first()

    if fixture is None:
        raise HTTPException(status_code=404, detail="Fixture not found")
    return fixture

@router.post("/", response_model=FixtureSchema)
def create_fixture(
    fixture: FixtureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if both teams exist
    home_team = db.query(Team).filter(Team.id == fixture.home_team_id).first()
    away_team = db.query(Team).filter(Team.id == fixture.away_team_id).first()

    if home_team is None:
        raise HTTPException(status_code=404, detail="Home team not found")
    if away_team is None:
        raise HTTPException(status_code=404, detail="Away team not found")
    if fixture.home_team_id == fixture.away_team_id:
        raise HTTPException(status_code=400, detail="A team cannot play against itself")

    db_fixture = Fixture(**fixture.dict())
    db.add(db_fixture)
    db.commit()
    db.refresh(db_fixture)

    # Load relationships for notification
    db.refresh(db_fixture)
    db_fixture = db.query(Fixture).options(
        joinedload(Fixture.home_team),
        joinedload(Fixture.away_team)
    ).filter(Fixture.id == db_fixture.id).first()

    # Create notifications for fixture creation
    NotificationManager.notify_fixture_created(db, db_fixture, current_user.id)

    return db_fixture

@router.put("/{fixture_id}", response_model=FixtureSchema)
def update_fixture(fixture_id: int, fixture_update: FixtureUpdate, db: Session = Depends(get_db)):
    db_fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    if db_fixture is None:
        raise HTTPException(status_code=404, detail="Fixture not found")

    update_data = fixture_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_fixture, field, value)

    db.commit()
    db.refresh(db_fixture)
    return db_fixture

@router.patch("/{fixture_id}/score")
def update_score(
    fixture_id: int,
    home_score: int,
    away_score: int,
    db: Session = Depends(get_db)
):
    db_fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    if db_fixture is None:
        raise HTTPException(status_code=404, detail="Fixture not found")

    db_fixture.home_score = home_score
    db_fixture.away_score = away_score
    if db_fixture.status == "scheduled":
        db_fixture.status = "live"

    db.commit()
    db.refresh(db_fixture)
    return {"message": "Score updated successfully", "fixture": db_fixture}

@router.patch("/{fixture_id}/complete")
def complete_fixture(fixture_id: int, db: Session = Depends(get_db)):
    db_fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    if db_fixture is None:
        raise HTTPException(status_code=404, detail="Fixture not found")

    db_fixture.status = "completed"
    db.commit()
    db.refresh(db_fixture)
    return {"message": "Fixture completed", "fixture": db_fixture}

@router.delete("/{fixture_id}")
def delete_fixture(fixture_id: int, db: Session = Depends(get_db)):
    db_fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    if db_fixture is None:
        raise HTTPException(status_code=404, detail="Fixture not found")

    db.delete(db_fixture)
    db.commit()
    return {"message": "Fixture deleted successfully"}