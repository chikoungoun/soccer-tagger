import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from typing import Dict
import shutil

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
TEAM_LOGOS_DIR = os.path.join(UPLOAD_DIR, "team_logos")
PLAYER_PHOTOS_DIR = os.path.join(UPLOAD_DIR, "player_photos")

for directory in [UPLOAD_DIR, TEAM_LOGOS_DIR, PLAYER_PHOTOS_DIR]:
    os.makedirs(directory, exist_ok=True)

# Allowed image extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def validate_image(file: UploadFile) -> None:
    """Validate uploaded image file"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    # Check file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Check file size (this is approximate since we're reading content)
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )

def generate_filename(original_filename: str) -> str:
    """Generate unique filename preserving extension"""
    file_ext = os.path.splitext(original_filename)[1].lower()
    unique_id = str(uuid.uuid4())
    return f"{unique_id}{file_ext}"

@router.post("/team-logo")
async def upload_team_logo(file: UploadFile = File(...)) -> Dict[str, str]:
    """Upload team logo image"""
    validate_image(file)

    try:
        # Generate unique filename
        filename = generate_filename(file.filename)
        file_path = os.path.join(TEAM_LOGOS_DIR, filename)

        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Return the URL path (without the uploads/ prefix since we'll serve it)
        logo_url = f"/uploads/team_logos/{filename}"

        return {
            "message": "Team logo uploaded successfully",
            "logo_url": logo_url,
            "filename": filename
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

@router.post("/player-photo")
async def upload_player_photo(file: UploadFile = File(...)) -> Dict[str, str]:
    """Upload player photo image"""
    validate_image(file)

    try:
        # Generate unique filename
        filename = generate_filename(file.filename)
        file_path = os.path.join(PLAYER_PHOTOS_DIR, filename)

        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Return the URL path
        photo_url = f"/uploads/player_photos/{filename}"

        return {
            "message": "Player photo uploaded successfully",
            "photo_url": photo_url,
            "filename": filename
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

@router.get("/team_logos/{filename}")
async def get_team_logo(filename: str):
    """Serve team logo files"""
    file_path = os.path.join(TEAM_LOGOS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

@router.get("/player_photos/{filename}")
async def get_player_photo(filename: str):
    """Serve player photo files"""
    file_path = os.path.join(PLAYER_PHOTOS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

@router.delete("/team_logos/{filename}")
async def delete_team_logo(filename: str) -> Dict[str, str]:
    """Delete team logo file"""
    file_path = os.path.join(TEAM_LOGOS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        os.remove(file_path)
        return {"message": "Team logo deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

@router.delete("/player_photos/{filename}")
async def delete_player_photo(filename: str) -> Dict[str, str]:
    """Delete player photo file"""
    file_path = os.path.join(PLAYER_PHOTOS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        os.remove(file_path)
        return {"message": "Player photo deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")