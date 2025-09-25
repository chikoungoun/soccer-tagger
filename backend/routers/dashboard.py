from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Team, Player, Fixture, User
from auth import require_tagger_or_admin, get_current_user_optional
from sqlalchemy import func
from typing import List, Dict, Any, Optional

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Get dashboard statistics optimized for performance.
    Returns essential counts without full object data.
    """
    try:
        # Count totals using database aggregation (much faster than loading all objects)
        team_count = db.query(func.count(Team.id)).scalar()
        player_count = db.query(func.count(Player.id)).scalar()

        # Fixture counts - only fetch if user is authenticated
        fixture_count = 0
        live_matches = 0
        recent_fixtures = []

        if current_user:
            fixture_count = db.query(func.count(Fixture.id)).scalar()
            live_matches = db.query(func.count(Fixture.id)).filter(Fixture.status == 'live').scalar()

            # Get 5 most recent fixtures with minimal data
            recent_fixtures_query = (
                db.query(
                    Fixture.id,
                    Fixture.home_score,
                    Fixture.away_score,
                    Fixture.match_date,
                    Fixture.status,
                    Fixture.home_team_id,
                    Fixture.away_team_id
                )
                .order_by(Fixture.match_date.desc())
                .limit(5)
            )

            recent_fixtures_raw = recent_fixtures_query.all()

            # Get team names for recent fixtures (batch query)
            if recent_fixtures_raw:
                team_ids = set()
                for fixture in recent_fixtures_raw:
                    team_ids.add(fixture.home_team_id)
                    team_ids.add(fixture.away_team_id)

                teams_data = db.query(Team.id, Team.name).filter(Team.id.in_(team_ids)).all()
                teams_map = {team.id: team.name for team in teams_data}

                # Build recent fixtures response
                recent_fixtures = []
                for fixture in recent_fixtures_raw:
                    recent_fixtures.append({
                        "id": fixture.id,
                        "home_score": fixture.home_score,
                        "away_score": fixture.away_score,
                        "match_date": fixture.match_date.isoformat(),
                        "status": fixture.status,
                        "home_team": {
                            "id": fixture.home_team_id,
                            "name": teams_map.get(fixture.home_team_id, "Unknown Team")
                        },
                        "away_team": {
                            "id": fixture.away_team_id,
                            "name": teams_map.get(fixture.away_team_id, "Unknown Team")
                        }
                    })

        return {
            "stats": {
                "total_teams": team_count,
                "total_players": player_count,
                "total_fixtures": fixture_count,
                "live_matches": live_matches
            },
            "recent_fixtures": recent_fixtures
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard data: {str(e)}")