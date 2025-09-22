from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional

class TeamBase(BaseModel):
    name: str
    logo_url: Optional[str] = None
    founded_year: Optional[int] = None
    stadium: Optional[str] = None
    description: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    founded_year: Optional[int] = None
    stadium: Optional[str] = None
    description: Optional[str] = None

class Team(TeamBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PlayerBase(BaseModel):
    name: str
    jersey_number: int
    position: str
    age: Optional[int] = None
    birth_date: Optional[date] = None
    nationality: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: bool = True

class PlayerCreate(PlayerBase):
    team_id: int

class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    jersey_number: Optional[int] = None
    position: Optional[str] = None
    age: Optional[int] = None
    birth_date: Optional[date] = None
    nationality: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: Optional[bool] = None
    team_id: Optional[int] = None

class Player(PlayerBase):
    id: int
    team_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FixtureBase(BaseModel):
    match_date: datetime
    venue: Optional[str] = None

class FixtureCreate(FixtureBase):
    home_team_id: int
    away_team_id: int
    gameweek_id: Optional[int] = None

class FixtureUpdate(BaseModel):
    match_date: Optional[datetime] = None
    venue: Optional[str] = None
    status: Optional[str] = None
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    gameweek_id: Optional[int] = None

class Fixture(FixtureBase):
    id: int
    home_team_id: int
    away_team_id: int
    gameweek_id: Optional[int] = None
    status: str
    home_score: int
    away_score: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TeamWithPlayers(Team):
    players: List[Player] = []

class FixtureWithTeams(Fixture):
    home_team: Team
    away_team: Team

class GameweekBase(BaseModel):
    week_number: int
    name: str
    start_date: date
    end_date: date
    is_active: bool = False

class GameweekCreate(GameweekBase):
    pass

class GameweekUpdate(BaseModel):
    week_number: Optional[int] = None
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None

class Gameweek(GameweekBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class GameweekWithFixtures(Gameweek):
    fixtures: List[FixtureWithTeams] = []

class LineupBase(BaseModel):
    fixture_id: int
    team_id: int
    player_id: int
    is_starter: bool = True
    position_played: Optional[str] = None
    minutes_played: int = 0

class LineupCreate(LineupBase):
    pass

class LineupUpdate(BaseModel):
    is_starter: Optional[bool] = None
    position_played: Optional[str] = None
    minutes_played: Optional[int] = None

class Lineup(LineupBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LineupWithPlayer(Lineup):
    player: Player

class TeamLineup(BaseModel):
    team_id: int
    team: Team
    starters: List[LineupWithPlayer] = []
    substitutes: List[LineupWithPlayer] = []

class FixtureWithLineups(FixtureWithTeams):
    home_lineup: Optional[TeamLineup] = None
    away_lineup: Optional[TeamLineup] = None