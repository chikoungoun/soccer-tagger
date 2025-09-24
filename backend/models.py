from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Date, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="tagger", nullable=False)  # "super_admin" or "tagger"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    team_code_name = Column(String(10), unique=True, index=True, nullable=True)  # Short code like MUN, LIV, ARS
    logo_url = Column(String(255), nullable=True)
    primary_color = Column(String(7), nullable=True)  # Hex color code like #FF0000
    secondary_color = Column(String(7), nullable=True)  # Hex color code like #0000FF
    founded_year = Column(Integer, nullable=True)
    stadium = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    players = relationship("Player", back_populates="team", cascade="all, delete-orphan")
    home_fixtures = relationship("Fixture", foreign_keys="Fixture.home_team_id", back_populates="home_team")
    away_fixtures = relationship("Fixture", foreign_keys="Fixture.away_team_id", back_populates="away_team")

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    jersey_number = Column(Integer, nullable=False)
    position = Column(String(50), nullable=False)  # GK, DF, MF, FW
    age = Column(Integer, nullable=True)
    birth_date = Column(Date, nullable=True)
    nationality = Column(String(50), nullable=True)
    photo_url = Column(String(255), nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    team = relationship("Team", back_populates="players")

class Gameweek(Base):
    __tablename__ = "gameweeks"

    id = Column(Integer, primary_key=True, index=True)
    week_number = Column(Integer, nullable=False, unique=True)  # Unique week numbers
    gameweek_code = Column(String(10), nullable=True, unique=True, index=True)  # Unique codes e.g., "GW1", "GW2"
    name = Column(String(100), nullable=False)  # e.g., "Gameweek 1", "Week 1"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    fixtures = relationship("Fixture", back_populates="gameweek", cascade="all, delete-orphan")

class Fixture(Base):
    __tablename__ = "fixtures"

    id = Column(Integer, primary_key=True, index=True)
    gameweek_id = Column(Integer, ForeignKey("gameweeks.id"), nullable=True)  # Optional for backwards compatibility
    home_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    away_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    match_date = Column(DateTime, nullable=False)
    venue = Column(String(100), nullable=True)
    status = Column(String(20), default="scheduled")  # scheduled, live, completed, cancelled
    home_score = Column(Integer, default=0)
    away_score = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    gameweek = relationship("Gameweek", back_populates="fixtures")
    home_team = relationship("Team", foreign_keys=[home_team_id], back_populates="home_fixtures")
    away_team = relationship("Team", foreign_keys=[away_team_id], back_populates="away_fixtures")
    lineups = relationship("Lineup", back_populates="fixture", cascade="all, delete-orphan")

class Lineup(Base):
    __tablename__ = "lineups"

    id = Column(Integer, primary_key=True, index=True)
    fixture_id = Column(Integer, ForeignKey("fixtures.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    is_starter = Column(Boolean, default=True)  # True for starting XI, False for substitutes
    position_played = Column(String(50), nullable=True)  # Position for this specific match (can differ from player's main position)
    formation = Column(String(10), nullable=True)  # Formation like "4-4-2", "3-5-2"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    fixture = relationship("Fixture", back_populates="lineups")
    team = relationship("Team")
    player = relationship("Player")

class MatchEvent(Base):
    __tablename__ = "match_events"

    id = Column(Integer, primary_key=True, index=True)
    fixture_id = Column(Integer, ForeignKey("fixtures.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    event_type = Column(String(50), nullable=False)  # goal, yellow_card, red_card, substitution_in, substitution_out, penalty_miss, penalty_saved
    minute = Column(Integer, nullable=False)  # Minute of the event (1-90+)
    half = Column(Integer, nullable=False)  # 1 for first half, 2 for second half
    extra_info = Column(Text, nullable=True)  # Additional info like assist, reason for card, etc.
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # User who created the event
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    fixture = relationship("Fixture")
    player = relationship("Player")
    creator = relationship("User")

class MatchTimer(Base):
    __tablename__ = "match_timers"

    id = Column(Integer, primary_key=True, index=True)
    fixture_id = Column(Integer, ForeignKey("fixtures.id"), nullable=False, unique=True)
    current_half = Column(Integer, default=0)  # 0: not started, 1: first half, 2: second half
    half_start_time = Column(DateTime, nullable=True)  # When current half started
    is_paused = Column(Boolean, default=False)
    pause_time = Column(DateTime, nullable=True)  # When timer was paused
    total_pause_duration = Column(Integer, default=0)  # Total pause duration in seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    fixture = relationship("Fixture")

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_token = Column(String(255), unique=True, index=True, nullable=False)
    login_time = Column(DateTime(timezone=True), server_default=func.now())
    logout_time = Column(DateTime(timezone=True), nullable=True)
    last_activity = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

    # Device and browser information
    ip_address = Column(String(45), nullable=True)  # Support both IPv4 and IPv6
    user_agent = Column(Text, nullable=True)
    device_type = Column(String(50), nullable=True)  # mobile, desktop, tablet
    browser_name = Column(String(100), nullable=True)
    browser_version = Column(String(50), nullable=True)
    os_name = Column(String(100), nullable=True)
    os_version = Column(String(50), nullable=True)
    screen_resolution = Column(String(20), nullable=True)  # e.g., "1920x1080"

    # Geolocation information
    country = Column(String(100), nullable=True)
    country_code = Column(String(2), nullable=True)  # ISO 3166-1 alpha-2
    region = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    timezone = Column(String(50), nullable=True)

    # Session metrics
    pages_visited = Column(Integer, default=0)
    actions_performed = Column(Integer, default=0)
    session_duration = Column(Integer, default=0)  # in seconds

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="sessions")

class UserActivity(Base):
    __tablename__ = "user_activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("user_sessions.id"), nullable=True)
    activity_type = Column(String(50), nullable=False)  # page_visit, action, api_call
    page_url = Column(String(500), nullable=True)
    action_name = Column(String(100), nullable=True)  # click, form_submit, search, etc.
    additional_data = Column(Text, nullable=True)  # JSON string for extra data
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    session = relationship("UserSession")

class LoginAttempt(Base):
    __tablename__ = "login_attempts"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False)
    ip_address = Column(String(45), nullable=False)
    user_agent = Column(Text, nullable=True)
    success = Column(Boolean, nullable=False)
    failure_reason = Column(String(100), nullable=True)  # invalid_username, invalid_password, account_locked
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # If successful, link to user
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)  # fixture_created, gameweek_created, match_assigned, etc.
    is_read = Column(Boolean, default=False)

    # Optional reference to related entities
    fixture_id = Column(Integer, ForeignKey("fixtures.id"), nullable=True)
    gameweek_id = Column(Integer, ForeignKey("gameweeks.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User")
    fixture = relationship("Fixture")
    gameweek = relationship("Gameweek")