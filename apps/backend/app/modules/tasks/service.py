import uuid
from fastapi import HTTPException

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
    
    def get_task(self, task_id: str) -> TaskResponse | None:
        if not task_id:
            raise HTTPException(status_code=400, detail="Task ID is required")
        
        task = self.repository.get_by_id(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task
    
    def get_all_tasks(self) -> list[TaskResponse]:
        return self.repository.get_all()
    
    def update_task(self, task_id: str, task_data: TaskUpdate, owner_id: str) -> TaskResponse | None:
        if not task_id:
            raise HTTPException(status_code=400, detail="Task ID is required")
        
        task = self.repository.get_by_id(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return self.repository.update(task_id, task_data, owner_id)
    
    def delete_task(self, task_id: str) -> bool:
        if not task_id:
            raise HTTPException(status_code=400, detail="Task ID is required")
        
        task = self.repository.get_by_id(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return self.repository.delete(task_id)
