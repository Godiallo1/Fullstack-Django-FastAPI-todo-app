import requests

BASE_URL = "http://127.0.0.1:8000/api"
CONFIRM_URL = "http://127.0.0.1:8000/accounts/confirm-email/OA:1vQnqS:2n7V819emZ8G060_QEJV84spSTr8HUDESQc_56obZD4/"
USERNAME = "demo_tester"
PASSWORD = "password123"

# 1. Confirm Email
print(f"Visiting {CONFIRM_URL}...")
resp = requests.get(CONFIRM_URL)
if resp.status_code == 200:
    print("   SUCCESS: Confirmation page loaded.")
else:
    print(f"   FAILURE: Confirmation failed. Status: {resp.status_code}")

# 2. Login
print(f"Logging in as {USERNAME}...")
login_data = {"username": USERNAME, "password": PASSWORD}
resp = requests.post(f"{BASE_URL}/auth/login", data=login_data)
if resp.status_code == 200:
    print("   SUCCESS: Login successful!")
    print(f"   Token: {resp.json().get('access')[:20]}...")
else:
    print(f"   FAILURE: Login failed. Status: {resp.status_code}")
    print(f"   Response: {resp.text}")
