import requests
import sys

try:
    response = requests.get('http://127.0.0.1:8000/about/')
    if response.status_code == 200:
        print("SUCCESS: About page is accessible (Status 200)")
        if "About TodoApp" in response.text:
            print("SUCCESS: About page content verified")
        else:
            print("WARNING: 'About TodoApp' text not found in response")
    else:
        print(f"FAILURE: About page returned status {response.status_code}")
        sys.exit(1)
except Exception as e:
    print(f"FAILURE: Could not connect to server: {e}")
    sys.exit(1)
