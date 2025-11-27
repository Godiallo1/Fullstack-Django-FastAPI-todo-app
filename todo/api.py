from fastapi.security import OAuth2PasswordBearer
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import User
from fastapi import FastAPI, APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date
from asgiref.sync import sync_to_async

# Importing authentication API module
from . import auth_api

# Importing Django models
from .models import Task, Profile

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# --- Pydantic schemas ---

class TaskBase(BaseModel):
    """Schema for creating or updating tasks"""
    title: str
    description: Optional[str] = None
    priority: str = 'Low'
    due_date: date
    status: str = 'Queue' 
    # NEW: Allow order to be passed/read. Default to 0.0
    order: float = 0.0 
    
class TaskDisplay(TaskBase):
    """Schema for returning a task to a client"""
    id: int
    is_completed: bool 
    status: str       
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True 
        
class ProfileBase(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None

class ProfileDisplay(ProfileBase):
    username: str
    email: str
    
    class Config:
        from_attributes = True
    
class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[date] = None
    is_completed: Optional[bool] = None
    status: Optional[str] = None 
    # NEW: Allow updating order via PATCH (for drag & drop)
    order: Optional[float] = None 


# --- API Router ---
router = APIRouter()

# --- Dependencies ---

@sync_to_async
def get_user_from_token(token: str):
    try:
        access_token = AccessToken(token)
        user = User.objects.get(id=access_token['user_id'])
        return user
    except (InvalidToken, TokenError, User.DoesNotExist):
        return None

async def get_current_user(token: str = Depends(oauth2_scheme)):
    user = await get_user_from_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@sync_to_async
def get_task_or_404(task_id: int):
    try:
        return Task.objects.select_related('owner').get(pk=task_id)
    except Task.DoesNotExist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")    
    
# --- Endpoints ---

@router.get("/profile", response_model=ProfileDisplay)
async def get_profile(current_user: User = Depends(get_current_user)):
    profile, _ = await sync_to_async(Profile.objects.get_or_create)(user=current_user)
    return {
        "username": current_user.username,
        "email": current_user.email,
        "full_name": profile.full_name,
        "bio": profile.bio,
        "location": profile.location,
        "avatar_url": profile.avatar_url
    }

@router.put("/profile", response_model=ProfileDisplay)
async def update_profile(profile_data: ProfileBase, current_user: User = Depends(get_current_user)):
    profile, _ = await sync_to_async(Profile.objects.get_or_create)(user=current_user)
    update_data = profile_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    await sync_to_async(profile.save)()
    return {
        "username": current_user.username,
        "email": current_user.email,
        "full_name": profile.full_name,
        "bio": profile.bio,
        "location": profile.location,
        "avatar_url": profile.avatar_url
    }

@router.post("/", response_model=TaskDisplay, status_code=status.HTTP_201_CREATED)
async def create_task(task_data: TaskBase, current_user: User = Depends(get_current_user)):
    task_dict = task_data.dict()
    task_dict['status'] = 'Queue'
    
    # NEW: Automatically set order based on timestamp to ensure unique sort position
    task_dict['order'] = datetime.now().timestamp()
    
    new_task = await sync_to_async(Task.objects.create)(owner=current_user, **task_dict)
    return new_task

@router.get("/", response_model=List[TaskDisplay])
async def list_tasks(current_user: User = Depends(get_current_user)):
    # Tasks are auto-sorted by 'order' because we added "ordering = ['order']" in models.py
    tasks = await sync_to_async(list)(Task.objects.filter(owner=current_user))
    return tasks

@router.get("/{task_id}", response_model=TaskDisplay)
async def get_task(task_id: int, current_user: User = Depends(get_current_user)):
    task = await get_task_or_404(task_id)
    if task.owner != current_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=TaskDisplay)
async def update_task(task_id: int, task_data: TaskBase, current_user: User = Depends(get_current_user)):
    task = await get_task_or_404(task_id)
    if task.owner != current_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    for key, value in task_data.dict().items():
        setattr(task, key, value)
    
    await sync_to_async(task.save)()
    return task

@router.patch("/{task_id}", response_model=TaskDisplay)
async def partial_update_task(task_id: int, task_data: TaskUpdate, current_user: User = Depends(get_current_user)):
    task = await get_task_or_404(task_id)
    if task.owner != current_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    update_data = task_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
    
    await sync_to_async(task.save)()
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, current_user: User = Depends(get_current_user)):
    task = await get_task_or_404(task_id)
    if task.owner != current_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
    await sync_to_async(task.delete)()
    return None

# --- Main App ---
api = FastAPI(title="Todo API", description="API for managing tasks")
api.include_router(auth_api.router, prefix="/auth", tags=["Authentication"])
api.include_router(router, prefix="/tasks", tags=["Tasks"])