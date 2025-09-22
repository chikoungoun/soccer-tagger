from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from database import get_db
from models import Team
from schemas import Team as TeamSchema, TeamCreate, TeamUpdate, TeamWithPlayers

router = APIRouter()

@router.get("/", response_model=List[TeamSchema])
def get_teams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    teams = db.query(Team).offset(skip).limit(limit).all()
    return teams

@router.get("/{team_id}", response_model=TeamWithPlayers)
def get_team(team_id: int, db: Session = Depends(get_db)):
    team = db.query(Team).options(joinedload(Team.players)).filter(Team.id == team_id).first()
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.post("/", response_model=TeamSchema)
def create_team(team: TeamCreate, db: Session = Depends(get_db)):
    db_team = Team(**team.dict())
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team

@router.put("/{team_id}", response_model=TeamSchema)
def update_team(team_id: int, team: TeamUpdate, db: Session = Depends(get_db)):
    db_team = db.query(Team).filter(Team.id == team_id).first()
    if db_team is None:
        raise HTTPException(status_code=404, detail="Team not found")

    for field, value in team.dict(exclude_unset=True).items():
        setattr(db_team, field, value)

    db.commit()
    db.refresh(db_team)
    return db_team

@router.delete("/{team_id}")
def delete_team(team_id: int, db: Session = Depends(get_db)):
    db_team = db.query(Team).filter(Team.id == team_id).first()
    if db_team is None:
        raise HTTPException(status_code=404, detail="Team not found")

    db.delete(db_team)
    db.commit()
    return {"message": "Team deleted successfully"}