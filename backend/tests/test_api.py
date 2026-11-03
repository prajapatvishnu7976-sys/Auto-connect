"""Run from the backend folder:  python -m unittest discover -s tests -v"""
import os
import sqlite3
import sys
import tempfile
import unittest

# Use a throw-away database and a fixed key, and make backend/ importable.
TEMP_DIR = tempfile.mkdtemp()
os.environ["DATABASE_PATH"] = os.path.join(TEMP_DIR, "import_time.db")
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ.pop("ADMIN_EMAIL", None)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import api_auth  # noqa: E402
from app import create_app  # noqa: E402
from auth import ensure_admin  # noqa: E402

PASSWORD = "Passw0rdOK"


class ApiTestCase(unittest.TestCase):
    def setUp(self):
        api_auth._failed_logins.clear()
        self.db_path = os.path.join(tempfile.mkdtemp(), "test.db")
        self.app = create_app({"DATABASE_PATH": self.db_path})
        self.client = self.app.test_client()

    # ----- helpers -----
    def register(self, email, role="student", name="Test User", password=PASSWORD, phone="9876543210"):
        return self.client.post("/api/auth/register", json={
            "name": name, "email": email, "phone": phone, "password": password, "role": role,
        })

    def token_for(self, email, role="student"):
        response = self.register(email, role)
        self.assertEqual(response.status_code, 201, response.get_json())
        return response.get_json()["token"]

    def make_admin(self, email="admin@test.dev"):
        with self.app.app_context():
            user_id, problem = ensure_admin("Site Admin", email, "9000000000", PASSWORD)
            self.assertIsNone(problem)
        response = self.client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
        self.assertEqual(response.status_code, 200)
        return response.get_json()["token"]

    @staticmethod
    def auth(token):
        return {"Authorization": f"Bearer {token}"}


class TestSeedData(ApiTestCase):
    def test_health(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "ok")

    def test_three_real_routes_exist(self):
        routes = self.client.get("/api/routes").get_json()["routes"]
        self.assertEqual([r["route_id"] for r in routes], ["AJ-GW-01", "HT-GW-01", "HT-GW-02"])

    def test_nothing_is_invented(self):
        for route in self.client.get("/api/routes").get_json()["routes"]:
            self.assertIsNone(route["fare"], route["route_id"])
            self.assertIsNone(route["travel_time"], route["route_id"])
            self.assertIsNone(route["last_verified_date"], route["route_id"])
            self.assertNotEqual(route["verification_status"], "Field verified")
            for stop in route["stops"]:
                self.assertIsNone(stop["latitude"])
                self.assertIsNone(stop["longitude"])
                self.assertFalse(stop["is_verified"])

    def test_proposed_routes_have_no_stops(self):
        for route_id in ("HT-GW-01", "HT-GW-02"):
            route = self.client.get(f"/api/routes/{route_id}").get_json()["route"]
            self.assertEqual(route["stops"], [])
            self.assertEqual(route["verification_status"], "Pending verification")

    def test_historical_route_has_17_ordered_stops(self):
        route = self.client.get("/api/routes/AJ-GW-01").get_json()["route"]
        self.assertEqual(route["route_status"], "Historical reference")
        self.assertEqual(route["verification_status"], "Historical reference")
        self.assertEqual(len(route["stops"]), 17)
        self.assertEqual([s["stop_order"] for s in route["stops"]], list(range(1, 18)))
        self.assertEqual(route["stops"][0]["stop_name"], "GWECA Main Gate")
        self.assertEqual(route["stops"][16]["stop_name"], "Government Engineering College Ajmer")
        self.assertIn("7 September 2018", route["source"])

    def test_aliases_are_a_list_and_search_works(self):
        for route in self.client.get("/api/routes").get_json()["routes"]:
            self.assertIsInstance(route["aliases"], list)
        found = self.client.get("/api/routes?q=hatundi").get_json()["routes"]
        self.assertEqual({r["route_id"] for r in found}, {"HT-GW-01", "HT-GW-02"})
        self.assertEqual(self.client.get("/api/routes?q=zzzz").get_json()["routes"], [])

    def test_unknown_route_is_404_json(self):
        response = self.client.get("/api/routes/NOPE")
        self.assertEqual(response.status_code, 404)
        self.assertIn("error", response.get_json())

    def test_unknown_url_is_json_404(self):
        response = self.client.get("/api/does-not-exist")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json(), {"error": "Not found."})


