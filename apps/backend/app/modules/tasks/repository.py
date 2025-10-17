"""
Task repository - SQLAlchemy ORM data access layer.
"""

import uuid
from typing import Optional, Tuple
from app.modules.tasks.interfaces import TaskRepositoryProtocol
from app.modules.tasks.schemas import TaskCreate
from app.modules.tasks.schemas import TaskResponse
from app.modules.tasks.schemas import TaskUpdate
from app.modules.tasks.schemas import TaskPaginationResponse
from app.modules.tasks.schemas import TaskFilter
from app.modules.tasks.models import Task

class TaskRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def _generate_task_id(self) -> str:
        """Generate a unique task ID using UUID v7."""
        return str(uuid.uuid7())
    
    def create(self, task_data: TaskCreate, owner_id: str) -> TaskResponse:
        task_id = self._generate_task_id()
        task = Task(
            id=task_id,
            title=task_data.title,
            description=task_data.description,
            priority=task_data.priority,
            status=task_data.status,
            owner_id=owner_id
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return TaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            status=task.status,
            owner_id=task.owner_id,
            created_at=task.created_at,
            updated_at=task.updated_at
        )
    
    def get_by_id(self, task_id: str, owner_id: str) -> TaskResponse | None:
        task = self.db.query(Task).filter(Task.id == task_id, Task.owner_id == owner_id).first()
        if not task:
            return None
        return TaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            status=task.status,
            owner_id=task.owner_id,
            created_at=task.created_at,
            updated_at=task.updated_at
        )
    
    def get_list(
        self, 
        owner_id: str, 
        cursor: Optional[str] = None, 
        limit: int = 20,
        filters: Optional[TaskFilter] = None
    ) -> Tuple[list[TaskResponse], Optional[str], bool]:
        """
        Get paginated tasks for a specific owner using cursor-based pagination.
        
        Args:
            owner_id: Owner's user ID
            cursor: Task ID to start after (for pagination)
            limit: Maximum number of tasks to return
            filters: Optional filter criteria
            
        Returns:
            Tuple of (tasks, next_cursor, has_more)
        """
        query = self.db.query(Task).filter(Task.owner_id == owner_id)
        
        # Apply filters if provided
        if filters:
            if filters.status is not None:
                query = query.filter(Task.status == filters.status)
            if filters.priority is not None:
                query = query.filter(Task.priority == filters.priority)
            if filters.created_after is not None:
                query = query.filter(Task.created_at >= filters.created_after)
            if filters.created_before is not None:
                query = query.filter(Task.created_at <= filters.created_before)
            if filters.updated_after is not None:
                query = query.filter(Task.updated_at >= filters.updated_after)
            if filters.updated_before is not None:
                query = query.filter(Task.updated_at <= filters.updated_before)
        
        # Order by ID (UUIDv7 is time-ordered, so this gives consistent ordering)
        query = query.order_by(Task.id)
        
        # Apply cursor if provided
        if cursor:
            query = query.filter(Task.id > cursor)
        
        # Limit results (add 1 to check if there are more)
        tasks = query.limit(limit + 1).all()
        
        # Check if there are more results
        has_more = len(tasks) > limit
        if has_more:
            tasks = tasks[:-1]  # Remove the extra item
        
        # Convert to response models
        task_responses = [
            TaskResponse(
                id=task.id,
                title=task.title,
                description=task.description,
                priority=task.priority,
                status=task.status,
                owner_id=task.owner_id,
                created_at=task.created_at,
                updated_at=task.updated_at
            )
            for task in tasks
        ]
        
        # Set next cursor to the last task's ID if there are more
        next_cursor = task_responses[-1].id if task_responses and has_more else None
        
        return task_responses, next_cursor, has_more

    def update(self, task_id: str, task_data: TaskUpdate, owner_id: str) -> TaskResponse | None:
        task = self.db.query(Task).filter(Task.id == task_id, Task.owner_id == owner_id).first()
        if not task:
            return None
        # update only provided fields

        if task_data.title is not None:
            task.title = task_data.title
        if task_data.description is not None:
            task.description = task_data.description
        if task_data.priority is not None:
            task.priority = task_data.priority
        if task_data.status is not None:
            task.status = task_data.status

        self.db.commit()
        self.db.refresh(task)
        return TaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            status=task.status,
            owner_id=task.owner_id,
            created_at=task.created_at,
            updated_at=task.updated_at
        )

    def delete(self, task_id: str, owner_id: str) -> bool:
        task = self.db.query(Task).filter(Task.id == task_id, Task.owner_id == owner_id).first()
        if not task:
            return False
        self.db.delete(task)
        self.db.commit()
        return True
