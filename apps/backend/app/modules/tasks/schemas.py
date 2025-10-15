from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.modules.tasks.models import TaskPriority, TaskStatus

class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1, max_length=2048)
    status: TaskStatus = Field(default=TaskStatus.TODO)
    priority: TaskPriority = Field(default=TaskPriority.LOW)

class TaskCreate(TaskBase):
    ...

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(
        default=None, 
        min_length=1, 
        max_length=255,
        description="Task title"
    )
    description: Optional[str] = Field(
        default=None, 
        min_length=1, 
        max_length=2048,
        description="Task description"
    )
    status: Optional[TaskStatus] = Field(
        default=None,
        description="Task status"
    )
    priority: Optional[TaskPriority] = Field(
        default=None,
        description="Task priority"
    )
    

class TaskResponse(TaskBase):
    id: str = Field(description="Task ID (UUIDv7)")
    owner_id: str = Field(description="Owner ID (UUIDv7)")
    created_at: datetime = Field(description="Creation timestamp")
    updated_at: datetime = Field(description="Last update timestamp")

    model_config = {
        "from_attributes": True,  # Allows conversion from SQLAlchemy models
        "json_schema_extra": {
            "example": {
                "id": "01234567-89ab-cdef-0123-456789abcdef",
                "title": "Test Task",
                "description": "This is a test task",
                "status": "todo",
                "priority": "low",
                "owner_id": "01234567-89ab-cdef-0123-456789abcdef",
                "created_at": "2025-10-14T12:00:00",
                "updated_at": None
            }
        }
    }
