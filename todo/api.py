from fastapi import FastAPI, APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date
from asgiref.sync import sync_to_async


# Import Django models
from .models import Task

#Pydantic schemas
#Defining the data shapes for API srequest and responses

class TaskBase(BaseModel):
    """Schema for creating or updating tasks"""
    title: str
    description: Optional[str] = None
    priority: str = 'low'
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



#API Router
#Grouping related API endpoints together


#Creating FastAPI instance to organize the task-related endpoints
router = APIRouter()


#Asynchronous Database Operations


@sync_to_async
def get_task_or_404(task_id: int):
    """Asynchronously get a task by ID or raise 404 error if not found."""
    try:
        return Task.objects.get(pk=task_id)
    except Task.DoesNotExist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    
#API Endpoints

@router.post("/", response_model=TaskDisplay, status_code=status.HTTP_201_CREATED)
async def create_task(task_data: TaskBase):
    """
    Creating a new task.
    """
    task_dict = task_data.dict()
    new_task = await sync_to_async(Task.objects.create)(**task_dict)
    return new_task


@router.get("/", response_model=List[TaskDisplay])
async def list_tasks():
    """
    Retrieving a list of all tasks.
    """
    tasks = await sync_to_async(list)(Task.objects.all())
    return tasks

@router.get("/{task_id}", response_model=TaskDisplay)
async def get_task(task_id: int):
    """
    Retrieving a single task by its ID.
    """
    task = await get_task_or_404(task_id)
    return task

@router.put("/{task_id}", response_model=TaskDisplay)
async def update_task(task_id: int, task_data: TaskBase):
    """
    Update an existing task's details.
    """
    task = await get_task_or_404(task_id)
    
    # Updating fields from the request data
    for key, value in task_data.dict().items():
        setattr(task, key, value)
    
    await sync_to_async(task.save)()
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int):
    """
    Delete a task.
    """
    task = await get_task_or_404(task_id)
    await sync_to_async(task.delete)()
    # A 204 response should not have a body, so we return None.
    return None

@router.patch("/{task_id}/complete", response_model=TaskDisplay)
async def mark_task_as_complete(task_id: int):
    """
    Mark a task as complete.
    """
    task = await get_task_or_404(task_id)
    
    if not task.is_completed:
        task.is_completed = True
        await sync_to_async(task.save)()
        
    return task

#Main FastAPI Application instance


# This is the main FastAPI app instance that Django will mount.
api = FastAPI(
    title="Todo API",
    description="API for managing tasks",
)

# Including the router, prefixing all its endpoints with /tasks
api.include_router(router, prefix="/tasks", tags=["Tasks"])



