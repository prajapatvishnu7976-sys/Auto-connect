"""Passwords, login tokens and role checks."""
import re
import sqlite3
from functools import wraps

from flask import current_app, g, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from werkzeug.security import check_password_hash, generate_password_hash

from db import get_db
from utils import EMAIL_RE, check_text, error, now_iso


def hash_password(password):
    return generate_password_hash(password, method="pbkdf2:sha256")


def verify_password(stored_hash, password):
    return check_password_hash(stored_hash, password)


def _serializer():
    return URLSafeTimedSerializer(
        current_app.config["SECRET_KEY"], salt="autoconnect-login"
    )


def make_token(user_id):
    """A signed text that proves who is logged in. It expires after
    TOKEN_MAX_AGE seconds and cannot be edited without the SECRET_KEY."""
    return _serializer().dumps({"uid": user_id})


def read_token(token):
    try:
        return _serializer().loads(token, max_age=current_app.config["TOKEN_MAX_AGE"])
    except (BadSignature, SignatureExpired):
        return None


def user_to_dict(row):
    """Public details of a user. The password hash is never included."""
    return {
        "user_id": row["user_id"],
        "name": row["name"],
        "email": row["email"],
        "phone": row["phone"],
        "role": row["role"],
        "is_approved": bool(row["is_approved"]),
    }


def login_required(*roles):
    """Use as @login_required("admin"). With no roles, any logged-in user."""

    def decorator(view):
        @wraps(view)
        def wrapper(*args, **kwargs):
            header = request.headers.get("Authorization", "")
            if not header.startswith("Bearer "):
                return error("Please log in first.", 401)
            data = read_token(header[7:].strip())
            if not data:
                return error("Your session has expired. Please log in again.", 401)
            row = get_db().execute(
                "SELECT * FROM users WHERE user_id = ? AND is_active = 1",
                (data.get("uid"),),
            ).fetchone()
            if row is None:
                return error("Please log in again.", 401)
            if roles and row["role"] not in roles:
                return error("You do not have permission to do this.", 403)
            g.user = row
            return view(*args, **kwargs)

        return wrapper

    return decorator


def validate_signup(data):
    """Checks name, email, phone and password. Returns (clean, error)."""
    name, problem = check_text(data.get("name"), "Name", 80, 2)
    if problem:
        return None, problem

    email, problem = check_text(data.get("email"), "Email", 120)
    if problem:
        return None, problem
    email = email.lower()
    if not EMAIL_RE.match(email):
        return None, "Enter a valid email address."

    phone = str(data.get("phone", "")).strip()
    if not re.fullmatch(r"\d{10}", phone):
        return None, "Phone must be a 10-digit mobile number."

    password = data.get("password")
    if not isinstance(password, str) or len(password) < 8:
        return None, "Password must be at least 8 characters."
    if len(password) > 128:
        return None, "Password is too long."
    if not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        return None, "Password must contain at least one letter and one number."

    return {"name": name, "email": email, "phone": phone, "password": password}, None


def add_user(clean, role, approved):
    """Inserts a user. Returns (user_id, error)."""
    db = get_db()
    try:
        cur = db.execute(
            """INSERT INTO users
               (name, email, phone, password_hash, role, is_approved, created_at)
               VALUES (?,?,?,?,?,?,?)""",
            (
                clean["name"], clean["email"], clean["phone"],
                hash_password(clean["password"]), role,
                1 if approved else 0, now_iso(),
            ),
        )
        db.commit()
    except sqlite3.IntegrityError:
        return None, "An account with this email already exists."
    return cur.lastrowid, None


def ensure_admin(name, email, phone, password):
    """Creates an admin account if none exists with this email."""
    exists = get_db().execute(
        "SELECT 1 FROM users WHERE email = ?", (email.strip().lower(),)
    ).fetchone()
    if exists:
        return None, "That email already has an account."
    clean, problem = validate_signup(
        {"name": name, "email": email, "phone": phone, "password": password}
    )
    if problem:
        return None, problem
    return add_user(clean, "admin", approved=True)