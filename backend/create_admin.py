#!/usr/bin/env python3
"""
Script to create an initial super admin user
Usage: python create_admin.py
"""

from database import get_db, SessionLocal
from models import User
from auth import get_password_hash

def create_super_admin():
    """Create the initial super admin user"""
    db = SessionLocal()

    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.username == "admin").first()
        if admin:
            print("Super admin user already exists!")
            return

        # Create super admin user
        admin_user = User(
            username="admin",
            email="admin@soccermanager.com",
            hashed_password=get_password_hash("admin123"),
            role="super_admin",
            is_active=True
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print("Super admin user created successfully!")
        print("Username: admin")
        print("Password: admin123")
        print("Role: super_admin")
        print("\nYou can now login with these credentials.")

    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_super_admin()