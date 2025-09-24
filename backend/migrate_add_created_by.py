#!/usr/bin/env python3
"""
Migration script to add created_by column to match_events table
This script adds the created_by column to existing events and sets it to NULL
(since we don't know who created historical events)
"""

import sqlite3
from pathlib import Path

def migrate_database():
    """Add created_by column to match_events table"""
    db_path = Path("./soccer_manager.db")

    if not db_path.exists():
        print("Database file not found. No migration needed.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if created_by column already exists
        cursor.execute("PRAGMA table_info(match_events)")
        columns = [column[1] for column in cursor.fetchall()]

        if 'created_by' in columns:
            print("created_by column already exists. No migration needed.")
            return

        # Add the created_by column
        print("Adding created_by column to match_events table...")
        cursor.execute("""
            ALTER TABLE match_events
            ADD COLUMN created_by INTEGER
            REFERENCES users(id)
        """)

        conn.commit()
        print("Migration completed successfully!")
        print("Note: Existing events will have created_by = NULL (unknown creator)")

    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()