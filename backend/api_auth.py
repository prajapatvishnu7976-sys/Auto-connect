"""Register, log in, and see who is logged in."""
import time

from flask import Blueprint, g, jsonify, request

from auth import (
    add_user, login_required, make_token, user_to_dict,
    validate_signup, verify_password,
)
from db import get_db
from utils import error, get_body

auth_bp = Blueprint("auth", __name__)

# Remembers recent wrong passwords: {(ip, email): [times]}
_failed_logins = {}
MAX_FAILURES = 5
WINDOW_SECONDS = 300


def _recent_failures(key):
    now = time.time()
    recent = [t for t in _failed_logins.get(key, []) if now - t < WINDOW_SECONDS]
    _failed_logins[key] = recent
    return recent


@auth_bp.post("/auth/register")
def register():
    """Anyone can register as a student or a driver. Admins are created
    by the site owner, never through this endpoint."""
    data = get_body()
    if data is None:
        return error("Send the details as JSON.")

    role = data.get("role", "student")
    if role not in ("student", "driver"):
        return error("Role must be 'student' or 'driver'.")

    clean, problem = validate_signup(data)
    if problem:
        return error(problem)

    # Students can use the app at once. Drivers wait for admin approval.
    user_id, problem = add_user(clean, role, approved=(role == "student"))
    if problem:
        return error(problem, 409)

    row = get_db().execute("SELECT * FROM users WHERE user_id = ?", (user_id,)).fetchone()
    return jsonify({"token": make_token(user_id), "user": user_to_dict(row)}), 201


@auth_bp.post("/auth/login")
def login():
    data = get_body()
    if data is None:
        return error("Send the details as JSON.")

    email = str(data.get("email", "")).strip().lower()
    password = data.get("password")
    if not email or not isinstance(password, str) or not password:
        return error("Email and password are required.")

    key = (request.remote_addr, email)
    if len(_recent_failures(key)) >= MAX_FAILURES:
        return error("Too many failed attempts. Try again in a few minutes.", 429)

    row = get_db().execute(
        "SELECT * FROM users WHERE email = ? AND is_active = 1", (email,)
    ).fetchone()
    # One message for both cases, so nobody can learn which emails exist.
    if row is None or not verify_password(row["password_hash"], password):
        _failed_logins.setdefault(key, []).append(time.time())
        return error("Incorrect email or password.", 401)

    _failed_logins.pop(key, None)
    return jsonify({"token": make_token(row["user_id"]), "user": user_to_dict(row)})


@auth_bp.get("/auth/me")
@login_required()
def me():
    return jsonify({"user": user_to_dict(g.user)})