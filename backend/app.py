"""AutoConnect backend. Start locally:  python app.py
On a server:  gunicorn app:app"""
import os
from pathlib import Path

try:  # optional: reads backend/.env if python-dotenv is installed
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent / ".env")
except ImportError:
    pass

from flask import Flask, request

from api_admin import admin_bp
from api_auth import auth_bp
from api_driver import driver_bp
from api_public import public_bp
from auth import ensure_admin
from db import close_db, init_db
from utils import error

BASE_DIR = Path(__file__).resolve().parent


def create_app(overrides=None):
    app = Flask(__name__)
    origins = os.environ.get("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    app.config.update(
        SECRET_KEY=os.environ.get("SECRET_KEY") or "dev-only-key-change-me",
        DATABASE_PATH=os.environ.get("DATABASE_PATH", str(BASE_DIR / "data" / "autoconnect.db")),
        TOKEN_MAX_AGE=int(os.environ.get("TOKEN_MAX_AGE", 8 * 60 * 60)),
        FRONTEND_ORIGINS=[o.strip() for o in origins.split(",") if o.strip()],
        MAX_CONTENT_LENGTH=64 * 1024,  # reject huge requests
    )
    if overrides:
        app.config.update(overrides)
    app.json.ensure_ascii = False  # keep the en dash in route names readable

    if not os.environ.get("SECRET_KEY") and not (overrides and "SECRET_KEY" in overrides):
        print("WARNING: SECRET_KEY is not set. Using an unsafe development key.")

    init_db(app.config["DATABASE_PATH"])
    app.teardown_appcontext(close_db)

    # Optional: create the first admin from environment variables
    # (useful on a server where you have no terminal).
    admin_email = os.environ.get("ADMIN_EMAIL")
    admin_password = os.environ.get("ADMIN_PASSWORD")
    if admin_email and admin_password:
        with app.app_context():
            _, problem = ensure_admin(
                os.environ.get("ADMIN_NAME", "Admin"),
                admin_email,
                os.environ.get("ADMIN_PHONE", "9000000000"),
                admin_password,
            )
            if problem and "already" not in problem:
                print("WARNING: admin account not created:", problem)

    for blueprint in (public_bp, auth_bp, driver_bp, admin_bp):
        app.register_blueprint(blueprint, url_prefix="/api")

    # ----- CORS: Fixed for any frontend port -----
    @app.before_request
    def answer_preflight():
        if request.method == "OPTIONS":
            return app.make_response(("", 204))

    @app.after_request
    def add_headers(response):
        # Allow requests from ANY origin (like localhost:3000, 192.168.x.x, etc.)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    # ----- errors always come back as JSON -----
    @app.errorhandler(404)
    def not_found(_):
        return error("Not found.", 404)

    @app.errorhandler(405)
    def wrong_method(_):
        return error("Method not allowed.", 405)

    @app.errorhandler(413)
    def too_large(_):
        return error("Request too large.", 413)

    @app.errorhandler(500)
    def server_error(_):
        return error("Something went wrong on the server.", 500)

    return app


app = create_app()

if __name__ == "__main__":
    # Host 0.0.0.0 makes it accessible on your local network
    app.run(debug=True, host="0.0.0.0", port=5000)