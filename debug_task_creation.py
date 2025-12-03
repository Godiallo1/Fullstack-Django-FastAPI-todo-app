import os
import django
import sys
from datetime import date, datetime

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todoproject.settings')
django.setup()

from todo.models import Task
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.get(username="verifieduser")

try:
    task = Task.objects.create(
        title="Debug Task",
        description="Testing creation",
        priority="Low",
        due_date=date.today(),
        status="Queue",
        order=datetime.now().timestamp(),
        owner=user
    )
    print(f"Task created: {task.id}")
except Exception as e:
    print(f"Error creating task: {e}")
    import traceback
    traceback.print_exc()
