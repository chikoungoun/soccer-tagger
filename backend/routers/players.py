from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from database import get_db
from models import Player, Team
from schemas import Player as PlayerSchema, PlayerCreate, PlayerUpdate

router = APIRouter()

@router.get("/", response_model=List[PlayerSchema])
def get_players(skip: int = 0, limit: int = 100, team_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Player)
    if team_id:
        query = query.filter(Player.team_id == team_id)
    players = query.offset(skip).limit(limit).all()
    return players

@router.get("/{player_id}", response_model=PlayerSchema)
def get_player(player_id: int, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@router.post("/", response_model=PlayerSchema)
def create_player(player: PlayerCreate, db: Session = Depends(get_db)):
    try:
        # Check if team exists
        team = db.query(Team).filter(Team.id == player.team_id).first()
        if team is None:
            raise HTTPException(status_code=404, detail="Team not found")

        # Check if jersey number is already taken in the team
        existing_player = db.query(Player).filter(
            Player.team_id == player.team_id,
            Player.jersey_number == player.jersey_number,
            Player.is_active == True
        ).first()
        if existing_player:
            raise HTTPException(status_code=400, detail=f"Jersey number {player.jersey_number} is already taken by {existing_player.name} in this team")

        # Validate jersey number
        if player.jersey_number < 1 or player.jersey_number > 99:
            raise HTTPException(status_code=400, detail="Jersey number must be between 1 and 99")

        # Validate position
        valid_positions = ["GK", "DF", "MF", "FW"]
        if player.position not in valid_positions:
            raise HTTPException(status_code=400, detail=f"Position must be one of: {', '.join(valid_positions)}")

        db_player = Player(**player.dict())
        db.add(db_player)
        db.commit()
        db.refresh(db_player)
        return db_player
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error creating player: {str(e)}")

@router.put("/{player_id}", response_model=PlayerSchema)
def update_player(player_id: int, player_update: PlayerUpdate, db: Session = Depends(get_db)):
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if db_player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    update_data = player_update.dict(exclude_unset=True)

    # Check jersey number conflict if updating
    if "jersey_number" in update_data or "team_id" in update_data:
        team_id = update_data.get("team_id", db_player.team_id)
        jersey_number = update_data.get("jersey_number", db_player.jersey_number)

        existing_player = db.query(Player).filter(
            Player.team_id == team_id,
            Player.jersey_number == jersey_number,
            Player.is_active == True,
            Player.id != player_id
        ).first()
        if existing_player:
            # Get team name for better error message
            from models import Team
            team = db.query(Team).filter(Team.id == team_id).first()
            team_name = team.name if team else f"Team {team_id}"
            raise HTTPException(
                status_code=400,
                detail=f"Jersey number {jersey_number} is already taken by {existing_player.name} in {team_name}. Please choose a different jersey number for the transfer."
            )

    for field, value in update_data.items():
        setattr(db_player, field, value)

    db.commit()
    db.refresh(db_player)
    return db_player

@router.delete("/{player_id}")
def delete_player(player_id: int, db: Session = Depends(get_db)):
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if db_player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    db.delete(db_player)
    db.commit()
    return {"message": "Player deleted successfully"}