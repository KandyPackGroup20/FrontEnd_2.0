import urllib.request
import urllib.error
import http.cookiejar
import json
import time

FRONTEND_URL = "http://127.0.0.1:3000"
BACKEND_URL = "http://127.0.0.1:8000/api/v1"

class HttpClient:
    def __init__(self):
        self.cj = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cj))

    def request(self, method, url, data=None, headers=None, follow_redirects=False):
        if headers is None:
            headers = {}
        encoded = None
        if data is not None:
            encoded = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"
        
        # Custom redirect handling
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, req, fp, code, msg, headers, newurl):
                return None if not follow_redirects else super().redirect_request(req, fp, code, msg, headers, newurl)

        opener = urllib.request.build_opener(NoRedirect(), urllib.request.HTTPCookieProcessor(self.cj))
        req = urllib.request.Request(url, data=encoded, headers=headers, method=method)
        try:
            with opener.open(req) as resp:
                return resp.status, resp.read().decode("utf-8"), dict(resp.headers)
        except urllib.error.HTTPError as e:
            return e.code, e.read().decode("utf-8"), dict(e.headers)

def test_frontend_rbac_and_routing():
    print("=== PHASE E: FRONTEND RBAC & ROUTING VERIFICATION ===")
    
    # 1. Logged-out access to /admin/rail -> must redirect to /login
    print("\n--- 1. Testing Logged-out Access to /admin/rail ---")
    anon = HttpClient()
    st, body, hdrs = anon.request("GET", f"{FRONTEND_URL}/admin/rail", follow_redirects=False)
    print(f"Logged-out GET /admin/rail: HTTP {st}")
    loc = hdrs.get("Location") or hdrs.get("location") or ""
    print(f"Redirect Location: {loc}")
    assert st in [307, 308, 302, 303], f"Expected redirect, got {st}"
    assert "/login" in loc, f"Expected redirect to /login, got {loc}"
    print("  -> Verified: Logged-out access redirected to login!")

    # 2. Login through Frontend Proxy or Backend
    print("\n--- 2. Logging in test roles ---")
    users = [
        ("logistics@kandypack.lk", "admin", "LOGISTICS_MGR"),
        ("dispatch@kandypack.lk", "admin", "DISPATCHER"),
        ("wh.staff1@kandypack.lk", "admin", "WAREHOUSE_STAFF"),
        ("customer1@gmail.com", "customer", "CUSTOMER"),
    ]
    sessions = {}
    for email, portal, expected_role in users:
        client = HttpClient()
        # Login via frontend rewrite proxy /api/v1/auth/login
        st, body, hdrs = client.request(
            "POST",
            f"{FRONTEND_URL}/api/v1/auth/login",
            data={"email": email, "password": "password123", "portal_type": portal}
        )
        assert st == 200, f"Login failed for {email}: {st} {body}"
        data = json.loads(body)
        assert data.get("role") == expected_role
        sessions[email] = client
        print(f"  -> Logged in {email} (role: {expected_role}) via frontend proxy")

    # 3. Test pasting rail URLs for dispatch@ and wh.staff1@ and customer1@
    print("\n--- 3. Testing Pasting Rail URLs for Restricted Roles ---")
    restricted_users = ["dispatch@kandypack.lk", "wh.staff1@kandypack.lk", "customer1@gmail.com"]
    rail_paths = ["/admin/rail", "/admin/rail/trips", "/admin/rail/orders", "/admin/rail/breakdown"]

    for email in restricted_users:
        client = sessions[email]
        for path in rail_paths:
            st, body, hdrs = client.request("GET", f"{FRONTEND_URL}{path}", follow_redirects=False)
            print(f"User {email} accessing {path}: HTTP {st}")
            assert st == 403, f"Expected HTTP 403 for {email} accessing {path}, got {st}"
            assert "403 Forbidden" in body or "Access Denied" in body, f"Expected 403 Forbidden content in body"
        print(f"  -> Verified: {email} strictly denied (HTTP 403) for all rail pages!")

    # 4. Test accessing rail pages as logistics@kandypack.lk -> 200 OK
    print("\n--- 4. Testing Rail Pages Access for Logistics Manager ---")
    log_client = sessions["logistics@kandypack.lk"]
    for path in rail_paths:
        st, body, hdrs = log_client.request("GET", f"{FRONTEND_URL}{path}", follow_redirects=True)
        print(f"Logistics Manager accessing {path}: HTTP {st}")
        assert st == 200, f"Expected HTTP 200 for logistics manager accessing {path}, got {st}"
    print("  -> Verified: logistics@kandypack.lk successfully loaded all rail pages!")

    print("\n=== PHASE E FRONTEND RBAC VERIFICATION PASSED ===")

if __name__ == "__main__":
    test_frontend_rbac_and_routing()
