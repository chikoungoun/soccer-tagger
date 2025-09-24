#!/usr/bin/env python3
"""
Migration script to add gameweek_code column to gameweeks table
"""

import sqlite3
from pathlib import Path

def migrate_database():
    """Add gameweek_code column to gameweeks table"""
    db_path = Path("./soccer_manager.db")

    if not db_path.exists():
        print("Database file not found. No migration needed.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if gameweek_code column already exists
        cursor.execute("PRAGMA table_info(gameweeks)")
        columns = [column[1] for column in cursor.fetchall()]

        if 'gameweek_code' not in columns:
            print("Adding gameweek_code column to gameweeks table...")
            cursor.execute("""
                ALTER TABLE gameweeks
                ADD COLUMN gameweek_code TEXT
            """)
        else:
            print("gameweek_code column already exists.")

        # Update existing gameweeks with codes based on week_number
        cursor.execute("SELECT id, week_number, gameweek_code FROM gameweeks WHERE gameweek_code IS NULL OR gameweek_code = ''")
        gameweeks = cursor.fetchall()

        print(f"Found {len(gameweeks)} gameweeks without codes")

        for gameweek_id, week_number, current_code in gameweeks:
            new_code = f"GW{week_number}"

            # Check if this code already exists
            cursor.execute("SELECT COUNT(*) FROM gameweeks WHERE gameweek_code = ? AND id != ?", (new_code, gameweek_id))
            count = cursor.fetchone()[0]

            if count > 0:
                # If not unique, add gameweek_id to make it unique
                new_code = f"GW{week_number}_{gameweek_id}"

            # Update the gameweek
            cursor.execute("UPDATE gameweeks SET gameweek_code = ? WHERE id = ?", (new_code, gameweek_id))
            print(f"Updated gameweek {gameweek_id} (Week {week_number}) with code '{new_code}'")

        conn.commit()
        print("Migration completed successfully!")

        # Show all gameweeks with their codes
        cursor.execute("SELECT id, week_number, name, gameweek_code FROM gameweeks ORDER BY week_number")
        all_gameweeks = cursor.fetchall()
        print("\nAll gameweeks:")
        for gw_id, week_num, name, code in all_gameweeks:
            print(f"  {gw_id}: Week {week_num} - {name} ({code})")

    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()