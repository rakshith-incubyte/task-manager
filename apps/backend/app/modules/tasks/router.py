from fastapi import APIRouter, Depends, Header, status
from typing import Annotated
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.tasks.interfaces import TaskServiceProtocol
from app.modules.tasks.repository import TaskRepository
from app.modules.tasks.service import TaskService
from app.modules.tasks.schemas import TaskCreate
from app.modules.tasks.schemas import TaskUpdate
from app.modules.tasks.schemas import TaskResponse

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def get_task_service(db: Session = Depends(get_db)) -> TaskServiceProtocol:
    repository = TaskRepository(db)
    return TaskService(repository)

TaskServiceDep = Annotated[TaskServiceProtocol, Depends(get_task_service)]


@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
    description="Create a new task with title, description, priority, and status"
)
def create_task(
    task_data: TaskCreate,
    task_service: TaskServiceDep,
    owner: str = Header(...)
) -> TaskResponse:
    return task_service.create_task(task_data, owner)


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a task by ID",
    description="Get a task by ID"
)
def get_task(
    task_id: str,
    task_service: TaskServiceDep,
) -> TaskResponse:
    return task_service.get_task(task_id)

@router.get(
    "/",
    response_model=list[TaskResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all tasks",
    description="Get all tasks"
)
def get_all_tasks(
    task_service: TaskServiceDep,
) -> list[TaskResponse]:
    return task_service.get_all_tasks()

@router.put(
    "/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a task",
    description="Update a task by ID"
)
def update_task(
    task_id: str,
    task_data: TaskUpdate,
    task_service: TaskServiceDep,
    owner: str = Header(...)
) -> TaskResponse:
    return task_service.update_task(task_id, task_data, owner)

@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a task",
    description="Delete a task by ID"
)
def delete_task(
    task_id: str,
    task_service: TaskServiceDep,
):
    task_service.delete_task(task_id)
    return None
