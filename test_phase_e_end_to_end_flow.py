import urllib.request
import urllib.error
import http.cookiejar
import json
import datetime
import time

FRONTEND_URL = "http://127.0.0.1:3000"

class SessionClient:
    def __init__(self):
        self.cj = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cj))

    def request(self, method, path, data=None):
        url = f"{FRONTEND_URL}{path}"
        headers = {}
        encoded = None
        if data is not None:
            encoded = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=encoded, headers=headers, method=method)
        try:
            with self.opener.open(req) as resp:
                body = resp.read().decode("utf-8")
                try:
                    j = json.loads(body)
                except Exception:
                    j = body
                return resp.status, j
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8")
            try:
                j = json.loads(body)
            except Exception:
                j = body
            return e.code, j

def test_full_lifecycle():
    print("=== TESTING COMPLETE CUSTOMER & LOGISTICS LIFECYCLE ===")

    # 1. Login Logistics Manager
    lm = SessionClient()
    st, data = lm.request("POST", "/api/v1/auth/login", {
        "email": "logistics@kandypack.lk", "password": "password123", "portal_type": "admin"
    })
    assert st == 200

    # 2. LM Creates, Updates, Cancels, Activates a Trip
    print("\n--- 1. Trip Management Lifecycle (LM-01, LM-02) ---")
    dep = (datetime.datetime.now() + datetime.timedelta(days=2)).strftime("%Y-%m-%dT10:00:00")
    arr = (datetime.datetime.now() + datetime.timedelta(days=2, hours=4)).strftime("%Y-%m-%dT14:00:00")
    
    # Create trip (Colombo dest id 1)
    st, res = lm.request("POST", "/api/v1/rail/trips", {
        "origin_station_id": 7,
        "destination_station_id": 1,
        "departure_datetime": dep,
        "arrival_datetime": arr,
        "total_capacity": 25.0
    })
    print(f"Create trip: HTTP {st}, response: {res}")
    assert st == 201, f"Failed to create trip: {res}"
    trip_id = res["trip_id"]

    # Update trip capacity to 30.0
    st, res = lm.request("PUT", f"/api/v1/rail/trips/{trip_id}", {
        "total_capacity": 30.0
    })
    print(f"Update trip #{trip_id} capacity to 30.0: HTTP {st}, response: {res}")
    assert st == 200

    # Cancel trip
    st, res = lm.request("PATCH", f"/api/v1/rail/trips/{trip_id}/cancel")
    print(f"Cancel trip #{trip_id}: HTTP {st}, response: {res}")
    assert st == 200 and res["status"] == "CANCELLED"

    # Activate trip back
    st, res = lm.request("PATCH", f"/api/v1/rail/trips/{trip_id}/activate")
    print(f"Activate trip #{trip_id}: HTTP {st}, response: {res}")
    assert st == 200 and res["status"] == "SCHEDULED"

    # 3. Customer1 Places Orders
    print("\n--- 2. Customer1 Places Consignment Orders ---")
    cust = SessionClient()
    st, data = cust.request("POST", "/api/v1/auth/login", {
        "email": "customer1@gmail.com", "password": "password123", "portal_type": "customer"
    })
    assert st == 200

    delivery_date = (datetime.datetime.now() + datetime.timedelta(days=7)).strftime("%Y-%m-%d")

    # Order A: Fits in one trip (Quantity 10 -> 10 * 0.05 = 0.5 space units)
    st, res_a = cust.request("POST", "/api/v1/orders", {
        "destination_hub": "CMB",
        "recipient_name": "Lanka Retail Colombo",
        "recipient_phone": "0771234567",
        "delivery_address": "123 Galle Road, Colombo 03",
        "booking_date": delivery_date,
        "weight_kg": 50.0,
        "items": [{"product_id": 1, "quantity": 10}]
    })
    print(f"Order A (fits-one-trip) placed: HTTP {st}, Order ID #{res_a.get('order_id')}")
    assert st == 201, f"Failed to place Order A: {res_a}"
    order_a_id = res_a["order_id"]

    # Create a 2nd trip for Colombo so spillover can happen
    dep_b = (datetime.datetime.now() + datetime.timedelta(days=3)).strftime("%Y-%m-%dT10:00:00")
    arr_b = (datetime.datetime.now() + datetime.timedelta(days=3, hours=4)).strftime("%Y-%m-%dT14:00:00")
    st, res_tb = lm.request("POST", "/api/v1/rail/trips", {
        "origin_station_id": 7,
        "destination_station_id": 1,
        "departure_datetime": dep_b,
        "arrival_datetime": arr_b,
        "total_capacity": 5.0
    })
    assert st == 201
    trip_b_id = res_tb["trip_id"]

    # Create 2 trips for Matara (Station #4)
    dep_c1 = (datetime.datetime.now() + datetime.timedelta(days=4)).strftime("%Y-%m-%dT10:00:00")
    arr_c1 = (datetime.datetime.now() + datetime.timedelta(days=4, hours=4)).strftime("%Y-%m-%dT14:00:00")
    dep_c2 = (datetime.datetime.now() + datetime.timedelta(days=5)).strftime("%Y-%m-%dT10:00:00")
    arr_c2 = (datetime.datetime.now() + datetime.timedelta(days=5, hours=4)).strftime("%Y-%m-%dT14:00:00")
    
    st, r1 = lm.request("POST", "/api/v1/rail/trips", {
        "origin_station_id": 7, "destination_station_id": 4, # Matara
        "departure_datetime": dep_c1, "arrival_datetime": arr_c1, "total_capacity": 2.0
    })
    st, r2 = lm.request("POST", "/api/v1/rail/trips", {
        "origin_station_id": 7, "destination_station_id": 4, # Matara
        "departure_datetime": dep_c2, "arrival_datetime": arr_c2, "total_capacity": 10.0
    })

    # Order B for Matara (needing 4.0 space units: 80 * 0.05 = 4.0 > 2.0)
    st, res_b = cust.request("POST", "/api/v1/orders", {
        "destination_hub": "MAT",
        "recipient_name": "Matara Wholesale",
        "recipient_phone": "0779988776",
        "delivery_address": "45 Beach Road, Matara",
        "booking_date": delivery_date,
        "weight_kg": 100.0,
        "items": [{"product_id": 1, "quantity": 80}]
    })
    print(f"Order B (spillover) placed: HTTP {st}, Order ID #{res_b.get('order_id')}")
    assert st == 201
    order_b_id = res_b["order_id"]

    # Order C: Too-big order (1000 units = 50.0 space units to Matara, but only 2 + 10 = 12 total capacity exists)
    st, res_c = cust.request("POST", "/api/v1/orders", {
        "destination_hub": "MAT",
        "recipient_name": "Matara Mega Mart",
        "recipient_phone": "0775544332",
        "delivery_address": "88 City Center, Matara",
        "booking_date": delivery_date,
        "weight_kg": 500.0,
        "items": [{"product_id": 1, "quantity": 1000}]
    })
    print(f"Order C (too-big order) placed: HTTP {st}, Order ID #{res_c.get('order_id')}")
    assert st == 201
    order_c_id = res_c["order_id"]

    # 4. Allocations via Rail Endpoint
    print("\n--- 3. Testing Allocation Outcomes (Single, Spillover, Too-Big) ---")
    
    # Allocate Order A (fits one trip)
    st, alloc_a = lm.request("POST", "/api/v1/rail/allocate", {"order_id": order_a_id})
    print(f"Allocate Order A (fits one trip): HTTP {st}, status_result: {alloc_a.get('status_result')}")
    assert st == 200 and alloc_a.get("status_result") == "SUCCESS_SINGLE_TRIP"
    assert len(alloc_a.get("allocations", [])) == 1

    # Allocate Order B (spillover)
    st, alloc_b = lm.request("POST", "/api/v1/rail/allocate", {"order_id": order_b_id})
    print(f"Allocate Order B (spillover): HTTP {st}, status_result: {alloc_b.get('status_result')}")
    assert st == 200 and alloc_b.get("status_result") in ["SUCCESS_MULTI_TRIP", "SUCCESS_MULTI_TRIP_SPILLOVER"]
    assert len(alloc_b.get("allocations", [])) == 2
    print(f"  -> Order B split across {len(alloc_b['allocations'])} train trips: {alloc_b['allocations']}")

    # Allocate Order C (too big -> must get HTTP 400 INSUFFICIENT_RAIL_CAPACITY)
    st, alloc_c = lm.request("POST", "/api/v1/rail/allocate", {"order_id": order_c_id})
    print(f"Allocate Order C (too big): HTTP {st}, response: {alloc_c}")
    assert st == 400
    assert "INSUFFICIENT_RAIL_CAPACITY" in str(alloc_c)
    print("  -> Verified: Too-big order correctly rolled back and rejected with HTTP 400 INSUFFICIENT_RAIL_CAPACITY!")

    # 5. Check Breakdown and Reversal
    print("\n--- 4. Checking Breakdown and Status Changes ---")
    st, bk = lm.request("GET", f"/api/v1/rail/orders/{order_b_id}/allocations")
    print(f"Breakdown for Order #{order_b_id}: {bk}")
    assert st == 200 and len(bk["allocations"]) == 2

    # Reverse Order B allocation
    st, rev = lm.request("POST", f"/api/v1/rail/orders/{order_b_id}/reverse")
    print(f"Reverse Order #{order_b_id}: HTTP {st}, status_result: {rev.get('status_result')}")
    assert st == 200 and rev.get("status_result") == "SUCCESS_REVERSED"

    print("\n=== COMPLETE LIFECYCLE TEST PASSED WITH FLYING COLORS ===")

if __name__ == "__main__":
    test_full_lifecycle()
