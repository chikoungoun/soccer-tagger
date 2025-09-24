#!/usr/bin/env python3
"""
Migration script to add team_code_name and formation columns
"""

import sqlite3
from pathlib import Path

def migrate_database():
    """Add team_code_name to teams table and formation to lineups table"""
    db_path = Path("./soccer_manager.db")

    if not db_path.exists():
        print("Database file not found. No migration needed.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if team_code_name column already exists in teams table
        cursor.execute("PRAGMA table_info(teams)")
        team_columns = [column[1] for column in cursor.fetchall()]

        if 'team_code_name' not in team_columns:
            print("Adding team_code_name column to teams table...")
            cursor.execute("""
                ALTER TABLE teams
                ADD COLUMN team_code_name TEXT
            """)
        else:
            print("team_code_name column already exists in teams table.")

        # Check if formation column already exists in lineups table
        cursor.execute("PRAGMA table_info(lineups)")
        lineup_columns = [column[1] for column in cursor.fetchall()]

        if 'formation' not in lineup_columns:
            print("Adding formation column to lineups table...")
            cursor.execute("""
                ALTER TABLE lineups
                ADD COLUMN formation TEXT
            """)
        else:
            print("formation column already exists in lineups table.")

        conn.commit()
        print("Migration completed successfully!")

    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()