from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Team, Player, Fixture
from datetime import datetime, timedelta

# Create tables
Base.metadata.create_all(bind=engine)

def create_sample_data():
    db = SessionLocal()
    try:
        # Check if data already exists
        if db.query(Team).first():
            print("Sample data already exists!")
            return

        # Create teams
        teams = [
            Team(
                name="Manchester United",
                founded_year=1878,
                stadium="Old Trafford",
                description="The Red Devils - one of the most successful clubs in English football"
            ),
            Team(
                name="Arsenal",
                founded_year=1886,
                stadium="Emirates Stadium",
                description="The Gunners - known for their attacking style of play"
            ),
            Team(
                name="Liverpool",
                founded_year=1892,
                stadium="Anfield",
                description="The Reds - famous for their passionate supporters"
            ),
            Team(
                name="Chelsea",
                founded_year=1905,
                stadium="Stamford Bridge",
                description="The Blues - known for their strong defense and tactical discipline"
            )
        ]

        for team in teams:
            db.add(team)
        db.commit()

        # Get team IDs
        team_ids = {team.name: team.id for team in db.query(Team).all()}

        # Create players
        players = [
            # Manchester United
            Player(name="Marcus Rashford", jersey_number=10, position="FW", age=26, nationality="England", team_id=team_ids["Manchester United"]),
            Player(name="Bruno Fernandes", jersey_number=8, position="MF", age=29, nationality="Portugal", team_id=team_ids["Manchester United"]),
            Player(name="Harry Maguire", jersey_number=5, position="DF", age=30, nationality="England", team_id=team_ids["Manchester United"]),
            Player(name="David de Gea", jersey_number=1, position="GK", age=32, nationality="Spain", team_id=team_ids["Manchester United"]),

            # Arsenal
            Player(name="Bukayo Saka", jersey_number=7, position="FW", age=22, nationality="England", team_id=team_ids["Arsenal"]),
            Player(name="Martin Ødegaard", jersey_number=8, position="MF", age=24, nationality="Norway", team_id=team_ids["Arsenal"]),
            Player(name="William Saliba", jersey_number=2, position="DF", age=22, nationality="France", team_id=team_ids["Arsenal"]),
            Player(name="Aaron Ramsdale", jersey_number=1, position="GK", age=25, nationality="England", team_id=team_ids["Arsenal"]),

            # Liverpool
            Player(name="Mohamed Salah", jersey_number=11, position="FW", age=31, nationality="Egypt", team_id=team_ids["Liverpool"]),
            Player(name="Jordan Henderson", jersey_number=14, position="MF", age=33, nationality="England", team_id=team_ids["Liverpool"]),
            Player(name="Virgil van Dijk", jersey_number=4, position="DF", age=32, nationality="Netherlands", team_id=team_ids["Liverpool"]),
            Player(name="Alisson Becker", jersey_number=1, position="GK", age=30, nationality="Brazil", team_id=team_ids["Liverpool"]),

            # Chelsea
            Player(name="Raheem Sterling", jersey_number=17, position="FW", age=28, nationality="England", team_id=team_ids["Chelsea"]),
            Player(name="Enzo Fernández", jersey_number=5, position="MF", age=22, nationality="Argentina", team_id=team_ids["Chelsea"]),
            Player(name="Thiago Silva", jersey_number=6, position="DF", age=39, nationality="Brazil", team_id=team_ids["Chelsea"]),
            Player(name="Kepa Arrizabalaga", jersey_number=1, position="GK", age=29, nationality="Spain", team_id=team_ids["Chelsea"])
        ]

        for player in players:
            db.add(player)
        db.commit()

        # Create fixtures
        base_date = datetime.now()
        fixtures = [
            # Past fixtures (completed)
            Fixture(
                home_team_id=team_ids["Manchester United"],
                away_team_id=team_ids["Arsenal"],
                match_date=base_date - timedelta(days=7),
                venue="Old Trafford",
                status="completed",
                home_score=2,
                away_score=1
            ),
            Fixture(
                home_team_id=team_ids["Liverpool"],
                away_team_id=team_ids["Chelsea"],
                match_date=base_date - timedelta(days=5),
                venue="Anfield",
                status="completed",
                home_score=3,
                away_score=0
            ),

            # Current fixtures (live)
            Fixture(
                home_team_id=team_ids["Arsenal"],
                away_team_id=team_ids["Liverpool"],
                match_date=base_date - timedelta(hours=1),
                venue="Emirates Stadium",
                status="live",
                home_score=1,
                away_score=1
            ),

            # Future fixtures (scheduled)
            Fixture(
                home_team_id=team_ids["Chelsea"],
                away_team_id=team_ids["Manchester United"],
                match_date=base_date + timedelta(days=3),
                venue="Stamford Bridge",
                status="scheduled",
                home_score=0,
                away_score=0
            ),
            Fixture(
                home_team_id=team_ids["Arsenal"],
                away_team_id=team_ids["Chelsea"],
                match_date=base_date + timedelta(days=7),
                venue="Emirates Stadium",
                status="scheduled",
                home_score=0,
                away_score=0
            ),
            Fixture(
                home_team_id=team_ids["Liverpool"],
                away_team_id=team_ids["Manchester United"],
                match_date=base_date + timedelta(days=14),
                venue="Anfield",
                status="scheduled",
                home_score=0,
                away_score=0
            )
        ]

        for fixture in fixtures:
            db.add(fixture)
        db.commit()

        print("Sample data created successfully!")
        print(f"Created {len(teams)} teams")
        print(f"Created {len(players)} players")
        print(f"Created {len(fixtures)} fixtures")

    except Exception as e:
        print(f"Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_data()