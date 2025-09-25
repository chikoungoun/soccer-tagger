from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional

# User schemas (defined early for forward references)
class UserBase(BaseModel):
    username: str
    email: str
    role: str = "tagger"
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class TeamBase(BaseModel):
    name: str
    team_code_name: str
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    founded_year: Optional[int] = None
    stadium: Optional[str] = None
    description: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    team_code_name: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    founded_year: Optional[int] = None
    stadium: Optional[str] = None
    description: Optional[str] = None

class Team(TeamBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    modified_by: Optional[int] = None

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
    modified_by: Optional[int] = None

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
    assigned_tagger_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    modified_by: Optional[int] = None

    class Config:
        from_attributes = True

class TeamWithPlayers(Team):
    players: List[Player] = []

class TeamWithPlayerCount(Team):
    player_count: int = 0

class FixtureWithTeams(Fixture):
    home_team: Team
    away_team: Team
    assigned_tagger: Optional['User'] = None

class GameweekBase(BaseModel):
    week_number: int
    gameweek_code: Optional[str] = None
    name: str
    start_date: date
    end_date: date
    is_active: bool = False

class GameweekCreate(GameweekBase):
    pass

class GameweekUpdate(BaseModel):
    week_number: Optional[int] = None
    gameweek_code: Optional[str] = None
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
    sent_off: bool = False

class LineupCreate(LineupBase):
    pass

class LineupUpdate(BaseModel):
    is_starter: Optional[bool] = None
    position_played: Optional[str] = None
    sent_off: Optional[bool] = None

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

# Pagination schemas
class PaginatedResponse(BaseModel):
    """Base pagination response model"""
    total: int
    page: int
    per_page: int
    pages: int
    has_next: bool
    has_prev: bool

class PaginatedFixtures(PaginatedResponse):
    """Paginated fixtures response"""
    fixtures: List[FixtureWithTeams] = []

# MatchEvent schemas
class MatchEventBase(BaseModel):
    fixture_id: int
    player_id: int
    event_type: str  # goal, assist, yellow_card, red_card, substitution_in, substitution_out, penalty_miss, penalty_saved
    minute: int
    half: int  # 1 for first half, 2 for second half
    extra_info: Optional[str] = None

class MatchEventCreate(MatchEventBase):
    pass

class MatchEventUpdate(BaseModel):
    player_id: Optional[int] = None
    event_type: Optional[str] = None
    minute: Optional[int] = None
    half: Optional[int] = None
    extra_info: Optional[str] = None

class MatchEvent(MatchEventBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    modified_by: Optional[int] = None

    # Accuracy tracking fields
    edit_count: int = 0
    is_admin_corrected: bool = False
    admin_correction_reason: Optional[str] = None

    class Config:
        from_attributes = True

# Edit tracking schemas
class EventEditLogBase(BaseModel):
    event_id: int
    original_tagger_id: int
    editor_id: int
    edit_type: str  # correction, enhancement, deletion, addition
    field_changed: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    correction_reason: Optional[str] = None
    severity: str = "minor"  # minor, major, critical

class EventEditLogCreate(EventEditLogBase):
    pass

class EventEditLog(EventEditLogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Reward tracking schemas
class MatchRewardBase(BaseModel):
    fixture_id: int
    tagger_id: int
    base_reward: float = 50.0

class MatchRewardCreate(MatchRewardBase):
    pass

class MatchReward(MatchRewardBase):
    id: int
    events_logged: int = 0
    admin_corrections: int = 0
    events_added_by_admin: int = 0
    events_removed_by_admin: int = 0
    price_per_event: float
    accuracy_percentage: float
    final_reward: float
    is_finalized: bool = False
    paid_out: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    finalized_at: Optional[datetime] = None

    class Config:
        from_attributes = True