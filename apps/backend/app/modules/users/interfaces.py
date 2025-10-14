"""
User module interfaces (Protocols).

Defines contracts for UserRepository and UserService.
Following Dependency Inversion Principle - depend on abstractions, not implementations.
"""

from typing import Protocol
from app.modules.users.schemas import UserCreate, UserResponse, UserUpdate


class UserRepositoryProtocol(Protocol):
    """
    Interface for user data access layer.
    """
    
    def create(self, user_id: str, user_data: UserCreate, hashed_password: str) -> UserResponse:
        """Create a new user in persistence layer."""
        ...
    
    def get_by_id(self, user_id: str) -> UserResponse | None:
        """Get user by ID."""
        ...
    
    def get_by_username(self, username: str) -> dict | None:
        """Get user by username (returns raw dict for existence check)."""
        ...
    
    def get_by_email(self, email: str) -> dict | None:
        """Get user by email (returns raw dict for existence check)."""
        ...
    
    def get_all(self) -> list[UserResponse]:
        """Get all users."""
        ...
    
    def update(self, user_id: str, user_data: UserUpdate, hashed_password: str | None) -> UserResponse | None:
        """Update a user."""
        ...
    
    def delete(self, user_id: str) -> bool:
        """Delete a user."""
        ...


class UserServiceProtocol(Protocol):
    """
    Interface for user business logic layer.
    """
    
    def register_user(self, user_data: UserCreate) -> UserResponse:
        """
        Register a new user.
        
        Business logic:
        - Check username uniqueness
        - Check email uniqueness
        - Hash password
        - Generate UUIDv7
        """
        ...
    
    def get_user(self, user_id: str) -> UserResponse | None:
        """Get user by ID."""
        ...
    
    def get_all_users(self) -> list[UserResponse]:
        """Get all users."""
        ...
    
    def update_user(self, user_id: str, user_data: UserUpdate) -> UserResponse | None:
        """
        Update user.
        
        Business logic:
        - Check username uniqueness (if changing)
        - Check email uniqueness (if changing)
        - Hash password (if changing)
        """
        ...
    
    def delete_user(self, user_id: str) -> bool:
        """Delete user."""
        ...
