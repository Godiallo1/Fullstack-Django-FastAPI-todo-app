from django.shortcuts import render
from rest_framework_simplejwt.tokens import RefreshToken

def index(request):
    """
    This view renders the main single-page application.
    If a user is authenticated (e.g., after a social auth redirect),
    it generates a JWT access token and embeds it in the template context.
    """
    context = {
        'jwt_access_token': 'null',
    }
    
    # Check if the request.user is a real, authenticated user and not an AnonymousUser
    if request.user and request.user.is_authenticated:
        # Generate token using a simple, direct method
        refresh = RefreshToken.for_user(request.user)
        access_token = str(refresh.access_token)
        
        # Add the token to the context that gets passed to the template
        context['jwt_access_token'] = access_token
        
    return render(request, "todo/index.html", context)

def about(request):
    return render(request, "todo/about.html")