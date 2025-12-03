import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

# 1. Login
login_data = {"username": "testuser1", "password": "Testuser1"}
response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
if response.status_code != 200:
    print(f"Login failed: {response.text}")
    exit(1)

token = response.json()["access"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# 2. Create Tasks
tasks = ["Task A", "Task B", "Task C"]
created_tasks = []
for title in tasks:
    # Adding a small delay to ensure timestamps are different for order
    time.sleep(0.1)
    data = {"title": title, "due_date": "2025-12-31", "priority": "Low"}
    resp = requests.post(f"{BASE_URL}/tasks/", headers=headers, json=data)
    if resp.status_code == 201:
        created_tasks.append(resp.json())
        print(f"Created {title}")
    else:
        print(f"Failed to create {title}: {resp.text}")

# 3. Verify Initial Order (should be by creation time/order field)
print("Initial Order:")
list_resp = requests.get(f"{BASE_URL}/tasks/", headers=headers)
current_tasks = list_resp.json()
# Filter only the tasks we just created to avoid noise from previous runs
current_tasks = [t for t in current_tasks if t['title'] in tasks]

for t in current_tasks:
    print(f"{t['title']} - Order: {t['order']}")

if len(current_tasks) < 2:
    print("Not enough tasks to test reordering.")
    exit(1)

# 4. Reorder: Move Task A (index 0) to be after Task B (index 1)
# Assuming Task A is first and Task B is second based on creation
task_a = [t for t in current_tasks if t['title'] == "Task A"][0]
task_b = [t for t in current_tasks if t['title'] == "Task B"][0]

new_order = task_b['order'] + 100.0
print(f"Moving Task A to order {new_order} (after Task B)")

patch_resp = requests.patch(f"{BASE_URL}/tasks/{task_a['id']}", headers=headers, json={"order": new_order})
if patch_resp.status_code == 200:
    print("Update successful")
else:
    print(f"Update failed: {patch_resp.text}")

# 5. Verify New Order
print("New Order:")
list_resp = requests.get(f"{BASE_URL}/tasks/", headers=headers)
new_tasks = list_resp.json()
new_tasks = [t for t in new_tasks if t['title'] in tasks]

for t in new_tasks:
    print(f"{t['title']} - Order: {t['order']}")

task_a_new = [t for t in new_tasks if t['title'] == "Task A"][0]
task_b_new = [t for t in new_tasks if t['title'] == "Task B"][0]

if task_a_new['order'] > task_b_new['order']:
    print("SUCCESS: Task A is now after Task B")
else:
    print("FAILURE: Task A is NOT after Task B")
