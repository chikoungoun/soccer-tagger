"""
Database migration to add modified_by tracking columns
Run this script to add audit trail functionality to key tables
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine, SessionLocal

def run_migration():
    """Add modified_by columns to teams, players, fixtures, and match_events tables"""

    db = SessionLocal()

    try:
        print("Starting migration: Adding modified_by tracking columns...")

        # Add modified_by column to teams table
        print("1. Adding modified_by to teams table...")
        db.execute(text("""
            ALTER TABLE teams
            ADD COLUMN modified_by INTEGER REFERENCES users(id)
        """))

        # Add modified_by column to players table
        print("2. Adding modified_by to players table...")
        db.execute(text("""
            ALTER TABLE players
            ADD COLUMN modified_by INTEGER REFERENCES users(id)
        """))

        # Add modified_by column to fixtures table
        print("3. Adding modified_by to fixtures table...")
        db.execute(text("""
            ALTER TABLE fixtures
            ADD COLUMN modified_by INTEGER REFERENCES users(id)
        """))

        # Add updated_at and modified_by columns to match_events table
        print("4a. Adding updated_at to match_events table...")
        db.execute(text("""
            ALTER TABLE match_events
            ADD COLUMN updated_at TIMESTAMP
        """))

        print("4b. Adding modified_by to match_events table...")
        db.execute(text("""
            ALTER TABLE match_events
            ADD COLUMN modified_by INTEGER REFERENCES users(id)
        """))

        # Create indexes for better query performance
        print("5. Creating indexes on modified_by columns...")
        db.execute(text("CREATE INDEX idx_teams_modified_by ON teams(modified_by)"))
        db.execute(text("CREATE INDEX idx_players_modified_by ON players(modified_by)"))
        db.execute(text("CREATE INDEX idx_fixtures_modified_by ON fixtures(modified_by)"))
        db.execute(text("CREATE INDEX idx_match_events_modified_by ON match_events(modified_by)"))
        db.execute(text("CREATE INDEX idx_match_events_updated_at ON match_events(updated_at)"))

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

def rollback_migration():
    """Rollback the migration by removing the added columns"""

    db = SessionLocal()

    try:
        print("Rolling back migration: Removing modified_by tracking columns...")

        # Remove indexes first
        print("1. Removing indexes...")
        db.execute(text("DROP INDEX IF EXISTS idx_teams_modified_by"))
        db.execute(text("DROP INDEX IF EXISTS idx_players_modified_by"))
        db.execute(text("DROP INDEX IF EXISTS idx_fixtures_modified_by"))
        db.execute(text("DROP INDEX IF EXISTS idx_match_events_modified_by"))
        db.execute(text("DROP INDEX IF EXISTS idx_match_events_updated_at"))

        # Remove columns
        print("2. Removing modified_by from teams table...")
        db.execute(text("ALTER TABLE teams DROP COLUMN IF EXISTS modified_by"))

        print("3. Removing modified_by from players table...")
        db.execute(text("ALTER TABLE players DROP COLUMN IF EXISTS modified_by"))

        print("4. Removing modified_by from fixtures table...")
        db.execute(text("ALTER TABLE fixtures DROP COLUMN IF EXISTS modified_by"))

        print("5. Removing updated_at and modified_by from match_events table...")
        db.execute(text("ALTER TABLE match_events DROP COLUMN IF EXISTS updated_at"))
        db.execute(text("ALTER TABLE match_events DROP COLUMN IF EXISTS modified_by"))

        db.commit()
        print("✅ Rollback completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Rollback failed: {str(e)}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Add modified_by tracking to database tables')
    parser.add_argument('--rollback', action='store_true', help='Rollback the migration')
    args = parser.parse_args()

    if args.rollback:
        rollback_migration()
    else:
        run_migration()