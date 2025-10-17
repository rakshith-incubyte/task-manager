from typing import Optional
from fastapi import HTTPException, status

from app.modules.tasks.interfaces import TaskRepositoryProtocol
from app.modules.tasks.schemas import TaskCreate
from app.modules.tasks.schemas import TaskUpdate
from app.modules.tasks.schemas import TaskResponse
from app.modules.tasks.schemas import TaskPaginationResponse
from app.modules.tasks.schemas import TaskPaginationRequest


class TaskService:
    def __init__(self, repository: TaskRepositoryProtocol):
        self.repository = repository

    def create_task(self, task_data: TaskCreate, owner_id: str) -> TaskResponse:
        return self.repository.create(task_data, owner_id)
    
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
        
        task = self.repository.get_by_id(task_id, owner_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        return task
    
    def get_list(
        self, 
        owner_id: str, 
        pagination_request: TaskPaginationRequest
    ) -> TaskPaginationResponse:
        """
        Get paginated tasks for a specific owner using cursor-based pagination.
        
        Args:
            owner_id: Owner's user ID
            pagination_request: Pagination and filter parameters
            
        Returns:
            Paginated task response
        """
        if not owner_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Owner ID is required"
            )
        
        # Extract filters from pagination request
        filters = None
        if (pagination_request.status is not None or 
            pagination_request.priority is not None or
            pagination_request.created_after is not None or
            pagination_request.created_before is not None or
            pagination_request.updated_after is not None or
            pagination_request.updated_before is not None):
            
            from app.modules.tasks.schemas import TaskFilter
            filters = TaskFilter(
                status=pagination_request.status,
                priority=pagination_request.priority,
                created_after=pagination_request.created_after,
                created_before=pagination_request.created_before,
                updated_after=pagination_request.updated_after,
                updated_before=pagination_request.updated_before
            )
        
        # Get paginated tasks from repository
        tasks, next_cursor, has_more = self.repository.get_list(
            owner_id=owner_id,
            cursor=pagination_request.cursor,
            limit=pagination_request.limit,
            filters=filters
        )
        
        return TaskPaginationResponse(
            data=tasks,
            next_cursor=next_cursor,
            has_more=has_more
        )
    
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
        
        task = self.repository.get_by_id(task_id, owner_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
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
        
        task = self.repository.get_by_id(task_id, owner_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        return self.repository.delete(task_id, owner_id)
