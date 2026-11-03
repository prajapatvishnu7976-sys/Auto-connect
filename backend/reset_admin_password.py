"""Safely reset an existing AutoConnect admin password."""

import re
from getpass import getpass

from app import app
from db import get_db
from auth import hash_password


with app.app_context():

    email = input("Enter your admin email: ").strip().lower()

    password = getpass("Enter your new password: ")
    confirm = getpass("Confirm your new password: ")

    if password != confirm:
        print("Error: Passwords do not match.")

    elif len(password) < 8 or len(password) > 128:
        print("Error: Password must be between 8 and 128 characters.")

    elif not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        print("Error: Password must contain a letter and a number.")

    else:
        db = get_db()

        admin = db.execute(
            "SELECT user_id FROM users WHERE email = ? AND role = 'admin'",
            (email,)
        ).fetchone()

        if admin is None:
            print("Error: No admin account found with this email.")

        else:
            db.execute(
                "UPDATE users SET password_hash = ? WHERE user_id = ?",
                (hash_password(password), admin["user_id"])
            )

            db.commit()

            print("Success! Admin password updated successfully.")
            print("Admin ID:", admin["user_id"])