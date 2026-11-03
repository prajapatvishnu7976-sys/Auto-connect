"""Routes, stops and autos that anyone can look at (no login needed)."""
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from db import get_db, route_to_dict
from utils import error

public_bp = Blueprint("public", __name__)

# A location older than this is hidden, because the auto has probably moved.
STALE_SECONDS = 600


def load_routes(route_id=None):
    """Loads routes with their stops (two queries, not one per route)."""
    db = get_db()
    if route_id:
        route_rows = db.execute("SELECT * FROM routes WHERE route_id = ?", (route_id,)).fetchall()
        stop_rows = db.execute(
            "SELECT * FROM stops WHERE route_id = ? ORDER BY stop_order", (route_id,)
        ).fetchall()
    else:
        route_rows = db.execute("SELECT * FROM routes ORDER BY route_id").fetchall()
        stop_rows = db.execute("SELECT * FROM stops ORDER BY route_id, stop_order").fetchall()
    by_route = {}
    for stop in stop_rows:
        by_route.setdefault(stop["route_id"], []).append(stop)
    return [route_to_dict(r, by_route.get(r["route_id"], [])) for r in route_rows]


@public_bp.get("/health")
def health():
    return jsonify({"status": "ok", "message": "AutoConnect backend is running"})


@public_bp.get("/routes")
def list_routes():
    routes = load_routes()
    text = request.args.get("q", "").strip().lower()
    if text:
        def matches(route):
            words = [
                route["route_id"], route["route_name"],
                route["start_location"], route["end_location"],
            ] + route["aliases"]
            return text in " ".join(words).lower()
        routes = [r for r in routes if matches(r)]
    return jsonify({"routes": routes})


@public_bp.get("/routes/<route_id>")
def get_route(route_id):
    routes = load_routes(route_id)
    if not routes:
        return error("Route not found.", 404)
    return jsonify({"route": routes[0]})


def _fresh_location(row):
    """Latitude and longitude, only if they are recent enough to trust."""
    if row["latitude"] is None or row["location_updated_at"] is None:
        return None
    try:
        updated = datetime.fromisoformat(row["location_updated_at"])
    except ValueError:
        return None
    age = (datetime.now(timezone.utc) - updated).total_seconds()
    if age > STALE_SECONDS:
        return None
    return {
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "updated_at": row["location_updated_at"],
    }


@public_bp.get("/routes/<route_id>/autos")
def route_autos(route_id):
    """Autos on this route. Only approved, active drivers are shown."""
    db = get_db()
    if db.execute("SELECT 1 FROM routes WHERE route_id = ?", (route_id,)).fetchone() is None:
        return error("Route not found.", 404)
    rows = db.execute(
        """SELECT a.*, u.name AS driver_name, u.phone AS driver_phone
           FROM autos a JOIN users u ON u.user_id = a.driver_id
           WHERE a.route_id = ? AND u.is_approved = 1 AND u.is_active = 1
           ORDER BY a.auto_number""",
        (route_id,),
    ).fetchall()
    autos = [
        {
            "auto_number": r["auto_number"],
            "driver_name": r["driver_name"],
            "driver_phone": r["driver_phone"],
            "total_seats": r["total_seats"],
            "available_seats": r["available_seats"],
            "availability": r["availability"],
            "location": _fresh_location(r),  # None when not shared or too old
        }
        for r in rows
    ]
    return jsonify({"autos": autos})