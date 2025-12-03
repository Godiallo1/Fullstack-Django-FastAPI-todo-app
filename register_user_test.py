import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

# 1. Register
register_data = {
    "username": "emailtest",
    "email": "emailtest@example.com",
    "password": "password123",
    "password1": "password123"
}
print("Registering...")
resp = requests.post(f"{BASE_URL}/auth/register", json=register_data)
if resp.status_code == 201:
    print("Registration successful.")
    print(resp.json())
else:
    print(f"Registration failed: {resp.text}")
    # If already exists, we can proceed to check logs or login
    if "A user with that username already exists" in resp.text:
        print("User already exists, proceeding...")

# 2. Pause to let the user (me) check the logs for the link
print("\nCheck the server logs for the verification link now.")
