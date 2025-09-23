from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from typing import List
import csv
import io
from datetime import datetime
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

@router.post("/import")
def import_players_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Import players from CSV file
    Expected CSV format: name,jersey_number,position,birth_date,nationality,team_name
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    try:
        # Read CSV content
        content = file.file.read()
        csv_data = io.StringIO(content.decode('utf-8'))
        csv_reader = csv.DictReader(csv_data)

        imported_players = []
        skipped_players = []
        failed_players = []

        for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 because row 1 is header
            try:
                # Validate required fields
                required_fields = ['name', 'jersey_number', 'position', 'team_name']
                for field in required_fields:
                    if not row.get(field, '').strip():
                        failed_players.append({
                            'row': row_num,
                            'data': row,
                            'error': f'{field} is required'
                        })
                        continue

                player_name = row['name'].strip()
                team_name = row['team_name'].strip()
                jersey_number = int(row['jersey_number'].strip())
                position = row['position'].strip().upper()

                # Validate position
                valid_positions = ["GK", "DF", "MF", "FW"]
                if position not in valid_positions:
                    failed_players.append({
                        'row': row_num,
                        'data': row,
                        'error': f'Position must be one of: {", ".join(valid_positions)}'
                    })
                    continue

                # Validate jersey number range
                if jersey_number < 1 or jersey_number > 99:
                    failed_players.append({
                        'row': row_num,
                        'data': row,
                        'error': 'Jersey number must be between 1 and 99'
                    })
                    continue

                # Check if team exists
                team = db.query(Team).filter(Team.name.ilike(f"%{team_name}%")).first()
                if not team:
                    failed_players.append({
                        'row': row_num,
                        'data': row,
                        'error': f'Team "{team_name}" not found'
                    })
                    continue

                # Check if player already exists (same name + team)
                existing_player = db.query(Player).filter(
                    Player.name.ilike(f"%{player_name}%"),
                    Player.team_id == team.id
                ).first()
                if existing_player:
                    skipped_players.append({
                        'row': row_num,
                        'data': row,
                        'reason': f'Player "{player_name}" already exists in {team.name}'
                    })
                    continue

                # Check if jersey number is already taken in the team
                existing_jersey = db.query(Player).filter(
                    Player.team_id == team.id,
                    Player.jersey_number == jersey_number,
                    Player.is_active == True
                ).first()
                if existing_jersey:
                    failed_players.append({
                        'row': row_num,
                        'data': row,
                        'error': f'Jersey number {jersey_number} is already taken by {existing_jersey.name} in {team.name}'
                    })
                    continue

                # Prepare player data
                player_data = {
                    'name': player_name,
                    'jersey_number': jersey_number,
                    'position': position,
                    'team_id': team.id,
                    'is_active': True
                }

                # Parse birth_date if provided
                if row.get('birth_date', '').strip():
                    try:
                        birth_date = datetime.strptime(row['birth_date'].strip(), '%Y-%m-%d').date()
                        player_data['birth_date'] = birth_date
                    except ValueError:
                        failed_players.append({
                            'row': row_num,
                            'data': row,
                            'error': 'Invalid birth_date format. Use YYYY-MM-DD'
                        })
                        continue

                # Add nationality if provided
                if row.get('nationality', '').strip():
                    player_data['nationality'] = row['nationality'].strip()

                # Create player
                db_player = Player(**player_data)
                db.add(db_player)
                db.commit()
                db.refresh(db_player)

                imported_players.append({
                    'row': row_num,
                    'player_id': db_player.id,
                    'name': db_player.name,
                    'jersey_number': db_player.jersey_number,
                    'team': team.name
                })

            except ValueError as e:
                failed_players.append({
                    'row': row_num,
                    'data': row,
                    'error': f'Invalid data: {str(e)}'
                })
            except Exception as e:
                db.rollback()
                failed_players.append({
                    'row': row_num,
                    'data': row,
                    'error': f'Database error: {str(e)}'
                })

        return {
            'message': 'CSV import completed',
            'summary': {
                'imported': len(imported_players),
                'skipped': len(skipped_players),
                'failed': len(failed_players)
            },
            'details': {
                'imported_players': imported_players,
                'skipped_players': skipped_players,
                'failed_players': failed_players
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")
    finally:
        file.file.close()