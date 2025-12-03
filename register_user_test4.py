import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

# 1. Register
register_data = {
    "username": "emailtest4",
    "email": "emailtest4@example.com",
    "password": "password123",
    "password1": "password123"
}
print("Registering emailtest4...")
resp = requests.post(f"{BASE_URL}/auth/register", json=register_data)
if resp.status_code == 201:
    print("Registration successful.")
else:
    print(f"Registration failed: {resp.text}")
