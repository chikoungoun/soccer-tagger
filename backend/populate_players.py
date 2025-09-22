#!/usr/bin/env python3
"""
Script to populate teams with 20 players each using coherent positions.
"""

import requests
import json
from datetime import datetime, date
import random

BASE_URL = "http://localhost:8000/api"

def get_teams():
    """Get all teams from the API."""
    response = requests.get(f"{BASE_URL}/teams/")
    return response.json()

def create_player(player_data):
    """Create a single player."""
    response = requests.post(f"{BASE_URL}/players/",
                           headers={"Content-Type": "application/json"},
                           data=json.dumps(player_data))
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error creating player: {response.text}")
        return None

def generate_birth_date():
    """Generate a random birth date for a player (ages 18-35)."""
    current_year = datetime.now().year
    birth_year = random.randint(current_year - 35, current_year - 18)
    birth_month = random.randint(1, 12)
    birth_day = random.randint(1, 28)  # Use 28 to avoid month length issues
    return date(birth_year, birth_month, birth_day).isoformat()

def get_nationalities():
    """Return a list of common nationalities for variety."""
    return [
        "England", "Spain", "Germany", "France", "Italy", "Portugal",
        "Brazil", "Argentina", "Netherlands", "Belgium", "Croatia",
        "Poland", "Denmark", "Sweden", "Norway", "Switzerland",
        "Austria", "Czech Republic", "Serbia", "Ukraine", "Turkey",
        "Morocco", "Senegal", "Ghana", "Nigeria", "Egypt",
        "Japan", "South Korea", "Australia", "USA", "Canada",
        "Mexico", "Colombia", "Uruguay", "Chile", "Ecuador"
    ]

def create_team_players(team):
    """Create 20 players for a given team with coherent positions."""
    team_name = team['name'].replace(' ', '_').replace('FC', '').replace('United', '').replace('City', 'City').strip('_')

    # Define squad composition (20 players total)
    positions = [
        # Goalkeepers (3)
        {"position": "GK", "count": 3},
        # Defenders (7)
        {"position": "DF", "count": 7},
        # Midfielders (7)
        {"position": "MF", "count": 7},
        # Forwards (3)
        {"position": "FW", "count": 3}
    ]

    nationalities = get_nationalities()
    jersey_number = 1
    created_players = []

    print(f"Creating players for {team['name']}...")

    for pos_group in positions:
        for i in range(pos_group["count"]):
            player_data = {
                "name": f"{team_name}_{jersey_number}",
                "jersey_number": jersey_number,
                "position": pos_group["position"],
                "birth_date": generate_birth_date(),
                "nationality": random.choice(nationalities),
                "team_id": team["id"],
                "is_active": True
            }

            player = create_player(player_data)
            if player:
                created_players.append(player)
                print(f"  ✓ Created {player['name']} ({player['position']}, #{player['jersey_number']})")
            else:
                print(f"  ✗ Failed to create player #{jersey_number}")

            jersey_number += 1

    return created_players

def main():
    """Main function to populate all teams with players."""
    print("Starting player population script...")

    # Get all teams
    teams = get_teams()
    print(f"Found {len(teams)} teams")

    total_created = 0

    for team in teams:
        players = create_team_players(team)
        total_created += len(players)
        print(f"Created {len(players)} players for {team['name']}\n")

    print(f"✅ Population complete! Created {total_created} players total.")

if __name__ == "__main__":
    main()