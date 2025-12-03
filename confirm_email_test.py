import requests

BASE_URL = "http://127.0.0.1:8000/api"
CONFIRM_URL = "http://127.0.0.1:8000/accounts/confirm-email/Nw:1vQ73z:uDz1iwJE8TcdNsHM966r6oKdDyI_PqYtJfX9GUcTIVk/"

# 1. Confirm Email
print(f"Visiting {CONFIRM_URL}...")
resp = requests.get(CONFIRM_URL)
if resp.status_code == 200:
    print("Confirmation page loaded (success).")
else:
    print(f"Confirmation failed: {resp.status_code}")
    # It might redirect or show a template. 200 is good.

# 2. Login
login_data = {"username": "emailtest6", "password": "password123"}
print("Logging in...")
resp = requests.post(f"{BASE_URL}/auth/login", data=login_data)
if resp.status_code == 200:
    print("Login successful!")
    print(resp.json())
else:
    print(f"Login failed: {resp.text}")