class TestAuth(ApiTestCase):
    def test_register_and_login(self):
        response = self.register("a@test.dev")
        self.assertEqual(response.status_code, 201)
        body = response.get_json()
        self.assertEqual(body["user"]["role"], "student")
        self.assertTrue(body["user"]["is_approved"])
        self.assertNotIn("password_hash", body["user"])
        login = self.client.post("/api/auth/login", json={"email": "A@test.dev", "password": PASSWORD})
        self.assertEqual(login.status_code, 200)
        me = self.client.get("/api/auth/me", headers=self.auth(login.get_json()["token"]))
        self.assertEqual(me.get_json()["user"]["email"], "a@test.dev")

    def test_password_is_not_stored_in_plain_text(self):
        self.register("hash@test.dev")
        conn = sqlite3.connect(self.db_path)
        stored = conn.execute("SELECT password_hash FROM users WHERE email='hash@test.dev'").fetchone()[0]
        conn.close()
        self.assertNotIn(PASSWORD, stored)
        self.assertTrue(stored.startswith("pbkdf2:"))

    def test_driver_starts_unapproved(self):
        body = self.register("d@test.dev", role="driver").get_json()
        self.assertEqual(body["user"]["role"], "driver")
        self.assertFalse(body["user"]["is_approved"])

    def test_cannot_register_as_admin(self):
        response = self.register("evil@test.dev", role="admin")
        self.assertEqual(response.status_code, 400)

    def test_validation_errors(self):
        self.assertEqual(self.register("not-an-email").status_code, 400)
        self.assertEqual(self.register("b@test.dev", password="short1").status_code, 400)
        self.assertEqual(self.register("b@test.dev", password="onlyletters").status_code, 400)
        self.assertEqual(self.register("b@test.dev", phone="123").status_code, 400)
        self.assertEqual(self.register("b@test.dev", name="x").status_code, 400)

    def test_duplicate_email(self):
        self.register("dup@test.dev")
        self.assertEqual(self.register("DUP@test.dev").status_code, 409)

    def test_wrong_password_and_unknown_email_look_the_same(self):
        self.register("c@test.dev")
        wrong = self.client.post("/api/auth/login", json={"email": "c@test.dev", "password": "Wrong1234"})
        unknown = self.client.post("/api/auth/login", json={"email": "who@test.dev", "password": "Wrong1234"})
        self.assertEqual(wrong.status_code, 401)
        self.assertEqual(wrong.get_json(), unknown.get_json())

    def test_login_is_rate_limited(self):
        self.register("limit@test.dev")
        for _ in range(5):
            r = self.client.post("/api/auth/login", json={"email": "limit@test.dev", "password": "Wrong1234"})
            self.assertEqual(r.status_code, 401)
        blocked = self.client.post("/api/auth/login", json={"email": "limit@test.dev", "password": PASSWORD})
        self.assertEqual(blocked.status_code, 429)

    def test_bad_json_is_rejected(self):
        response = self.client.post("/api/auth/login", data="not json", content_type="application/json")
        self.assertEqual(response.status_code, 400)

    def test_tokens(self):
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)
        bad = self.client.get("/api/auth/me", headers=self.auth("garbage.token.value"))
        self.assertEqual(bad.status_code, 401)
        token = self.token_for("t@test.dev")
        tampered = token[:-3] + ("AAA" if not token.endswith("AAA") else "BBB")
        self.assertEqual(self.client.get("/api/auth/me", headers=self.auth(tampered)).status_code, 401)

    def test_expired_token(self):
        app = create_app({"DATABASE_PATH": self.db_path, "TOKEN_MAX_AGE": -1})
        client = app.test_client()
        token = client.post("/api/auth/register", json={
            "name": "Old Token", "email": "old@test.dev", "phone": "9876543210",
            "password": PASSWORD, "role": "student"}).get_json()["token"]
        self.assertEqual(client.get("/api/auth/me", headers=self.auth(token)).status_code, 401)

    def test_deleted_user_token_stops_working(self):
        token = self.token_for("gone@test.dev")
        admin = self.make_admin()
        users = self.client.get("/api/admin/users?role=student", headers=self.auth(admin)).get_json()["users"]
        user_id = [u for u in users if u["email"] == "gone@test.dev"][0]["user_id"]
        self.assertEqual(self.client.delete(f"/api/admin/users/{user_id}", headers=self.auth(admin)).status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me", headers=self.auth(token)).status_code, 401)


class TestRolesAndCors(ApiTestCase):
    def test_roles_are_enforced(self):
        student = self.token_for("s@test.dev", "student")
        driver = self.token_for("dr@test.dev", "driver")
        admin = self.make_admin()
        # no token
        self.assertEqual(self.client.get("/api/driver/auto").status_code, 401)
        self.assertEqual(self.client.get("/api/admin/stats").status_code, 401)
        # wrong role
        self.assertEqual(self.client.get("/api/driver/auto", headers=self.auth(student)).status_code, 403)
        self.assertEqual(self.client.get("/api/admin/stats", headers=self.auth(student)).status_code, 403)
        self.assertEqual(self.client.get("/api/admin/stats", headers=self.auth(driver)).status_code, 403)
        self.assertEqual(self.client.get("/api/driver/auto", headers=self.auth(admin)).status_code, 403)
        # right role
        self.assertEqual(self.client.get("/api/driver/auto", headers=self.auth(driver)).status_code, 200)
        self.assertEqual(self.client.get("/api/admin/stats", headers=self.auth(admin)).status_code, 200)

    def test_cors_allows_only_our_frontend(self):
        ok = self.client.get("/api/health", headers={"Origin": "http://localhost:5173"})
        self.assertEqual(ok.headers.get("Access-Control-Allow-Origin"), "http://localhost:5173")
        other = self.client.get("/api/health", headers={"Origin": "http://evil.example"})
        self.assertIsNone(other.headers.get("Access-Control-Allow-Origin"))
        preflight = self.client.open("/api/auth/login", method="OPTIONS", headers={
            "Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"})
        self.assertEqual(preflight.status_code, 204)
        self.assertIn("Authorization", preflight.headers.get("Access-Control-Allow-Headers", ""))


class TestDriverFlow(ApiTestCase):
    def test_full_driver_and_student_flow(self):
        driver = self.token_for("driver@test.dev", "driver")
        student = self.token_for("student@test.dev", "student")
        admin = self.make_admin()
        h = self.auth(driver)

        # a driver cannot do anything before adding an auto
        self.assertEqual(self.client.put("/api/driver/seats", json={"available_seats": 1}, headers=h).status_code, 409)

        # bad auto details
        self.assertEqual(self.client.put("/api/driver/auto", json={"auto_number": "RJ", "total_seats": 4}, headers=h).status_code, 400)
        self.assertEqual(self.client.put("/api/driver/auto", json={"auto_number": "RJ01AB1234", "total_seats": 0}, headers=h).status_code, 400)
        self.assertEqual(self.client.put("/api/driver/auto", json={"auto_number": "RJ01AB1234", "total_seats": 4, "route_id": "AJ-GW-01"}, headers=h).status_code, 400)
        self.assertEqual(self.client.put("/api/driver/auto", json={"auto_number": "RJ01AB1234", "total_seats": 4, "route_id": "NOPE"}, headers=h).status_code, 400)

        # good auto
        saved = self.client.put("/api/driver/auto", json={"auto_number": "rj01ab1234", "total_seats": 6, "route_id": "HT-GW-01"}, headers=h)
        self.assertEqual(saved.status_code, 200, saved.get_json())
        auto = saved.get_json()["auto"]
        self.assertEqual(auto["auto_number"], "RJ01AB1234")
        self.assertEqual(auto["available_seats"], 6)
        self.assertEqual(auto["availability"], "not_available")

        # seats and status
        self.assertEqual(self.client.put("/api/driver/seats", json={"available_seats": 7}, headers=h).status_code, 400)
        self.assertEqual(self.client.put("/api/driver/seats", json={"available_seats": -1}, headers=h).status_code, 400)
        self.assertEqual(self.client.put("/api/driver/seats", json={"available_seats": 3}, headers=h).get_json()["auto"]["available_seats"], 3)
        self.assertEqual(self.client.put("/api/driver/status", json={"availability": "maybe"}, headers=h).status_code, 400)
        self.assertEqual(self.client.put("/api/driver/status", json={"availability": "available"}, headers=h).status_code, 200)

        # location must be valid
        self.assertEqual(self.client.put("/api/driver/location", json={"latitude": 200, "longitude": 10}, headers=h).status_code, 400)
        self.assertEqual(self.client.put("/api/driver/location", json={"latitude": "abc", "longitude": 10}, headers=h).status_code, 400)
        self.assertEqual(self.client.put("/api/driver/location", json={"latitude": True, "longitude": 10}, headers=h).status_code, 400)
        self.assertEqual(self.client.put("/api/driver/location", json={"latitude": 26.45, "longitude": 74.64}, headers=h).status_code, 200)

        # not approved yet: students see nothing
        listing = self.client.get("/api/routes/HT-GW-01/autos").get_json()["autos"]
        self.assertEqual(listing, [])

        # admin approves
        users = self.client.get("/api/admin/users?role=driver", headers=self.auth(admin)).get_json()["users"]
        driver_id = users[0]["user_id"]
        self.assertFalse(users[0]["is_approved"])
        self.assertEqual(self.client.put(f"/api/admin/users/{driver_id}/approval", json={"approved": "yes"}, headers=self.auth(admin)).status_code, 400)
        approved = self.client.put(f"/api/admin/users/{driver_id}/approval", json={"approved": True}, headers=self.auth(admin))
        self.assertTrue(approved.get_json()["user"]["is_approved"])

        # students now see the auto with seats and a fresh location
        autos = self.client.get("/api/routes/HT-GW-01/autos").get_json()["autos"]
        self.assertEqual(len(autos), 1)
        self.assertEqual(autos[0]["available_seats"], 3)
        self.assertEqual(autos[0]["availability"], "available")
        self.assertEqual(autos[0]["location"]["latitude"], 26.45)
        self.assertNotIn("password_hash", autos[0])

        # an old location is hidden
        conn = sqlite3.connect(self.db_path)
        conn.execute("UPDATE autos SET location_updated_at='2020-01-01T00:00:00+00:00'")
        conn.commit()
        conn.close()
        self.assertIsNone(self.client.get("/api/routes/HT-GW-01/autos").get_json()["autos"][0]["location"])

        # stop sharing, and reducing seats keeps the numbers valid
        self.assertEqual(self.client.delete("/api/driver/location", headers=h).status_code, 200)
        shrunk = self.client.put("/api/driver/auto", json={"auto_number": "RJ01AB1234", "total_seats": 2, "route_id": "HT-GW-01"}, headers=h)
        self.assertEqual(shrunk.get_json()["auto"]["available_seats"], 2)

        # students cannot change driver data
        self.assertEqual(self.client.put("/api/driver/seats", json={"available_seats": 1}, headers=self.auth(student)).status_code, 403)

    def test_duplicate_auto_number(self):
        one = self.token_for("one@test.dev", "driver")
        two = self.token_for("two@test.dev", "driver")
        body = {"auto_number": "RJ01AB1234", "total_seats": 4}
        self.assertEqual(self.client.put("/api/driver/auto", json=body, headers=self.auth(one)).status_code, 200)
        self.assertEqual(self.client.put("/api/driver/auto", json=body, headers=self.auth(two)).status_code, 409)

    def test_unapproving_hides_the_auto(self):
        driver = self.token_for("hide@test.dev", "driver")
        admin = self.make_admin()
        self.client.put("/api/driver/auto", json={"auto_number": "RJ14XY9999", "total_seats": 4, "route_id": "HT-GW-02"}, headers=self.auth(driver))
        driver_id = self.client.get("/api/admin/users?role=driver", headers=self.auth(admin)).get_json()["users"][0]["user_id"]
        self.client.put(f"/api/admin/users/{driver_id}/approval", json={"approved": True}, headers=self.auth(admin))
        self.assertEqual(len(self.client.get("/api/routes/HT-GW-02/autos").get_json()["autos"]), 1)
        self.client.put(f"/api/admin/users/{driver_id}/approval", json={"approved": False}, headers=self.auth(admin))
        self.assertEqual(self.client.get("/api/routes/HT-GW-02/autos").get_json()["autos"], [])


class TestAdminRoutes(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.admin = self.auth(self.make_admin())

    def test_stats_and_users(self):
        self.register("st@test.dev")
        stats = self.client.get("/api/admin/stats", headers=self.admin).get_json()
        self.assertEqual(stats["students"], 1)
        self.assertEqual(stats["routes"], 3)
        self.assertEqual(stats["routes_field_verified"], 0)
        users = self.client.get("/api/admin/users", headers=self.admin).get_json()["users"]
        self.assertEqual(len(users), 2)
        self.assertTrue(all("password_hash" not in u for u in users))

    def test_create_route_rules(self):
        base = {"route_id": "ht-gw-03", "route_name": "New", "start_location": "A", "end_location": "B"}
        self.assertEqual(self.client.post("/api/admin/routes", json={**base, "route_id": "bad id!"}, headers=self.admin).status_code, 400)
        self.assertEqual(self.client.post("/api/admin/routes", json={**base, "route_name": ""}, headers=self.admin).status_code, 400)
        # field verified needs a date
        self.assertEqual(self.client.post("/api/admin/routes", json={**base, "verification_status": "Field verified"}, headers=self.admin).status_code, 400)
        # historical needs both fields
        self.assertEqual(self.client.post("/api/admin/routes", json={**base, "route_status": "Historical reference"}, headers=self.admin).status_code, 400)
        # bad number and bad date
        self.assertEqual(self.client.post("/api/admin/routes", json={**base, "fare": -5}, headers=self.admin).status_code, 400)
        self.assertEqual(self.client.post("/api/admin/routes", json={**base, "last_verified_date": "03-11-2026"}, headers=self.admin).status_code, 400)
        # valid: starts pending with unknown values
        created = self.client.post("/api/admin/routes", json=base, headers=self.admin)
        self.assertEqual(created.status_code, 201, created.get_json())
        route = created.get_json()["route"]
        self.assertEqual(route["route_id"], "HT-GW-03")
        self.assertEqual(route["verification_status"], "Pending verification")
        self.assertIsNone(route["fare"])
        self.assertEqual(route["stops"], [])
        # duplicate
        self.assertEqual(self.client.post("/api/admin/routes", json=base, headers=self.admin).status_code, 409)

    def test_update_and_verify_route(self):
        r = self.client.put("/api/admin/routes/HT-GW-01", json={"verification_status": "Field verified"}, headers=self.admin)
        self.assertEqual(r.status_code, 400)
        r = self.client.put("/api/admin/routes/HT-GW-01", json={
            "verification_status": "Field verified", "last_verified_date": "2026-11-03",
            "fare": 20, "travel_minutes": 25}, headers=self.admin)
        self.assertEqual(r.status_code, 200, r.get_json())
        route = r.get_json()["route"]
        self.assertEqual(route["fare"], 20)
        self.assertEqual(route["travel_time"], "25 min")
        self.assertEqual(route["route_name"], "Hatoondi – Makhupura – GWECA")  # untouched fields stay
        self.assertEqual(self.client.put("/api/admin/routes/NOPE", json={"fare": 1}, headers=self.admin).status_code, 404)
        # a historical route cannot be turned into field verified
        r = self.client.put("/api/admin/routes/AJ-GW-01", json={"verification_status": "Field verified", "last_verified_date": "2026-11-03"}, headers=self.admin)
        self.assertEqual(r.status_code, 400)

    def test_replace_stops(self):
        url = "/api/admin/routes/HT-GW-01/stops"
        self.assertEqual(self.client.put(url, json={"stops": "no"}, headers=self.admin).status_code, 400)
        self.assertEqual(self.client.put(url, json={"stops": [{"stop_name": "A", "latitude": 26.4}]}, headers=self.admin).status_code, 400)
        self.assertEqual(self.client.put(url, json={"stops": [{"stop_name": "A", "is_verified": True}]}, headers=self.admin).status_code, 400)
        self.assertEqual(self.client.put(url, json={"stops": [{"stop_name": "A", "latitude": 99, "longitude": 74}]}, headers=self.admin).status_code, 400)
        self.assertEqual(self.client.get("/api/routes/HT-GW-01").get_json()["route"]["stops"], [])  # nothing half-saved
        ok = self.client.put(url, json={"stops": [
            {"stop_name": "Hatoondi"},
            {"stop_name": "Mid", "latitude": 26.45, "longitude": 74.64, "is_verified": True},
            {"stop_name": "GWECA"}]}, headers=self.admin)
        self.assertEqual(ok.status_code, 200, ok.get_json())
        stops = ok.get_json()["route"]["stops"]
        self.assertEqual([s["stop_order"] for s in stops], [1, 2, 3])
        self.assertTrue(stops[1]["is_verified"])
        again = self.client.put(url, json={"stops": [{"stop_name": "Only"}]}, headers=self.admin)
        self.assertEqual(len(again.get_json()["route"]["stops"]), 1)

    def test_delete_route_keeps_driver_auto(self):
        driver = self.token_for("keep@test.dev", "driver")
        self.client.put("/api/driver/auto", json={"auto_number": "RJ01AB0001", "total_seats": 4, "route_id": "HT-GW-02"}, headers=self.auth(driver))
        self.assertEqual(self.client.delete("/api/admin/routes/HT-GW-02", headers=self.admin).status_code, 200)
        self.assertEqual(self.client.get("/api/routes/HT-GW-02").status_code, 404)
        auto = self.client.get("/api/driver/auto", headers=self.auth(driver)).get_json()["auto"]
        self.assertIsNotNone(auto)
        self.assertIsNone(auto["route_id"])

    def test_cannot_delete_self_and_deleting_driver_removes_auto(self):
        me = self.client.get("/api/auth/me", headers=self.admin).get_json()["user"]["user_id"]
        self.assertEqual(self.client.delete(f"/api/admin/users/{me}", headers=self.admin).status_code, 409)
        driver = self.token_for("bye@test.dev", "driver")
        self.client.put("/api/driver/auto", json={"auto_number": "RJ01AB0002", "total_seats": 4}, headers=self.auth(driver))
        driver_id = self.client.get("/api/admin/users?role=driver", headers=self.admin).get_json()["users"][0]["user_id"]
        self.client.delete(f"/api/admin/users/{driver_id}", headers=self.admin)
        self.assertEqual(self.client.get("/api/admin/autos", headers=self.admin).get_json()["autos"], [])


class TestAdminFromEnvironment(ApiTestCase):
    def test_admin_created_from_environment_variables(self):
        os.environ["ADMIN_EMAIL"] = "boss@test.dev"
        os.environ["ADMIN_PASSWORD"] = PASSWORD
        try:
            app = create_app({"DATABASE_PATH": os.path.join(tempfile.mkdtemp(), "env.db")})
            app2 = create_app({"DATABASE_PATH": app.config["DATABASE_PATH"]})  # second start: no crash, no duplicate
        finally:
            os.environ.pop("ADMIN_EMAIL"), os.environ.pop("ADMIN_PASSWORD")
        login = app2.test_client().post("/api/auth/login", json={"email": "boss@test.dev", "password": PASSWORD})
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.get_json()["user"]["role"], "admin")


if __name__ == "__main__":
    unittest.main()
