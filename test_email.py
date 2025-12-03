import os
import django
from django.core.mail import send_mail

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todoproject.settings')
django.setup()

print("Sending test email...")
send_mail(
    'Subject here',
    'Here is the message.',
    'from@example.com',
    ['to@example.com'],
    fail_silently=False,
)
print("Email sent.")
