"""The admin portal: users, driver approval, routes and stops."""
import json
import re
from datetime import datetime

from flask import Blueprint, g, jsonify, request

from auth import login_required, user_to_dict
from db import get_db, route_to_dict
from utils import check_float, check_int, check_text, error, get_body

admin_bp = Blueprint("admin", __name__)

ROUTE_STATUSES = ("Proposed", "Proposed alternative", "Confirmed", "Historical reference")
VERIFICATION_STATUSES = ("Pending verification", "Field verified", "Historical reference")
ROUTE_ID_RE = re.compile(r"^[A-Z0-9][A-Z0-9-]{1,28}[A-Z0-9]$")
MAX_STOPS = 60


# ---------- users ----------

@admin_bp.get("/admin/stats")
@login_required("admin")
def stats():
    db = get_db()

    def count(sql):
        return db.execute(sql).fetchone()[0]

    return jsonify({
        "students": count("SELECT COUNT(*) FROM users WHERE role='student'"),
        "drivers": count("SELECT COUNT(*) FROM users WHERE role='driver'"),
        "pending_drivers": count("SELECT COUNT(*) FROM users WHERE role='driver' AND is_approved=0"),
        "routes": count("SELECT COUNT(*) FROM routes"),
        "routes_field_verified": count("SELECT COUNT(*) FROM routes WHERE verification_status='Field verified'"),
        "autos": count("SELECT COUNT(*) FROM autos"),
        "autos_available": count("SELECT COUNT(*) FROM autos WHERE availability='available'"),
    })


@admin_bp.get("/admin/users")
@login_required("admin")
def list_users():
    role = request.args.get("role")
    db = get_db()
    if role in ("student", "driver", "admin"):
        rows = db.execute("SELECT * FROM users WHERE role=? ORDER BY user_id", (role,)).fetchall()
    else:
        rows = db.execute("SELECT * FROM users ORDER BY user_id").fetchall()
    return jsonify({"users": [user_to_dict(r) for r in rows]})


@admin_bp.put("/admin/users/<int:user_id>/approval")
@login_required("admin")
def set_approval(user_id):
    """Approve or un-approve a driver. Only approved drivers show to students."""
    data = get_body()
    if data is None or not isinstance(data.get("approved"), bool):
        return error("Send {\"approved\": true} or {\"approved\": false}.")
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE user_id=?", (user_id,)).fetchone()
    if user is None:
        return error("User not found.", 404)
    if user["role"] != "driver":
        return error("Only drivers need approval.")
    db.execute("UPDATE users SET is_approved=? WHERE user_id=?", (1 if data["approved"] else 0, user_id))
    db.commit()
    user = db.execute("SELECT * FROM users WHERE user_id=?", (user_id,)).fetchone()
    return jsonify({"user": user_to_dict(user)})


@admin_bp.delete("/admin/users/<int:user_id>")
@login_required("admin")
def delete_user(user_id):
    if user_id == g.user["user_id"]:
        return error("You cannot delete your own account.", 409)
    db = get_db()
    if db.execute("SELECT 1 FROM users WHERE user_id=?", (user_id,)).fetchone() is None:
        return error("User not found.", 404)
    db.execute("DELETE FROM users WHERE user_id=?", (user_id,))
    db.commit()
    return jsonify({"deleted": user_id})


@admin_bp.get("/admin/autos")
@login_required("admin")
def list_autos():
    rows = get_db().execute(
        """SELECT a.auto_number, a.route_id, a.total_seats, a.available_seats,
                  a.availability, u.name AS driver_name, u.is_approved
           FROM autos a JOIN users u ON u.user_id = a.driver_id
           ORDER BY a.auto_number"""
    ).fetchall()
    return jsonify({"autos": [dict(r) | {"is_approved": bool(r["is_approved"])} for r in rows]})


# ---------- routes ----------

