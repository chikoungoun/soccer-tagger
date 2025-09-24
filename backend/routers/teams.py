from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from typing import List
import csv
import io
from database import get_db
from models import Team, Player
from schemas import Team as TeamSchema, TeamCreate, TeamUpdate, TeamWithPlayers, TeamWithPlayerCount

router = APIRouter()

@router.get("/", response_model=List[TeamWithPlayerCount])
def get_teams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    from sqlalchemy import func

    # Get teams first
    teams = db.query(Team).offset(skip).limit(limit).all()

    # Convert to list with player counts
    result = []
    for team in teams:
        # Get player count for this team
        player_count = db.query(func.count(Player.id)).filter(Player.team_id == team.id).scalar() or 0

        team_dict = {
            'id': team.id,
            'name': team.name,
            'team_code_name': getattr(team, 'team_code_name', None),
            'logo_url': team.logo_url,
            'primary_color': team.primary_color,
            'secondary_color': team.secondary_color,
            'founded_year': team.founded_year,
            'stadium': team.stadium,
            'description': team.description,
            'created_at': team.created_at,
            'updated_at': team.updated_at,
            'player_count': player_count
        }
        result.append(team_dict)

    return result

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

@router.post("/import")
def import_teams_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Import teams from CSV file
    Expected CSV format: name,team_code_name,founded_year,stadium,description
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    try:
        # Read CSV content
        content = file.file.read()
        csv_data = io.StringIO(content.decode('utf-8'))
        csv_reader = csv.DictReader(csv_data)

        imported_teams = []
        skipped_teams = []
        failed_teams = []

        for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 because row 1 is header
            try:
                # Validate required field
                if not row.get('name', '').strip():
                    failed_teams.append({
                        'row': row_num,
                        'data': row,
                        'error': 'Team name is required'
                    })
                    continue

                team_name = row['name'].strip()

                # Check if team already exists (case-insensitive)
                existing_team = db.query(Team).filter(Team.name.ilike(f"%{team_name}%")).first()
                if existing_team:
                    skipped_teams.append({
                        'row': row_num,
                        'data': row,
                        'reason': f'Team "{team_name}" already exists'
                    })
                    continue

                # Validate team_code_name
                if not row.get('team_code_name', '').strip():
                    failed_teams.append({
                        'row': row_num,
                        'data': row,
                        'error': 'Team code name is required'
                    })
                    continue

                team_code_name = row['team_code_name'].strip().upper()

                # Check if team code already exists
                existing_code = db.query(Team).filter(Team.team_code_name == team_code_name).first()
                if existing_code:
                    skipped_teams.append({
                        'row': row_num,
                        'data': row,
                        'reason': f'Team code "{team_code_name}" already exists'
                    })
                    continue

                # Prepare team data
                team_data = {
                    'name': team_name,
                    'team_code_name': team_code_name,
                    'founded_year': int(row['founded_year']) if row.get('founded_year', '').strip() else None,
                    'stadium': row.get('stadium', '').strip() or None,
                    'description': row.get('description', '').strip() or None
                }

                # Create team
                db_team = Team(**team_data)
                db.add(db_team)
                db.commit()
                db.refresh(db_team)

                imported_teams.append({
                    'row': row_num,
                    'team_id': db_team.id,
                    'name': db_team.name
                })

            except ValueError as e:
                failed_teams.append({
                    'row': row_num,
                    'data': row,
                    'error': f'Invalid data: {str(e)}'
                })
            except Exception as e:
                failed_teams.append({
                    'row': row_num,
                    'data': row,
                    'error': f'Database error: {str(e)}'
                })

        return {
            'message': 'CSV import completed',
            'summary': {
                'imported': len(imported_teams),
                'skipped': len(skipped_teams),
                'failed': len(failed_teams)
            },
            'details': {
                'imported_teams': imported_teams,
                'skipped_teams': skipped_teams,
                'failed_teams': failed_teams
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")
    finally:
        file.file.close()