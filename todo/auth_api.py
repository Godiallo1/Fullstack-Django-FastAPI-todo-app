# todo/auth_api.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import User
from asgiref.sync import sync_to_async
from rest_framework_simplejwt.tokens import RefreshToken
from pydantic import BaseModel

User = get_user_model()
router = APIRouter()

class UserCreate(BaseModel):
    username: str
    password: str
    email: str

class Token(BaseModel):
    access: str
    refresh: str

@sync_to_async
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate):
    try:
        user = await sync_to_async(User.objects.create_user)(
            username=user_data.username,
            password=user_data.password,
            email=user_data.email
        )
        
        # Create EmailAddress for allauth
        from allauth.account.models import EmailAddress
        
        email_address = await sync_to_async(EmailAddress.objects.create)(
            user=user,
            email=user.email,
            primary=True,
            verified=False
        )
        
        # Send confirmation email
        # We pass request=None, relying on the Sites framework
        await sync_to_async(email_address.send_confirmation)(request=None)
        
        return {"username": user.username, "email": user.email}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await sync_to_async(authenticate)(
        username=form_data.username, 
        password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    tokens = await get_tokens_for_user(user)
    return tokens