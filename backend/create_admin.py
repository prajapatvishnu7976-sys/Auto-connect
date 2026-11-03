"""Creates an admin account.  Run:  python create_admin.py"""
from getpass import getpass

from app import app
from auth import ensure_admin

with app.app_context():
    user_id, problem = ensure_admin(
        input("Admin name: "),
        input("Admin email: "),
        input("Admin mobile (10 digits): "),
        getpass("Password (hidden while typing): "),
    )
    print("Not created:" if problem else "Admin created.", problem or f"(id {user_id})")