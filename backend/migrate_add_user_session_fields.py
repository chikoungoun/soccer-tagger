#!/usr/bin/env python3
"""
Migration script to add missing fields to user_sessions table
"""

import sqlite3
from pathlib import Path

def migrate_database():
    """Add missing fields to user_sessions table"""
    db_path = Path("./soccer_manager.db")

    if not db_path.exists():
        print("Database file not found. No migration needed.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check existing columns
        cursor.execute("PRAGMA table_info(user_sessions)")
        existing_columns = [column[1] for column in cursor.fetchall()]

        # List of new columns to add with their definitions
        new_columns = [
            ("country", "TEXT"),
            ("country_code", "TEXT"),
            ("region", "TEXT"),
            ("city", "TEXT"),
            ("latitude", "REAL"),
            ("longitude", "REAL"),
            ("timezone", "TEXT"),
            ("pages_visited", "INTEGER DEFAULT 0"),
            ("actions_performed", "INTEGER DEFAULT 0"),
            ("session_duration", "INTEGER DEFAULT 0")
        ]

        # Add missing columns
        added_count = 0
        for column_name, column_type in new_columns:
            if column_name not in existing_columns:
                print(f"Adding column {column_name}...")
                cursor.execute(f"ALTER TABLE user_sessions ADD COLUMN {column_name} {column_type}")
                added_count += 1

        if added_count == 0:
            print("All columns already exist in user_sessions table.")
        else:
            print(f"Added {added_count} new columns to user_sessions table.")

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