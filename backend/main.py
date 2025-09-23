from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
from routers import teams, players, fixtures, gameweeks, lineups, uploads, events, auth
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Soccer Team Manager API",
    description="API for managing soccer teams, players, and fixtures",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,  # This is important for httpOnly cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
uploads_dir = "uploads"
os.makedirs(uploads_dir, exist_ok=True)

# Mount static files for serving images
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(fixtures.router, prefix="/api/fixtures", tags=["fixtures"])
app.include_router(gameweeks.router, prefix="/api/gameweeks", tags=["gameweeks"])
app.include_router(lineups.router, prefix="/api/lineups", tags=["lineups"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["uploads"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])

@app.get("/")
async def root():
    return {"message": "Soccer Team Manager API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}