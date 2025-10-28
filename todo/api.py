from fastapi.security import OAuth2PasswordBearer
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import User
from fastapi import FastAPI, APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date
from asgiref.sync import sync_to_async

#Importing authentication API module
from . import auth_api


# Importing Django models
from .models import Task

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# --- Pydantic schemas ---
#Defining the data shapes for API requests and responses


class TaskBase(BaseModel):
    """Schema for creating or updating tasks"""
    title: str
    description: Optional[str] = None
    priority: str = 'Low'
    due_date: date
    
class TaskDisplay(TaskBase):
    """Schema for returning a task to a client"""
    id: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        """Allow Pydantic models to work with ORM objects"""
        orm_mode = True
    
class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[date] = None
    is_completed: Optional[bool] = None



# --- API Router ---
#Grouping related API endpoints together


#Creating FastAPI instance to organize the task-related endpoints
router = APIRouter()


# --- Asynchronous Database Operations and Dependencies ---

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
    """
    Asynchronously get a task by ID or raise 404 error if not found.
    Crucially, it uses select_related('owner') to pre-fetch the related user
    in the same database query, avoiding synchronous operations in async code.
    """
    try:
        # Use select_related to join the owner table and fetch the user data
        # in the same synchronous, wrapped database call.
        return Task.objects.select_related('owner').get(pk=task_id)
    except Task.DoesNotExist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")    
    
# --- API Endpoints ---

@router.post("/", response_model=TaskDisplay, status_code=status.HTTP_201_CREATED)
async def create_task(task_data: TaskBase, current_user: User = Depends(get_current_user)):
    """
    Creating a new task.
    """
    task_dict = task_data.dict()
    # Associating the task with the logged-in user
    new_task = await sync_to_async(Task.objects.create)(owner=current_user, **task_dict)
    return new_task

@router.get("/", response_model=List[TaskDisplay])
async def list_tasks(current_user: User = Depends(get_current_user)):
    """
    Retrieving a list of all tasks.
    """
    # Only listing tasks for the logged-in user
    tasks = await sync_to_async(list)(Task.objects.filter(owner=current_user))
    return tasks

@router.get("/{task_id}", response_model=TaskDisplay)
async def get_task(task_id: int, current_user: User = Depends(get_current_user)):
    # Ensuring user can only get their own task
    task = await get_task_or_404(task_id)
    if task.owner != current_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=TaskDisplay)
async def update_task(task_id: int, task_data: TaskBase, current_user: User = Depends(get_current_user)):
    """
    Update an existing task's details.
    """
    task = await get_task_or_404(task_id)
    # CORRECTION: Adding authorization check
    if task.owner != current_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # Updating fields from the request data
    for key, value in task_data.dict().items():
        setattr(task, key, value)
    
    await sync_to_async(task.save)()
    return task

@router.patch("/{task_id}", response_model=TaskDisplay)
async def partial_update_task(task_id: int, task_data: TaskUpdate, current_user: User = Depends(get_current_user)):
    """
    Partially update a task. Used for toggling completion or other single-field updates.
    """
    task = await get_task_or_404(task_id)
    # CORRECTION: Adding authorization check
    if task.owner != current_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    update_data = task_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
    
    await sync_to_async(task.save)()
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, current_user: User = Depends(get_current_user)):
    """
    Delete a task.
    """
    task = await get_task_or_404(task_id)
    # CORRECTION: Adding authorization check
    if task.owner != current_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
    await sync_to_async(task.delete)()
    # A 204 response should not have a body, so we return None.
    return None



# --- Main FastAPI Application instance ---

# This is the main FastAPI app instance that Django will mount.
api = FastAPI(
    title="Todo API",
    description="API for managing tasks",
)

# Including the auth_api router for auth endpoints
api.include_router(auth_api.router, prefix="/auth", tags=["Authentication"])

# Including the task router, prefixing all its endpoints with /tasks
api.include_router(router, prefix="/tasks", tags=["Tasks"])