"""
Task repository - SQLAlchemy ORM data access layer.
"""

from sqlalchemy.orm import Session
from app.modules.tasks.interfaces import TaskRepositoryProtocol
from app.modules.tasks.schemas import TaskCreate
from app.modules.tasks.schemas import TaskResponse
from app.modules.tasks.schemas import TaskUpdate
from app.modules.tasks.models import Task

class TaskRepository:
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, task_id: str, task_data: TaskCreate, owner_id: str) -> TaskResponse:
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
    
    def get_by_id(self, task_id: str) -> TaskResponse | None:
        task = self.db.query(Task).filter(Task.id == task_id).first()
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
    
    def get_all(self) -> list[TaskResponse]:
        tasks = self.db.query(Task).all()
        return [
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

    def update(self, task_id: str, task_data: TaskUpdate, owner_id: str) -> TaskResponse | None:
        task = self.db.query(Task).filter(Task.id == task_id).first()
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

    def delete(self, task_id: str) -> bool:
        task = self.db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return False
        self.db.delete(task)
        self.db.commit()
        return True

    



