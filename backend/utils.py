"""Small helpers used by every part of the backend."""
import re
from datetime import datetime, timezone

from flask import jsonify, request

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def now_iso():
    """Current UTC time as text, e.g. 2026-11-03T10:15:00+00:00"""
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def error(message, status=400):
    """Every error leaves the API in the same JSON shape."""
    return jsonify({"error": message}), status


def get_body():
    """The JSON the browser sent, or None if it was missing or not an object."""
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else None


# Each check_* function returns (clean_value, error_message).
# Exactly one of the two is None.

def check_text(value, label, max_len, min_len=1):
    if not isinstance(value, str):
        return None, f"{label} is required."
    value = value.strip()
    if len(value) < min_len:
        return None, f"{label} is required."
    if len(value) > max_len:
        return None, f"{label} must be at most {max_len} characters."
    return value, None


def check_int(value, label, low, high):
    if isinstance(value, bool):
        return None, f"{label} must be a whole number."
    if isinstance(value, str) and re.fullmatch(r"-?\d+", value.strip()):
        value = int(value.strip())
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    if not isinstance(value, int):
        return None, f"{label} must be a whole number."
    if value < low or value > high:
        return None, f"{label} must be between {low} and {high}."
    return value, None


def check_float(value, label, low, high):
    if isinstance(value, bool):
        return None, f"{label} must be a number."
    if isinstance(value, str):
        try:
            value = float(value.strip())
        except ValueError:
            return None, f"{label} must be a number."
    if not isinstance(value, (int, float)):
        return None, f"{label} must be a number."
    value = float(value)
    if value != value or value < low or value > high:  # value != value is NaN
        return None, f"{label} must be between {low} and {high}."
    return value, None