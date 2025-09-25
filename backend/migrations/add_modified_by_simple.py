"""
Simple migration to add modified_by tracking columns (SQLite compatible)
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, inspect
from database import engine, SessionLocal

def run_migration():
    """Add modified_by columns to key tables"""

    db = SessionLocal()
    inspector = inspect(engine)

    try:
        print("Starting migration: Adding modified_by tracking columns...")

        # Check and add modified_by to teams table
        columns = [c['name'] for c in inspector.get_columns('teams')]
        if 'modified_by' not in columns:
            print("1. Adding modified_by to teams table...")
            db.execute(text("ALTER TABLE teams ADD COLUMN modified_by INTEGER"))
        else:
            print("1. modified_by already exists in teams table - skipping")

        # Check and add modified_by to players table
        columns = [c['name'] for c in inspector.get_columns('players')]
        if 'modified_by' not in columns:
            print("2. Adding modified_by to players table...")
            db.execute(text("ALTER TABLE players ADD COLUMN modified_by INTEGER"))
        else:
            print("2. modified_by already exists in players table - skipping")

        # Check and add modified_by to fixtures table
        columns = [c['name'] for c in inspector.get_columns('fixtures')]
        if 'modified_by' not in columns:
            print("3. Adding modified_by to fixtures table...")
            db.execute(text("ALTER TABLE fixtures ADD COLUMN modified_by INTEGER"))
        else:
            print("3. modified_by already exists in fixtures table - skipping")

        # Check and add updated_at to match_events table
        columns = [c['name'] for c in inspector.get_columns('match_events')]
        if 'updated_at' not in columns:
            print("4a. Adding updated_at to match_events table...")
            db.execute(text("ALTER TABLE match_events ADD COLUMN updated_at TIMESTAMP"))
        else:
            print("4a. updated_at already exists in match_events table - skipping")

        # Check and add modified_by to match_events table
        if 'modified_by' not in columns:
            print("4b. Adding modified_by to match_events table...")
            db.execute(text("ALTER TABLE match_events ADD COLUMN modified_by INTEGER"))
        else:
            print("4b. modified_by already exists in match_events table - skipping")

        # Create indexes for better query performance (only if they don't exist)
        print("5. Creating indexes on modified_by columns...")

        try:
            db.execute(text("CREATE INDEX idx_teams_modified_by ON teams(modified_by)"))
        except:
            print("   - Index idx_teams_modified_by already exists")

        try:
            db.execute(text("CREATE INDEX idx_players_modified_by ON players(modified_by)"))
        except:
            print("   - Index idx_players_modified_by already exists")

        try:
            db.execute(text("CREATE INDEX idx_fixtures_modified_by ON fixtures(modified_by)"))
        except:
            print("   - Index idx_fixtures_modified_by already exists")

        try:
            db.execute(text("CREATE INDEX idx_match_events_modified_by ON match_events(modified_by)"))
        except:
            print("   - Index idx_match_events_modified_by already exists")

        try:
            db.execute(text("CREATE INDEX idx_match_events_updated_at ON match_events(updated_at)"))
        except:
            print("   - Index idx_match_events_updated_at already exists")

        # Commit all changes
        db.commit()
        print("✅ Migration completed successfully!")
        print("\nAdded columns:")
        print("- teams.modified_by")
        print("- players.modified_by")
        print("- fixtures.modified_by")
        print("- match_events.updated_at")
        print("- match_events.modified_by")
        print("\nAdded indexes for better performance.")

    except Exception as e:
        db.rollback()
        print(f"❌ Migration failed: {str(e)}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()