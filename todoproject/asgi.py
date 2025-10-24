"""
ASGI config for todoproject project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from starlette.routing import Mount
from starlette.applications import Starlette

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todoproject.settings')

# Get the standard Django ASGI application
django_asgi_app = get_asgi_application()


# Import FastAPI app AFTER setting the environment variable
from todo.api import api as fastapi_app


# Creating a new top-level Starlette application
application = Starlette(
    routes=[
        # Mount the FastAPI app at the "/api" path
        Mount("/api", app=fastapi_app),

        # Mount the Django app at the root path "/"
        # This is a catch-all for any request not matching "/api"
        Mount("/", app=django_asgi_app),
    ]
)
