import os
import sys
import django

# Add the project directory to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todoproject.settings')
django.setup()

from django.contrib.auth import get_user_model
from allauth.account.models import EmailAddress

User = get_user_model()

username = "verifieduser"
email = "verified@example.com"
password = "password123"

try:
    user = User.objects.get(username=username)
    print(f"User {username} found. Updating password...")
except User.DoesNotExist:
    print(f"User {username} not found. Creating...")
    user = User.objects.create_user(username=username, email=email)

user.set_password(password)
user.save()

# Ensure email is verified
email_address, created = EmailAddress.objects.get_or_create(user=user, email=email)
email_address.verified = True
email_address.primary = True
email_address.save()

print(f"User {username} ready with password: {password}")
