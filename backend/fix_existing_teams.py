#!/usr/bin/env python3
"""
Script to add team codes to existing teams that don't have them
"""

import sqlite3
from pathlib import Path

def fix_existing_teams():
    """Add default team codes to existing teams"""
    db_path = Path("./soccer_manager.db")

    if not db_path.exists():
        print("Database file not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Get teams without team_code_name
        cursor.execute("SELECT id, name FROM teams WHERE team_code_name IS NULL OR team_code_name = ''")
        teams = cursor.fetchall()

        print(f"Found {len(teams)} teams without team codes")

        for team_id, team_name in teams:
            # Generate a simple code from the team name
            # Take first 3 characters and make uppercase
            code = team_name[:3].upper().replace(" ", "")

            # Make sure it's unique
            cursor.execute("SELECT COUNT(*) FROM teams WHERE team_code_name = ?", (code,))
            count = cursor.fetchone()[0]

            if count > 0:
                # If not unique, add team_id to make it unique
                code = f"{code}{team_id}"

            # Update the team
            cursor.execute("UPDATE teams SET team_code_name = ? WHERE id = ?", (code, team_id))
            print(f"Updated team '{team_name}' with code '{code}'")

        conn.commit()
        print("All teams updated successfully!")

        # Show all teams with their codes
        cursor.execute("SELECT id, name, team_code_name FROM teams")
        all_teams = cursor.fetchall()
        print("\nAll teams:")
        for team_id, name, code in all_teams:
            print(f"  {team_id}: {name} ({code})")

    except Exception as e:
        conn.rollback()
        print(f"Update failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    fix_existing_teams()