def validate_route(data, base):
    """Merges the new values into base, checks everything, and returns
    (clean_route, error). base holds the current values (or the defaults)."""
    route = dict(base)
    for key in (
        "route_name", "start_location", "end_location", "transport_type",
        "route_status", "verification_status", "notes", "source", "aliases",
        "last_verified_date", "fare", "distance_km", "travel_minutes",
    ):
        if key in data:
            route[key] = data[key]

    for key, label, size in (
        ("route_name", "Route name", 150),
        ("start_location", "Start location", 200),
        ("end_location", "Destination", 200),
        ("transport_type", "Transport type", 120),
    ):
        route[key], problem = check_text(route.get(key), label, size)
        if problem:
            return None, problem

    for key, label, size in (("notes", "Notes", 1000), ("source", "Source", 300)):
        value = route.get(key) or ""
        if not isinstance(value, str) or len(value.strip()) > size:
            return None, f"{label} must be text of at most {size} characters."
        route[key] = value.strip()

    if route.get("route_status") not in ROUTE_STATUSES:
        return None, "Route status must be one of: " + ", ".join(ROUTE_STATUSES) + "."
    if route.get("verification_status") not in VERIFICATION_STATUSES:
        return None, "Verification status must be one of: " + ", ".join(VERIFICATION_STATUSES) + "."

    aliases = route.get("aliases") or []
    if not isinstance(aliases, list) or len(aliases) > 10 or not all(
        isinstance(a, str) and 0 < len(a.strip()) <= 100 for a in aliases
    ):
        return None, "Aliases must be a list of up to 10 short texts."
    route["aliases"] = [a.strip() for a in aliases]

    date = route.get("last_verified_date") or None
    if date is not None:
        try:
            datetime.strptime(date, "%Y-%m-%d")
        except (TypeError, ValueError):
            return None, "Last verified date must look like 2026-11-03."
    route["last_verified_date"] = date

    for key, label, check, high in (
        ("fare", "Fare", check_int, 5000),
        ("distance_km", "Distance", check_float, 500),
        ("travel_minutes", "Travel minutes", check_int, 600),
    ):
        value = route.get(key)
        if value is None or value == "":
            route[key] = None
        else:
            route[key], problem = check(value, label, 0, high)
            if problem:
                return None, problem

    is_history_status = route["route_status"] == "Historical reference"
    is_history_verification = route["verification_status"] == "Historical reference"
    if is_history_status != is_history_verification:
        return None, ("A historical route must have both route status and "
                      "verification status set to 'Historical reference'.")
    if route["verification_status"] == "Field verified" and not route["last_verified_date"]:
        return None, "A field-verified route needs the date it was verified."

    return route, None


def _fetch_route(route_id):
    db = get_db()
    row = db.execute("SELECT * FROM routes WHERE route_id=?", (route_id,)).fetchone()
    if row is None:
        return None
    stops = db.execute(
        "SELECT * FROM stops WHERE route_id=? ORDER BY stop_order", (route_id,)
    ).fetchall()
    return route_to_dict(row, stops)


ROUTE_DEFAULTS = {
    "transport_type": "Shared Auto",
    "route_status": "Proposed",
    "verification_status": "Pending verification",
    "notes": "", "source": "", "aliases": [],
    "last_verified_date": None, "fare": None, "distance_km": None, "travel_minutes": None,
}


