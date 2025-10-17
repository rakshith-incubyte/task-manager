from fastapi import APIRouter, Depends, status
from typing import Annotated
from sqlalchemy.orm import Session

from app.modules.users.security import AuthUser
from app.core.database import get_db
from app.modules.tasks.interfaces import TaskServiceProtocol
from app.modules.tasks.repository import TaskRepository
from app.modules.tasks.service import TaskService
from app.modules.tasks.schemas import TaskCreate
from app.modules.tasks.schemas import TaskUpdate
from app.modules.tasks.schemas import TaskResponse
from app.modules.tasks.schemas import TaskPaginationRequest
from app.modules.tasks.schemas import TaskPaginationResponse

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
    current_user: AuthUser
) -> TaskResponse:
    """
    Create a new task for the authenticated user.
    
    This is a protected route - requires valid JWT token.
    """
    return task_service.create_task(task_data, current_user.id)


@router.get(
    "/",
    response_model=TaskPaginationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get paginated tasks",
    description="Get paginated tasks for the authenticated user using cursor-based pagination with optional filters"
)
def get_tasks(
    pagination: TaskPaginationRequest = Depends(),
    task_service: TaskServiceDep = None,
    current_user: AuthUser = None
) -> TaskPaginationResponse:
    """
    Get paginated tasks for the authenticated user.
    
    Uses cursor-based pagination for efficient large dataset handling.
    Tasks are ordered by creation time (UUIDv7 provides time-based ordering).
    
    Query Parameters:
    - cursor: Task ID to start after (optional)
    - limit: Number of tasks to return (1-100, default 20)
    - status: Filter by task status (optional)
    - priority: Filter by task priority (optional)
    - created_after: Filter tasks created after this datetime (optional)
    - created_before: Filter tasks created before this datetime (optional)
    - updated_after: Filter tasks updated after this datetime (optional)
    - updated_before: Filter tasks updated before this datetime (optional)
    
    This is a protected route - requires valid JWT token.
    """
    return task_service.get_list(
        owner_id=current_user.id,
        pagination_request=pagination
    )


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a task by ID",
    description="Get a specific task by ID (must be owned by the user)"
)
def get_task(
    task_id: str,
    task_service: TaskServiceDep,
    current_user: AuthUser
) -> TaskResponse:
    """
    Get a task by ID for the authenticated user.
    
    This is a protected route - requires valid JWT token.
    User can only access their own tasks.
    """
    return task_service.get_task(task_id, current_user.id)


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a task",
    description="Update a task by ID (must be owned by the user)"
)
def update_task(
    task_id: str,
    task_data: TaskUpdate,
    task_service: TaskServiceDep,
    current_user: AuthUser
) -> TaskResponse:
    """
    Update a task for the authenticated user.
    
    This is a protected route - requires valid JWT token.
    User can only update their own tasks.
    """
    return task_service.update_task(task_id, task_data, current_user.id)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a task",
    description="Delete a task by ID (must be owned by the user)"
)
def delete_task(
    task_id: str,
    task_service: TaskServiceDep,
    current_user: AuthUser
):
    """
    Delete a task for the authenticated user.
    
    This is a protected route - requires valid JWT token.
    User can only delete their own tasks.
    """
    task_service.delete_task(task_id, current_user.id)
    return None
