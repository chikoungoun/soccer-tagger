from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Date
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

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
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
    week_number = Column(Integer, nullable=False)
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    fixture = relationship("Fixture")
    player = relationship("Player")

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