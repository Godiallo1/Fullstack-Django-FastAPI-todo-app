import requests
import time

BASE_URL = "http://127.0.0.1:8000/api"
USERNAME = "demo_tester"
EMAIL = "demo_tester@example.com"
PASSWORD = "password123"

# 1. Register
print(f"1. Registering user '{USERNAME}' with email '{EMAIL}'...")
register_data = {
    "username": USERNAME,
    "email": EMAIL,
    "password": PASSWORD,
    "password1": PASSWORD
}

try:
    resp = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    if resp.status_code == 201:
        print("   SUCCESS: Registration successful.")
        print("   -> An email should have been printed to the SERVER CONSOLE.")
    else:
        print(f"   FAILURE: Registration failed. Status: {resp.status_code}")
        print(f"   Response: {resp.text}")
except Exception as e:
    print(f"   ERROR: Could not connect to server. Is it running? {e}")
