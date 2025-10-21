from datetime import datetime
from typing import Optional
from fastapi import UploadFile

from pydantic import BaseModel, Field

from app.modules.tasks.models import TaskPriority, TaskStatus

class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, min_length=1, max_length=2048)
    status: TaskStatus = Field(default=TaskStatus.TODO)
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM)

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


class TaskFilter(BaseModel):
    """Filter schema for task queries."""
    status: Optional[TaskStatus] = Field(
        default=None,
        description="Filter by task status"
    )
    priority: Optional[TaskPriority] = Field(
        default=None,
        description="Filter by task priority"
    )
    created_after: Optional[datetime] = Field(
        default=None,
        description="Filter tasks created after this datetime"
    )
    created_before: Optional[datetime] = Field(
        default=None,
        description="Filter tasks created before this datetime"
    )
    updated_after: Optional[datetime] = Field(
        default=None,
        description="Filter tasks updated after this datetime"
    )
    updated_before: Optional[datetime] = Field(
        default=None,
        description="Filter tasks updated before this datetime"
    )


class TaskPaginationRequest(BaseModel):
    """Request schema for task pagination."""
    cursor: Optional[str] = Field(
        default=None,
        description="Cursor for pagination (task ID to start after)"
    )
    limit: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Number of tasks to return (1-100)"
    )
    
    # Filter parameters
    status: Optional[TaskStatus] = Field(
        default=None,
        description="Filter by task status"
    )
    priority: Optional[TaskPriority] = Field(
        default=None,
        description="Filter by task priority"
    )
    created_after: Optional[datetime] = Field(
        default=None,
        description="Filter tasks created after this datetime"
    )
    created_before: Optional[datetime] = Field(
        default=None,
        description="Filter tasks created before this datetime"
    )
    updated_after: Optional[datetime] = Field(
        default=None,
        description="Filter tasks updated after this datetime"
    )
    updated_before: Optional[datetime] = Field(
        default=None,
        description="Filter tasks updated before this datetime"
    )


class TaskPaginationResponse(BaseModel):
    """Response schema for paginated tasks."""
    data: list[TaskResponse] = Field(description="List of tasks")
    next_cursor: Optional[str] = Field(
        default=None,
        description="Cursor for next page (None if no more pages)"
    )
    has_more: bool = Field(
        default=False,
        description="Whether there are more tasks available"
    )


class TaskImportResponse(BaseModel):
    """Response schema for CSV import."""
    message: str = Field(description="Import status message")
    status: str = Field(description="Import status (processing, completed, failed)")
    filename: str = Field(description="Name of the imported file")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "message": "CSV import started",
                "status": "processing",
                "filename": "tasks.csv"
            }
        }
    }


class TaskFileUpload(BaseModel):
    """Schema for file upload validation."""
    file: UploadFile = Field(description="CSV file containing tasks to import")
    
    @staticmethod
    def validate_csv_file(file: UploadFile) -> None:
        """
        Validate that uploaded file is a CSV.
        
        Args:
            file: Uploaded file
            
        Raises:
            ValueError: If file is not a CSV
        """
        if not file.filename.endswith('.csv'):
            raise ValueError("File must be a CSV file")
        
        if file.content_type and file.content_type not in ['text/csv', 'application/csv']:
            raise ValueError(f"Invalid content type: {file.content_type}. Expected text/csv")



class TaskImportResult(BaseModel):
    """Result schema for CSV import processing."""
    success_count: int = Field(description="Number of successfully imported tasks")
    error_count: int = Field(description="Number of failed imports")
    total_processed: int = Field(description="Total number of rows processed")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "success_count": 45,
                "error_count": 5,
                "total_processed": 50
            }
        }
    }

