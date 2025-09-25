from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func
from typing import List
import math
from database import get_db
from models import Fixture, Team, User
from schemas import Fixture as FixtureSchema, FixtureCreate, FixtureUpdate, FixtureWithTeams, PaginatedFixtures
from auth import get_current_active_user, require_tagger_or_admin, require_super_admin
from utils.notification_manager import NotificationManager

router = APIRouter()

@router.get("/", response_model=PaginatedFixtures)
def get_fixtures(
    page: int = 1,
    per_page: int = 20,  # Reduced default from 100 to 20 for better performance
    team_id: int = None,
    status: str = None,
    gameweek_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tagger_or_admin)
):
    """Get paginated list of fixtures"""
    # Calculate offset from page number
    skip = (page - 1) * per_page

    # Use selectinload for better performance with multiple fixtures
    query = db.query(Fixture).options(
        selectinload(Fixture.home_team),
        selectinload(Fixture.away_team),
        selectinload(Fixture.assigned_tagger)
    )

    # Filter fixtures based on user role and assignment
    if current_user.role == "tagger":
        # Taggers see only fixtures assigned to them OR unassigned fixtures
        query = query.filter(
            (Fixture.assigned_tagger_id == current_user.id) | (Fixture.assigned_tagger_id.is_(None))
        )
    # Super admins see all fixtures (no additional filter)

    if team_id:
        query = query.filter(
            (Fixture.home_team_id == team_id) | (Fixture.away_team_id == team_id)
        )

    if status:
        query = query.filter(Fixture.status == status)

    if gameweek_id:
        query = query.filter(Fixture.gameweek_id == gameweek_id)

    # Get total count for pagination
    total = query.count()

    # Get fixtures for current page
    fixtures = query.order_by(Fixture.match_date.desc()).offset(skip).limit(per_page).all()

    # Calculate pagination metadata
    pages = math.ceil(total / per_page) if total > 0 else 1
    has_next = page < pages
    has_prev = page > 1

    return PaginatedFixtures(
        fixtures=fixtures,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
        has_next=has_next,
        has_prev=has_prev
    )

@router.get("/{fixture_id}", response_model=FixtureWithTeams)
def get_fixture(fixture_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_tagger_or_admin)):
    fixture = db.query(Fixture).options(
        joinedload(Fixture.home_team),
        joinedload(Fixture.away_team),
        joinedload(Fixture.assigned_tagger)
    ).filter(Fixture.id == fixture_id).first()

    if fixture is None:
        raise HTTPException(status_code=404, detail="Fixture not found")

    # Check if tagger has access to this fixture
    if current_user.role == "tagger":
        if fixture.assigned_tagger_id is not None and fixture.assigned_tagger_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied: fixture not assigned to you")

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
    # Track who created this fixture
    db_fixture.modified_by = current_user.id
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
def update_fixture(
    fixture_id: int,
    fixture_update: FixtureUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    if db_fixture is None:
        raise HTTPException(status_code=404, detail="Fixture not found")

    update_data = fixture_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_fixture, field, value)

    # Track who modified this fixture
    db_fixture.modified_by = current_user.id

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

@router.patch("/{fixture_id}/assign")
def assign_fixture(
    fixture_id: int,
    tagger_id: int = None,  # None to unassign
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Assign or unassign a fixture to a specific tagger (super_admin only)"""
    fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")

    if tagger_id is not None:
        # Validate tagger exists and has tagger role
        tagger = db.query(User).filter(User.id == tagger_id, User.role == "tagger", User.is_active == True).first()
        if not tagger:
            raise HTTPException(status_code=400, detail="Invalid tagger ID or tagger not active")

        fixture.assigned_tagger_id = tagger_id
        message = f"Fixture assigned to {tagger.username}"
    else:
        fixture.assigned_tagger_id = None
        message = "Fixture unassigned (available to all taggers)"

    db.commit()
    db.refresh(fixture)
    return {"message": message, "fixture": fixture}