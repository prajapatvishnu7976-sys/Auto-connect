# AutoConnect backend

Flask + SQLite API for three portals: **student**, **driver** and **admin**.

## Run locally (Windows PowerShell)
```
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python create_admin.py        # makes your admin account
python app.py                 # http://127.0.0.1:5000/api/health
```

## Run the tests
```
python -m unittest discover -s tests -v
```

## Settings (environment variables, see .env.example)
SECRET_KEY, FRONTEND_ORIGINS, DATABASE_PATH, and optionally
ADMIN_EMAIL / ADMIN_PASSWORD to create the first admin on startup.

## Endpoints (all under /api)
Public: GET /health, GET /routes?q=, GET /routes/<id>, GET /routes/<id>/autos
Auth: POST /auth/register (student or driver), POST /auth/login, GET /auth/me
Driver: GET|PUT /driver/auto, PUT /driver/seats, PUT /driver/status,
        PUT|DELETE /driver/location
Admin: GET /admin/stats, GET /admin/users, PUT /admin/users/<id>/approval,
       DELETE /admin/users/<id>, GET /admin/autos, POST /admin/routes,
       PUT|DELETE /admin/routes/<id>, PUT /admin/routes/<id>/stops

Send the login token as:  Authorization: Bearer <token>
Errors always look like:  {"error": "message"}
