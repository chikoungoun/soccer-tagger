from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
from routers import teams, players, fixtures, gameweeks, lineups, uploads, events, auth, dashboard
from middleware.security import SecurityHeadersMiddleware
from middleware.cache import CacheMiddleware, get_cache_stats
import os
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Load environment variables
load_dotenv()

# Initialize global rate limiter
limiter = Limiter(key_func=get_remote_address)

# Set timezone to Morocco/Casablanca
os.environ['TZ'] = 'Africa/Casablanca'

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Soccer Team Manager API",
    description="API for managing soccer teams, players, and fixtures",
    version="1.0.0"
)

# Add rate limit state and error handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add security headers middleware (should be early in the chain)
app.add_middleware(SecurityHeadersMiddleware)

# Add caching middleware (before CORS for better performance)
app.add_middleware(CacheMiddleware, cache_ttl_seconds=300)

# Add compression middleware (responses > 500 bytes will be compressed)
app.add_middleware(GZipMiddleware, minimum_size=500)

# Get CORS origins from environment or use secure defaults
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,  # Restrict to specific origins
    allow_credentials=True,  # This is important for httpOnly cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],  # Specific methods only
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],  # Specific headers only
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
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

@app.get("/")
async def root():
    return {"message": "Soccer Team Manager API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/cache-stats")
async def cache_stats():
    """Get cache statistics for monitoring."""
    return get_cache_stats()