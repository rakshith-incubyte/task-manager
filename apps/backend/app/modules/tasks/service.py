import uuid
from fastapi import HTTPException, status

from app.modules.tasks.interfaces import TaskRepositoryProtocol
from app.modules.tasks.schemas import TaskCreate
from app.modules.tasks.schemas import TaskUpdate
from app.modules.tasks.schemas import TaskResponse


class TaskService:
    def __init__(self, repository: TaskRepositoryProtocol):
        self.repository = repository

    def _generate_task_id(self) -> str:
        return str(uuid.uuid7())
    
    def create_task(self, task_data: TaskCreate, owner_id: str) -> TaskResponse:
        task_id = self._generate_task_id()
        return self.repository.create(task_id, task_data, owner_id)
    
    def get_task(self, task_id: str, owner_id: str) -> TaskResponse:
        """
        Get a task by ID for a specific owner.
        
        Args:
            task_id: Task identifier
            owner_id: Owner's user ID
        
        Returns:
            Task data
        
        Raises:
            HTTPException: If task not found or user doesn't own the task
        """
        if not task_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task ID is required"
            )
        
        task = self.repository.get_by_id(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Check ownership
        if task.owner_id != owner_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this task"
            )
        
        return task
    
    def get_all_tasks(self, owner_id: str) -> list[TaskResponse]:
        """
        Get all tasks for a specific owner.
        
        Args:
            owner_id: Owner's user ID
        
        Returns:
            List of tasks owned by the user
        """
        all_tasks = self.repository.get_all()
        # Filter tasks by owner
        return [task for task in all_tasks if task.owner_id == owner_id]
    
    def update_task(self, task_id: str, task_data: TaskUpdate, owner_id: str) -> TaskResponse:
        """
        Update a task for a specific owner.
        
        Args:
            task_id: Task identifier
            task_data: Updated task data
            owner_id: Owner's user ID
        
        Returns:
            Updated task data
        
        Raises:
            HTTPException: If task not found or user doesn't own the task
        """
        if not task_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task ID is required"
            )
        
        task = self.repository.get_by_id(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Check ownership
        if task.owner_id != owner_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this task"
            )
        
        return self.repository.update(task_id, task_data, owner_id)
    
    def delete_task(self, task_id: str, owner_id: str) -> bool:
        """
        Delete a task for a specific owner.
        
        Args:
            task_id: Task identifier
            owner_id: Owner's user ID
        
        Returns:
            True if deleted successfully
        
        Raises:
            HTTPException: If task not found or user doesn't own the task
        """
        if not task_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task ID is required"
            )
        
        task = self.repository.get_by_id(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Check ownership
        if task.owner_id != owner_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this task"
            )
        
        return self.repository.delete(task_id)
