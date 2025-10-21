from typing import Optional
from fastapi import HTTPException, status

from app.modules.tasks.interfaces import TaskRepositoryProtocol
from app.modules.tasks.schemas import TaskCreate
from app.modules.tasks.schemas import TaskUpdate
from app.modules.tasks.schemas import TaskResponse
from app.modules.tasks.schemas import TaskPaginationResponse
from app.modules.tasks.schemas import TaskPaginationRequest
from app.modules.tasks.schemas import TaskImportResult


from app.modules.tasks.file_handler import TaskFileHandler


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

    def export_tasks_csv(self, owner_id: str, pagination_request: TaskPaginationRequest) -> str:
        """
        Export tasks to CSV format.
        
        Args:
            owner_id: ID of the user exporting tasks
            pagination_request: Pagination and filtering parameters
            
        Returns:
            CSV content as string
        """
        # Get tasks with filters
        result = self.get_list(owner_id, pagination_request)
        
        # Use file handler to generate CSV
        return TaskFileHandler.export_to_csv(result.data)

    def import_tasks_csv(self, csv_content: bytes, owner_id: str) -> TaskImportResult:
        """
        Import tasks from CSV content.
        
        Args:
            csv_content: Raw CSV file content as bytes
            owner_id: ID of the user importing tasks
            
        Returns:
            TaskImportResult with success/error counts
        """
        # Guard clause: Validate owner_id
        if not owner_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Owner ID is required"
            )
        
        success_count = 0
        error_count = 0
        
        try:
            # Parse CSV using file handler
            for row in TaskFileHandler.parse_csv(csv_content):
                try:
                    # Validate row
                    if not TaskFileHandler.validate_csv_row(row):
                        error_count += 1
                        continue
                    
                    # Convert row to TaskCreate
                    task_data = TaskFileHandler.row_to_task_create(row)
                    
                    # Create task
                    self.create_task(task_data, owner_id)
                    success_count += 1
                    
                except Exception as e:
                    # Log error but continue processing
                    print(f"Error importing row: {row}, Error: {str(e)}")
                    error_count += 1
            
            return TaskImportResult(
                success_count=success_count,
                error_count=error_count,
                total_processed=success_count + error_count
            )
            
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to process CSV file: {str(e)}"
            )
