"""
User API endpoints.

Handles HTTP requests and responses for user operations.
Depends on UserServiceProtocol (abstraction), not concrete implementation.
"""

from fastapi import APIRouter, Depends, status
from typing import Annotated
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.users.repository import UserRepository
from app.modules.users.service import UserService
from app.modules.users.schemas import UserCreate, UserResponse, UserUpdate


router = APIRouter(prefix="/users", tags=["Users"])


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    """
    Dependency injection for UserService.
    
    Creates repository with database session and injects into service.
    
    Args:
        db: SQLAlchemy database session
    
    Returns:
        UserService instance
    """
    repository = UserRepository(db)
    return UserService(repository)


# Type alias for cleaner code
UserServiceDep = Annotated[UserService, Depends(get_user_service)]


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account with username, email, and password"
)
def create_user(
    user: UserCreate,
    service: UserServiceDep
) -> UserResponse:
    """
    Register a new user.
    
    Validation rules:
    - Username: 3-50 chars, alphanumeric + underscore only, must be unique
    - Email: Valid email format, must be unique
    - Password: Min 8 chars, must have uppercase, lowercase, and special character
    
    Returns:
        Created user (without password)
    """
    return service.register_user(user)


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user by ID",
    description="Retrieve a user by their unique identifier"
)
def get_user(
    user_id: str,
    service: UserServiceDep
) -> UserResponse:
    """
    Get user by ID.
    
    Args:
        user_id: User identifier (UUIDv7)
    
    Returns:
        User data (without password)
    
    Raises:
        404: User not found
    """
    return service.get_user(user_id)


@router.get(
    "/",
    response_model=list[UserResponse],
    summary="Get all users",
    description="Retrieve a list of all registered users"
)
def get_all_users(
    service: UserServiceDep
) -> list[UserResponse]:
    """
    Get all users.
    
    Returns:
        List of all users (without passwords)
    """
    return service.get_all_users()


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update user",
    description="Update user information (username, email, or password)"
)
def update_user(
    user_id: str,
    user_data: UserUpdate,
    service: UserServiceDep
) -> UserResponse:
    """
    Update user.
    
    All fields are optional - only provided fields will be updated.
    Same validation rules apply as creation.
    
    Args:
        user_id: User identifier
        user_data: Fields to update
    
    Returns:
        Updated user (without password)
    
    Raises:
        404: User not found
        400: Validation failed (duplicate username/email)
    """
    return service.update_user(user_id, user_data)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete user",
    description="Permanently delete a user account"
)
def delete_user(
    user_id: str,
    service: UserServiceDep
) -> None:
    """
    Delete user.
    
    Args:
        user_id: User identifier
    
    Raises:
        404: User not found
    """
    service.delete_user(user_id)
