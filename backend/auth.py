from datetime import datetime, timedelta
from typing import Optional, Union
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from database import get_db
from models import User
import os
from dotenv import load_dotenv
import warnings

# Load environment variables
load_dotenv()

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY or SECRET_KEY == "your-secret-key-change-this-in-production":
    warnings.warn(
        "SECURITY WARNING: Using insecure JWT secret key! Set JWT_SECRET_KEY environment variable.",
        UserWarning,
        stacklevel=2
    )
    SECRET_KEY = "insecure-fallback-key-for-development-only"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def authenticate_user(db: Session, username: str, password: str) -> Union[User, bool]:
    """Authenticate a user by username and password"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_token_from_cookie(request: Request) -> str:
    """Extract token from httpOnly cookie"""
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No access token found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token

async def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Get the current authenticated user from JWT token in cookie"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = get_token_from_cookie(request)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except (JWTError, HTTPException):
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception

    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get the current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_user_optional(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    """Get the current user if authenticated, or None if not authenticated"""
    try:
        token = request.cookies.get("access_token")
        if not token:
            return None

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None

        user = db.query(User).filter(User.username == username).first()
        return user
    except (JWTError, Exception):
        return None

def require_role(required_role: str):
    """Dependency factory for role-based access control"""
    def role_checker(current_user: User = Depends(get_current_active_user)):
        if current_user.role == "super_admin":
            # Super admin has access to everything
            return current_user
        elif current_user.role == required_role:
            return current_user
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    return role_checker

# Pre-defined role dependencies
require_super_admin = require_role("super_admin")
require_tagger = require_role("tagger")

def require_any_role(*roles):
    """Dependency factory for allowing multiple roles"""
    def role_checker(current_user: User = Depends(get_current_active_user)):
        if current_user.role == "super_admin":
            # Super admin has access to everything
            return current_user
        elif current_user.role in roles:
            return current_user
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    return role_checker

# Combined role dependency for tagger operations
require_tagger_or_admin = require_any_role("tagger", "super_admin")