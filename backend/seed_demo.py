"""Seed demo drivers + autos so the app looks alive."""
import os
import sys
from pathlib import Path

# Make sure we can import app modules
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app import create_app
from db import get_db
from auth import hash_password
from utils import now_iso

# Demo drivers (all pre-approved)
DRIVERS = [
    {"name": "Ramu Yadav",     "email": "ramu@demo.com",     "phone": "9811111101", "password": "Demo1234"},
    {"name": "Suresh Kumar",   "email": "suresh@demo.com",   "phone": "9811111102", "password": "Demo1234"},
    {"name": "Vikram Singh",   "email": "vikram@demo.com",   "phone": "9811111103", "password": "Demo1234"},
    {"name": "Amit Sharma",    "email": "amit@demo.com",     "phone": "9811111104", "password": "Demo1234"},
    {"name": "Ravi Meena",     "email": "ravi@demo.com",     "phone": "9811111105", "password": "Demo1234"},
    {"name": "Deepak Joshi",   "email": "deepak@demo.com",   "phone": "9811111106", "password": "Demo1234"},
    {"name": "Manoj Verma",    "email": "manoj@demo.com",    "phone": "9811111107", "password": "Demo1234"},
    {"name": "Prakash Jain",   "email": "prakash@demo.com",  "phone": "9811111108", "password": "Demo1234"},
]

# Autos: (driver_email, auto_number, route_id, total_seats, available_seats, availability, lat, lng)
# Coordinates roughly around Ajmer / GWECA area
AUTOS = [
    # Online + Live location
    ("ramu@demo.com",    "RJ01 AB 1001", "AJ-GW-01", 4, 3, "available",     26.4499, 74.6399),
    ("suresh@demo.com",  "RJ01 AB 1002", "AJ-GW-01", 3, 1, "available",     26.4512, 74.6410),
    ("vikram@demo.com",  "RJ01 CD 2001", "AJ-GW-02", 4, 4, "available",     26.4480, 74.6385),
    ("amit@demo.com",    "RJ01 CD 2002", "AJ-GW-02", 6, 2, "available",     26.4505, 74.6422),
    ("ravi@demo.com",    "RJ01 EF 3001", "AJ-GW-03", 4, 3, "available",     26.4475, 74.6370),
    ("deepak@demo.com",  "RJ01 EF 3002", "AJ-HT-01", 3, 2, "available",     26.4520, 74.6405),

    # Offline (no location)
    ("manoj@demo.com",   "RJ01 GH 4001", "AJ-GW-01", 4, 0, "not_available", None, None),
    ("prakash@demo.com", "RJ01 GH 4002", "AJ-GW-03", 5, 0, "not_available", None, None),
]


def seed():
    app = create_app()
    with app.app_context():
        db = get_db()
        now = now_iso()

        print("🚗 Creating demo drivers...")
        email_to_id = {}

        for d in DRIVERS:
            existing = db.execute(
                "SELECT user_id FROM users WHERE email = ?", (d["email"],)
            ).fetchone()
            if existing:
                email_to_id[d["email"]] = existing["user_id"]
                # ensure approved
                db.execute(
                    "UPDATE users SET is_approved=1, is_active=1, role='driver' WHERE user_id=?",
                    (existing["user_id"],),
                )
                print(f"  ↻ already exists: {d['name']}")
            else:
                cur = db.execute(
                    """INSERT INTO users
                       (name, email, phone, password_hash, role, is_approved, is_active, created_at)
                       VALUES (?,?,?,?, 'driver', 1, 1, ?)""",
                    (d["name"], d["email"], d["phone"], hash_password(d["password"]), now),
                )
                email_to_id[d["email"]] = cur.lastrowid
                print(f"  ✅ created: {d['name']} ({d['email']})")

        db.commit()

        print("\n🛺 Creating demo autos...")
        for email, number, route_id, total, avail, status, lat, lng in AUTOS:
            driver_id = email_to_id.get(email)
            if not driver_id:
                print(f"  ❌ skip {number}: driver not found")
                continue

            # Check route exists
            route = db.execute(
                "SELECT route_id FROM routes WHERE route_id = ?", (route_id,)
            ).fetchone()
            if not route:
                # pick first available route
                first = db.execute("SELECT route_id FROM routes LIMIT 1").fetchone()
                if first:
                    route_id = first["route_id"]
                    print(f"  ⚠ route missing, using {route_id} for {number}")
                else:
                    print(f"  ❌ no routes in DB, skip {number}")
                    continue

            existing_auto = db.execute(
                "SELECT auto_id FROM autos WHERE driver_id = ?", (driver_id,)
            ).fetchone()

            loc_time = now if lat is not None else None

            if existing_auto:
                db.execute(
                    """UPDATE autos SET
                       auto_number=?, route_id=?, total_seats=?, available_seats=?,
                       availability=?, latitude=?, longitude=?, location_updated_at=?, updated_at=?
                       WHERE driver_id=?""",
                    (number, route_id, total, avail, status, lat, lng, loc_time, now, driver_id),
                )
                print(f"  ↻ updated: {number} → {route_id} ({status})")
            else:
                try:
                    db.execute(
                        """INSERT INTO autos
                           (driver_id, auto_number, route_id, total_seats, available_seats,
                            availability, latitude, longitude, location_updated_at, updated_at)
                           VALUES (?,?,?,?,?,?,?,?,?,?)""",
                        (driver_id, number, route_id, total, avail, status, lat, lng, loc_time, now),
                    )
                    print(f"  ✅ created: {number} → {route_id} ({status})")
                except Exception as e:
                    # auto_number unique conflict
                    print(f"  ⚠ skip {number}: {e}")

        db.commit()
        print("\n🎉 Demo data ready!")
        print("────────────────────────────────────")
        print("Demo driver logins (password: Demo1234):")
        for d in DRIVERS:
            print(f"  📧 {d['email']}")
        print("────────────────────────────────────")
        print("Ab browser refresh kar — routes pe autos dikhenge!")


if __name__ == "__main__":
    seed()