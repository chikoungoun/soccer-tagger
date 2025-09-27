from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Get database URL from environment variable or default to SQLite
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./soccer_manager.db?timezone=Africa/Casablanca")

# Different connection args for SQLite vs PostgreSQL
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={
            "check_same_thread": False,
            "timeout": 20,  # Prevent long-running queries from blocking
        },
        pool_size=10,  # Connection pool size
        max_overflow=20,  # Additional connections beyond pool_size
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=3600,  # Recycle connections every hour
        echo=False  # Set to True for SQL query debugging
    )
else:
    # PostgreSQL configuration
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()