def _write_route(route_id, r, creating):
    db = get_db()
    values = (
        r["route_name"], r["start_location"], r["end_location"], r["transport_type"],
        r["route_status"], r["verification_status"], r["notes"], r["source"],
        json.dumps(r["aliases"], ensure_ascii=False), r["last_verified_date"],
        r["fare"], r["distance_km"], r["travel_minutes"],
    )
    if creating:
        db.execute(
            """INSERT INTO routes (route_name, start_location, end_location,
               transport_type, route_status, verification_status, notes, source,
               aliases, last_verified_date, fare, distance_km, travel_minutes, route_id)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            values + (route_id,),
        )
    else:
        db.execute(
            """UPDATE routes SET route_name=?, start_location=?, end_location=?,
               transport_type=?, route_status=?, verification_status=?, notes=?,
               source=?, aliases=?, last_verified_date=?, fare=?, distance_km=?,
               travel_minutes=? WHERE route_id=?""",
            values + (route_id,),
        )
    db.commit()


@admin_bp.post("/admin/routes")
@login_required("admin")
def create_route():
    data = get_body()
    if data is None:
        return error("Send the details as JSON.")
    route_id, problem = check_text(data.get("route_id"), "Route ID", 30)
    if problem:
        return error(problem)
    route_id = route_id.upper()
    if not ROUTE_ID_RE.match(route_id):
        return error("Route ID can use letters, numbers and hyphens only (e.g. HT-GW-03).")
    if _fetch_route(route_id) is not None:
        return error("A route with this ID already exists.", 409)
    clean, problem = validate_route(data, ROUTE_DEFAULTS)
    if problem:
        return error(problem)
    _write_route(route_id, clean, creating=True)
    return jsonify({"route": _fetch_route(route_id)}), 201


@admin_bp.put("/admin/routes/<route_id>")
@login_required("admin")
def update_route(route_id):
    existing = _fetch_route(route_id)
    if existing is None:
        return error("Route not found.", 404)
    data = get_body()
    if data is None:
        return error("Send the details as JSON.")
    clean, problem = validate_route(data, existing)
    if problem:
        return error(problem)
    _write_route(route_id, clean, creating=False)
    return jsonify({"route": _fetch_route(route_id)})


@admin_bp.delete("/admin/routes/<route_id>")
@login_required("admin")
def delete_route(route_id):
    if _fetch_route(route_id) is None:
        return error("Route not found.", 404)
    db = get_db()
    db.execute("DELETE FROM routes WHERE route_id=?", (route_id,))
    db.commit()
    return jsonify({"deleted": route_id})


@admin_bp.put("/admin/routes/<route_id>/stops")
@login_required("admin")
def replace_stops(route_id):
    """Replaces ALL stops of a route with the list sent. The order of the
    list is the order of the stops."""
    if _fetch_route(route_id) is None:
        return error("Route not found.", 404)
    data = get_body()
    stops = data.get("stops") if data else None
    if not isinstance(stops, list) or len(stops) > MAX_STOPS:
        return error(f"Send a list of at most {MAX_STOPS} stops.")

    clean = []
    for number, stop in enumerate(stops, start=1):
        if not isinstance(stop, dict):
            return error(f"Stop {number} is not valid.")
        name, problem = check_text(stop.get("stop_name"), f"Stop {number} name", 150)
        if problem:
            return error(problem)
        lat, lng = stop.get("latitude"), stop.get("longitude")
        if (lat is None) != (lng is None):
            return error(f"Stop {number}: give both latitude and longitude, or neither.")
        if lat is not None:
            lat, problem = check_float(lat, f"Stop {number} latitude", -90, 90)
            if problem:
                return error(problem)
            lng, problem = check_float(lng, f"Stop {number} longitude", -180, 180)
            if problem:
                return error(problem)
        verified = stop.get("is_verified", False)
        if not isinstance(verified, bool):
            return error(f"Stop {number}: is_verified must be true or false.")
        if verified and lat is None:
            return error(f"Stop {number}: a verified stop needs coordinates.")
        clean.append((route_id, number, name, lat, lng, 1 if verified else 0))

    db = get_db()
    try:
        db.execute("DELETE FROM stops WHERE route_id=?", (route_id,))
        db.executemany(
            """INSERT INTO stops (route_id, stop_order, stop_name, latitude, longitude, is_verified)
               VALUES (?,?,?,?,?,?)""",
            clean,
        )
        db.commit()
    except Exception:
        db.rollback()
        raise
    return jsonify({"route": _fetch_route(route_id)})