import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todoproject.settings')
django.setup()

from django.contrib.sites.models import Site
from django.conf import settings

print(f"SITE_ID in settings: {settings.SITE_ID}")
try:
    site = Site.objects.get(pk=settings.SITE_ID)
    print(f"Site found: {site.domain} (ID: {site.id})")
except Site.DoesNotExist:
    print(f"Site with ID {settings.SITE_ID} does NOT exist.")
    print("Available sites:")
    for s in Site.objects.all():
        print(f"- {s.domain} (ID: {s.id})")
