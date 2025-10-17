"""
Task Module Protocols

Defines contracts for TaskRepository and TaskService.
Following Dependency Inversion Principle - depend on abstractions, not implementations.
"""

from typing import Protocol, TYPE_CHECKING, Optional, Tuple
from app.modules.tasks.schemas import TaskCreate, TaskUpdate, TaskResponse, TaskPaginationResponse, TaskFilter, TaskPaginationRequest

if TYPE_CHECKING:
    from app.modules.tasks.models import Task

class TaskRepositoryProtocol(Protocol):
    """
    Interface for task data access layer using SQLAlchemy ORM.
    """
    
    def create(self, task_data: TaskCreate, owner_id: str) -> TaskResponse:
        """Create a new task in database."""
        ...
    
    def get_by_id(self, task_id: str, owner_id: str) -> TaskResponse | None:
        """Get task by ID"""
        ...
    
    def get_list(
        self, 
        owner_id: str, 
        cursor: Optional[str] = None, 
        limit: int = 20,
        filters: Optional[TaskFilter] = None
    ) -> Tuple[list[TaskResponse], Optional[str], bool]:
        """Get paginated tasks for a specific owner using cursor-based pagination."""
        ...
    
    def update(self, task_id: str, task_data: TaskUpdate, owner_id: str) -> TaskResponse | None:
        """Update a task."""
        ...
    
    def delete(self, task_id: str, owner_id: str) -> bool:
        """Delete a task."""
        ...

class TaskServiceProtocol(Protocol):
    """
    Interface for task business logic layer.
    """
    
    def create_task(self, task_data: TaskCreate, owner_id: str) -> TaskResponse:
        """Create a new task."""
        ...
    
    def get_task(self, task_id: str) -> TaskResponse | None:
        """Get task by ID."""
        ...
    
    def get_list(
        self, 
        owner_id: str, 
        pagination_request: TaskPaginationRequest
    ) -> TaskPaginationResponse:
        """Get paginated tasks for a specific owner."""
        ...
    
    def update_task(self, task_id: str, task_data: TaskUpdate, owner_id: str) -> TaskResponse | None:
        """Update a task."""
        ...
    
    def delete_task(self, task_id: str) -> bool:
        """Delete a task."""
        ...