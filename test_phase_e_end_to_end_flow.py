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

    # Create Trip 1 for Colombo with capacity 25.0
    dep_a = (datetime.datetime.now() + datetime.timedelta(days=2)).strftime("%Y-%m-%dT10:00:00")
    arr_a = (datetime.datetime.now() + datetime.timedelta(days=2, hours=4)).strftime("%Y-%m-%dT14:00:00")
    st, res_ta = lm.request("POST", "/api/v1/rail/trips", {
        "origin_station_id": 7,
        "destination_station_id": 1,
        "departure_datetime": dep_a,
        "arrival_datetime": arr_a,
        "total_capacity": 25.0
    })
    assert st == 201
    trip_a_id = res_ta["trip_id"]

    # Create Trip 2 for Colombo with capacity 10.0
    dep_b = (datetime.datetime.now() + datetime.timedelta(days=3)).strftime("%Y-%m-%dT10:00:00")
    arr_b = (datetime.datetime.now() + datetime.timedelta(days=3, hours=4)).strftime("%Y-%m-%dT14:00:00")
    st, res_tb = lm.request("POST", "/api/v1/rail/trips", {
        "origin_station_id": 7,
        "destination_station_id": 1,
        "departure_datetime": dep_b,
        "arrival_datetime": arr_b,
        "total_capacity": 10.0
    })
    assert st == 201
    trip_b_id = res_tb["trip_id"]

    # Define delivery date 7 days ahead
    delivery_date = (datetime.datetime.now() + datetime.timedelta(days=7)).strftime("%Y-%m-%d")

    # Order A: Fits in one trip (Quantity 50 -> 50 * 0.05 = 2.5 space units, fits easily in 5.0 trip)
    st, res_a = cust.request("POST", "/api/v1/orders", {
        "destination_hub": "CMB",
        "recipient_name": "Lanka Retail Colombo",
        "recipient_phone": "0771234567",
        "delivery_address": "123 Galle Road, Colombo 03",
        "booking_date": delivery_date,
        "weight_kg": 100.0,
        "items": [{"product_id": 1, "quantity": 50}]
    })
    print(f"Order A (fits-one-trip) placed: HTTP {st}, Order ID #{res_a.get('order_id')}")
    assert st == 201, f"Failed to place Order A: {res_a}"
    order_a_id = res_a["order_id"]

    # Order B: Spillover order (Quantity 1200 -> 1200 * 0.05 = 60.0 space units. Trip has 50.0 left -> spills over across 2 trips)
    st, res_b = cust.request("POST", "/api/v1/orders", {
        "destination_hub": "CMB",
        "recipient_name": "Colombo Wholesale",
        "recipient_phone": "0779988776",
        "delivery_address": "45 Beach Road, Colombo",
        "booking_date": delivery_date,
        "weight_kg": 600.0,
        "items": [{"product_id": 1, "quantity": 1200}]
    })
    print(f"Order B (spillover) placed: HTTP {st}, Order ID #{res_b.get('order_id')}")
    assert st == 201
    order_b_id = res_b["order_id"]

    # Order C: Too-big order (Quantity 5000 -> 5000 * 0.05 = 250 space units, exceeding all available trips)
    st, res_c = cust.request("POST", "/api/v1/orders", {
        "destination_hub": "CMB",
        "recipient_name": "Colombo Mega Mart",
        "recipient_phone": "0775544332",
        "delivery_address": "88 City Center, Colombo",
        "booking_date": delivery_date,
        "weight_kg": 2500.0,
        "items": [{"product_id": 1, "quantity": 5000}]
    })
    print(f"Order C (too-big order) placed: HTTP {st}, Order ID #{res_c.get('order_id')}")
    assert st == 201
    order_c_id = res_c["order_id"]

    # 4. Allocations via Rail Endpoint
    print("\n--- 3. Testing Allocation Outcomes (Single, Spillover, Too-Big) ---")
    
    # Allocate Order A (fits one trip)
    st, alloc_a = lm.request("POST", "/api/v1/rail/allocate", {"order_id": order_a_id})
    print(f"Allocate Order A (fits one trip): HTTP {st}, response: {alloc_a}")
    assert st == 200 and alloc_a.get("status_result") == "SUCCESS_SINGLE_TRIP"
    assert len(alloc_a.get("allocations", [])) == 1

    # Allocate Order B (spillover)
    st, alloc_b = lm.request("POST", "/api/v1/rail/allocate", {"order_id": order_b_id})
    print(f"Allocate Order B (spillover): HTTP {st}, response: {alloc_b}")
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
