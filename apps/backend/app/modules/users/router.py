"""
User API endpoints.

Handles HTTP requests and responses for user operations.
Depends on UserServiceProtocol (abstraction), not concrete implementation.
"""

from fastapi import APIRouter, Depends, status
from typing import Annotated

from app.modules.users.security import AuthUser, get_user_service
from app.modules.users.service import UserService
from app.modules.users.schemas import (
    UserCreate,
    UserResponse,
    UserUpdate,
    UserLoginRequest,
    UserTokenResponse
)


router = APIRouter(prefix="/users", tags=["Users"])


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

@router.post(
    "/auth/token",
    response_model=UserTokenResponse,
    summary="Get authentication token",
    description="Authenticate user and get JWT access and refresh tokens"
)
def get_user_token(
    login_data: UserLoginRequest,
    service: UserServiceDep
) -> UserTokenResponse:
    """
    Authenticate user and get JWT tokens.
    
    Args:
        login_data: User login credentials (username and password)
        service: User service dependency
    
    Returns:
        UserTokenResponse containing user_id, access_token, and refresh_token
    """
    return service.get_user_token(login_data.username, login_data.password)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get the authenticated user's profile information"
)
def get_current_user_profile(
    current_user: AuthUser
) -> UserResponse:
    """
    Get current authenticated user's profile.
    
    This is a protected route that requires a valid JWT token.
    
    Args:
        current_user: Current authenticated user (from JWT token)
    
    Returns:
        Current user's profile data
    
    Raises:
        401: If token is missing, invalid, or expired
    """
    return current_user


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
