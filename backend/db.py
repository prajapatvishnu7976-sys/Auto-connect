"""Database: one SQLite file. Tables are created on first start."""
import json
import os
import sqlite3

from flask import current_app, g

from seed_data import ROUTES

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    user_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    phone         TEXT,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('student','driver','admin')),
    is_approved   INTEGER NOT NULL DEFAULT 1,
    is_active     INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS routes (
    route_id            TEXT PRIMARY KEY,
    route_name          TEXT NOT NULL,
    start_location      TEXT NOT NULL,
    end_location        TEXT NOT NULL,
    transport_type      TEXT NOT NULL,
    route_status        TEXT NOT NULL,
    verification_status TEXT NOT NULL,
    notes               TEXT NOT NULL DEFAULT '',
    source              TEXT NOT NULL DEFAULT '',
    aliases             TEXT NOT NULL DEFAULT '[]',
    last_verified_date  TEXT,
    fare                INTEGER,
    distance_km         REAL,
    travel_minutes      INTEGER
);

CREATE TABLE IF NOT EXISTS stops (
    stop_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id    TEXT NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
    stop_order  INTEGER NOT NULL,
    stop_name   TEXT NOT NULL,
    latitude    REAL,
    longitude   REAL,
    is_verified INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS ix_stops_route ON stops (route_id, stop_order);

CREATE TABLE IF NOT EXISTS autos (
    auto_id             INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_id           INTEGER NOT NULL UNIQUE
                        REFERENCES users(user_id) ON DELETE CASCADE,
    auto_number         TEXT NOT NULL UNIQUE,
    route_id            TEXT REFERENCES routes(route_id) ON DELETE SET NULL,
    total_seats         INTEGER NOT NULL
                        CHECK (total_seats BETWEEN 1 AND 20),
    available_seats     INTEGER NOT NULL
                        CHECK (available_seats >= 0 AND available_seats <= total_seats),
    availability        TEXT NOT NULL DEFAULT 'not_available'
                        CHECK (availability IN ('available','not_available')),
    latitude            REAL,
    longitude           REAL,
    location_updated_at TEXT,
    updated_at          TEXT NOT NULL
);
"""


def get_db():
    """One connection per request, kept in Flask's g."""
    if "db" not in g:
        g.db = sqlite3.connect(current_app.config["DATABASE_PATH"])
        g.db.row_factory = sqlite3.Row  # rows behave like dictionaries
        g.db.execute("PRAGMA foreign_keys = ON")  # SQLite ignores FKs otherwise
    return g.db


def close_db(exception=None):
    conn = g.pop("db", None)
    if conn is not None:
        conn.close()


def init_db(path):
    """Creates the file and tables, and adds the starting routes once."""
    folder = os.path.dirname(path)
    if folder:
        os.makedirs(folder, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(SCHEMA)
    seed_routes(conn)
    conn.close()


def seed_routes(conn):
    """Adds the starting routes only if the routes table is empty."""
    if conn.execute("SELECT COUNT(*) FROM routes").fetchone()[0] > 0:
        return
    for r in ROUTES:
        conn.execute(
            """INSERT OR IGNORE INTO routes
               (route_id, route_name, start_location, end_location,
                transport_type, route_status, verification_status,
                notes, source, aliases)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (
                r["route_id"], r["route_name"], r["start_location"],
                r["end_location"], r["transport_type"], r["route_status"],
                r["verification_status"], r["notes"], r["source"],
                json.dumps(r["aliases"], ensure_ascii=False),
            ),
        )
        for order, name in enumerate(r["stops"], start=1):
            conn.execute(
                "INSERT INTO stops (route_id, stop_order, stop_name) VALUES (?,?,?)",
                (r["route_id"], order, name),
            )
    conn.commit()


def route_to_dict(row, stops):
    """Turns a route row (and its stop rows) into the JSON shape the React
    pages already use (route_id, route_name, aliases, stops, fare ...)."""
    data = dict(row)
    data["aliases"] = json.loads(data["aliases"] or "[]")
    minutes = data["travel_minutes"]
    data["travel_time"] = f"{minutes} min" if minutes is not None else None
    data["stops"] = [
        {
            "stop_order": s["stop_order"],
            "stop_name": s["stop_name"],
            "latitude": s["latitude"],
            "longitude": s["longitude"],
            "is_verified": bool(s["is_verified"]),
        }
        for s in stops
    ]
    return data