"""
Task Module Protocols

Defines contracts for TaskRepository and TaskService.
Following Dependency Inversion Principle - depend on abstractions, not implementations.
"""

from typing import Protocol, TYPE_CHECKING
from app.modules.tasks.schemas import TaskCreate, TaskUpdate, TaskResponse

if TYPE_CHECKING:
    from app.modules.tasks.models import Task

class TaskRepositoryProtocol(Protocol):
    """
    Interface for task data access layer using SQLAlchemy ORM.
    """
    
    def create(self, task_id: str, task_data: TaskCreate, owner_id: str) -> TaskResponse:
        """Create a new task in database."""
        ...
    
    def get_by_id(self, task_id: str) -> TaskResponse | None:
        """Get task by ID"""
        ...
    
    def get_all(self) -> list[TaskResponse]:
        """Get all tasks."""
        ...
    
    def update(self, task_id: str, task_data: TaskUpdate, owner_id: str) -> TaskResponse | None:
        """Update a task."""
        ...
    
    def delete(self, task_id: str) -> bool:
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
    
    def get_all_tasks(self) -> list[TaskResponse]:
        """Get all tasks."""
        ...
    
    def update_task(self, task_id: str, task_data: TaskUpdate, owner_id: str) -> TaskResponse | None:
        """Update a task."""
        ...
    
    def delete_task(self, task_id: str) -> bool:
        """Delete a task."""
        ...