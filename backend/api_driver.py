"""The driver portal: auto details, seats, availability and location."""
import re

from flask import Blueprint, g, jsonify

from auth import login_required
from db import get_db
from utils import check_float, check_int, check_text, error, get_body, now_iso

driver_bp = Blueprint("driver", __name__)

AUTO_NUMBER_RE = re.compile(r"^[A-Z0-9][A-Z0-9 -]{2,18}[A-Z0-9]$")


def _auto_dict(row):
    if row is None:
        return None
    return {
        "auto_number": row["auto_number"],
        "route_id": row["route_id"],
        "total_seats": row["total_seats"],
        "available_seats": row["available_seats"],
        "availability": row["availability"],
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "location_updated_at": row["location_updated_at"],
    }


def _my_auto():
    return get_db().execute(
        "SELECT * FROM autos WHERE driver_id = ?", (g.user["user_id"],)
    ).fetchone()


@driver_bp.get("/driver/auto")
@login_required("driver")
def get_auto():
    return jsonify({
        "auto": _auto_dict(_my_auto()),
        "is_approved": bool(g.user["is_approved"]),
    })


@driver_bp.put("/driver/auto")
@login_required("driver")
def save_auto():
    """Creates or updates the driver's auto (number, seats and route)."""
    data = get_body()
    if data is None:
        return error("Send the details as JSON.")

    number, problem = check_text(data.get("auto_number"), "Auto number", 20, 4)
    if problem:
        return error(problem)
    number = number.upper()
    if not AUTO_NUMBER_RE.match(number):
        return error("Auto number can use letters, numbers, spaces and hyphens only.")

    seats, problem = check_int(data.get("total_seats"), "Total seats", 1, 20)
    if problem:
        return error(problem)

    route_id = data.get("route_id") or None
    db = get_db()
    if route_id is not None:
        route = db.execute(
            "SELECT route_status FROM routes WHERE route_id = ?", (route_id,)
        ).fetchone()
        if route is None:
            return error("That route does not exist.")
        if route["route_status"] == "Historical reference":
            return error("A historical route cannot be chosen. It is not a current service.")

    existing = _my_auto()
    try:
        if existing is None:
            db.execute(
                """INSERT INTO autos (driver_id, auto_number, route_id, total_seats,
                   available_seats, availability, updated_at)
                   VALUES (?,?,?,?,?,'not_available',?)""",
                (g.user["user_id"], number, route_id, seats, seats, now_iso()),
            )
        else:
            available = min(existing["available_seats"], seats)
            db.execute(
                """UPDATE autos SET auto_number=?, route_id=?, total_seats=?,
                   available_seats=?, updated_at=? WHERE driver_id=?""",
                (number, route_id, seats, available, now_iso(), g.user["user_id"]),
            )
        db.commit()
    except Exception as exc:  # most likely the auto number is already taken
        db.rollback()
        if "UNIQUE" in str(exc):
            return error("This auto number is already registered.", 409)
        raise
    return jsonify({"auto": _auto_dict(_my_auto())})


@driver_bp.put("/driver/seats")
@login_required("driver")
def update_seats():
    auto = _my_auto()
    if auto is None:
        return error("Add your auto details first.", 409)
    data = get_body()
    if data is None:
        return error("Send the details as JSON.")
    seats, problem = check_int(data.get("available_seats"), "Available seats", 0, auto["total_seats"])
    if problem:
        return error(problem)
    db = get_db()
    db.execute(
        "UPDATE autos SET available_seats=?, updated_at=? WHERE driver_id=?",
        (seats, now_iso(), g.user["user_id"]),
    )
    db.commit()
    return jsonify({"auto": _auto_dict(_my_auto())})


@driver_bp.put("/driver/status")
@login_required("driver")
def update_status():
    auto = _my_auto()
    if auto is None:
        return error("Add your auto details first.", 409)
    data = get_body()
    if data is None:
        return error("Send the details as JSON.")
    status = data.get("availability")
    if status not in ("available", "not_available"):
        return error("Availability must be 'available' or 'not_available'.")
    db = get_db()
    db.execute(
        "UPDATE autos SET availability=?, updated_at=? WHERE driver_id=?",
        (status, now_iso(), g.user["user_id"]),
    )
    db.commit()
    return jsonify({"auto": _auto_dict(_my_auto())})


@driver_bp.put("/driver/location")
@login_required("driver")
def update_location():
    """Stores the driver's latest location. Send only real GPS readings
    (from the browser's geolocation), never made-up coordinates."""
    if _my_auto() is None:
        return error("Add your auto details first.", 409)
    data = get_body()
    if data is None:
        return error("Send the details as JSON.")
    lat, problem = check_float(data.get("latitude"), "Latitude", -90, 90)
    if problem:
        return error(problem)
    lng, problem = check_float(data.get("longitude"), "Longitude", -180, 180)
    if problem:
        return error(problem)
    db = get_db()
    db.execute(
        """UPDATE autos SET latitude=?, longitude=?, location_updated_at=?, updated_at=?
           WHERE driver_id=?""",
        (lat, lng, now_iso(), now_iso(), g.user["user_id"]),
    )
    db.commit()
    return jsonify({"auto": _auto_dict(_my_auto())})


@driver_bp.delete("/driver/location")
@login_required("driver")
def stop_sharing_location():
    db = get_db()
    db.execute(
        """UPDATE autos SET latitude=NULL, longitude=NULL, location_updated_at=NULL,
           updated_at=? WHERE driver_id=?""",
        (now_iso(), g.user["user_id"]),
    )
    db.commit()
    return jsonify({"auto": _auto_dict(_my_auto())})