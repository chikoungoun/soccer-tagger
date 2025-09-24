#!/usr/bin/env python3
"""
Migration script to add unique constraints to gameweeks table
"""

import sqlite3
from pathlib import Path

def migrate_database():
    """Add unique constraints to gameweeks table"""
    db_path = Path("./soccer_manager.db")

    if not db_path.exists():
        print("Database file not found. No migration needed.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        print("Adding unique constraints to gameweeks table...")

        # First, check for any duplicate week_numbers or codes
        cursor.execute("SELECT week_number, COUNT(*) as count FROM gameweeks GROUP BY week_number HAVING count > 1")
        duplicate_weeks = cursor.fetchall()

        if duplicate_weeks:
            print("Warning: Found duplicate week numbers:")
            for week_num, count in duplicate_weeks:
                print(f"  Week {week_num}: {count} occurrences")
            print("Please resolve duplicates manually before running this migration.")
            return

        cursor.execute("SELECT gameweek_code, COUNT(*) as count FROM gameweeks WHERE gameweek_code IS NOT NULL GROUP BY gameweek_code HAVING count > 1")
        duplicate_codes = cursor.fetchall()

        if duplicate_codes:
            print("Warning: Found duplicate gameweek codes:")
            for code, count in duplicate_codes:
                print(f"  Code {code}: {count} occurrences")
            print("Please resolve duplicates manually before running this migration.")
            return

        # SQLite doesn't support adding constraints to existing columns directly
        # We need to recreate the table with constraints

        # Step 1: Create new table with constraints
        cursor.execute('''
            CREATE TABLE gameweeks_new (
                id INTEGER PRIMARY KEY,
                week_number INTEGER NOT NULL UNIQUE,
                gameweek_code TEXT UNIQUE,
                name TEXT NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                is_active BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP
            )
        ''')

        # Step 2: Copy data from old table to new table
        cursor.execute('''
            INSERT INTO gameweeks_new
            SELECT id, week_number, gameweek_code, name, start_date, end_date, is_active, created_at, updated_at
            FROM gameweeks
        ''')

        # Step 3: Drop old table
        cursor.execute('DROP TABLE gameweeks')

        # Step 4: Rename new table
        cursor.execute('ALTER TABLE gameweeks_new RENAME TO gameweeks')

        # Step 5: Recreate the index on gameweek_code
        cursor.execute('CREATE INDEX idx_gameweeks_gameweek_code ON gameweeks(gameweek_code)')

        conn.commit()
        print("Unique constraints added successfully!")

        # Verify the constraints
        cursor.execute("SELECT id, week_number, gameweek_code, name FROM gameweeks ORDER BY week_number")
        all_gameweeks = cursor.fetchall()
        print(f"\nVerified {len(all_gameweeks)} gameweeks with unique constraints:")
        for gw_id, week_num, code, name in all_gameweeks:
            print(f"  {gw_id}: Week {week_num} - {name} ({code})")

    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()