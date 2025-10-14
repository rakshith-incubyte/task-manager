"""
User service - business logic layer.

Handles all business rules for user operations.
Depends on UserRepositoryProtocol (abstraction), not concrete implementation.
"""

import uuid
import bcrypt
from fastapi import HTTPException, status

from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserResponse, UserUpdate


class UserService:
    """
    User business logic layer.
    
    Responsibilities:
    - Business rules (uniqueness checks, validation)
    - Password hashing
    - ID generation
    - Orchestrating repository calls
    
    Does NOT handle:
    - HTTP concerns (that's in router)
    - Database operations (that's in repository)
    """
    
    def __init__(self, db_factory):
        """
        Initialize service with database factory.
        
        Args:
            db_factory: Factory function to create persistence instances
        """
        self.repository = UserRepository(db_factory)
    
    def _hash_password(self, password: str) -> str:
        """
        Hash password using bcrypt.
        
        Args:
            password: Plain text password
        
        Returns:
            Hashed password
        """
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def _generate_user_id(self) -> str:
        """
        Generate UUIDv7 for user.
        
        UUIDv7 is time-ordered, making it better for databases.
        
        Returns:
            UUIDv7 as string
        """
        return str(uuid.uuid7())
    
    def register_user(self, user_data: UserCreate) -> UserResponse:
        """
        Register a new user.
        
        Business rules:
        1. Username must be unique
        2. Email must be unique
        3. Password must be hashed
        4. ID must be generated
        
        Args:
            user_data: User registration data (validated by Pydantic)
        
        Returns:
            Created user (without password)
        
        Raises:
            HTTPException: If username or email already exists
        """
        # Check username uniqueness
        existing_user = self.repository.get_by_username(user_data.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username '{user_data.username}' is already taken"
            )
        
        # Check email uniqueness
        existing_email = self.repository.get_by_email(user_data.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{user_data.email}' is already registered"
            )
        
        # Hash password
        hashed_password = self._hash_password(user_data.password)
        
        # Generate ID
        user_id = self._generate_user_id()
        
        # Delegate to repository
        return self.repository.create(user_id, user_data, hashed_password)
    
    def get_user(self, user_id: str) -> UserResponse:
        """
        Get user by ID.
        
        Args:
            user_id: User identifier
        
        Returns:
            User data
        
        Raises:
            HTTPException: If user not found
        """
        user = self.repository.get_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID '{user_id}' not found"
            )
        
        return user
    
    def get_all_users(self) -> list[UserResponse]:
        """
        Get all users.
        
        Returns:
            List of all users
        """
        return self.repository.get_all()
    
    def update_user(self, user_id: str, user_data: UserUpdate) -> UserResponse:
        """
        Update user.
        
        Business rules:
        1. User must exist
        2. New username must be unique (if changing)
        3. New email must be unique (if changing)
        4. Password must be hashed (if changing)
        
        Args:
            user_id: User identifier
            user_data: Update data
        
        Returns:
            Updated user
        
        Raises:
            HTTPException: If user not found or validation fails
        """
        # Check if user exists
        existing = self.repository.get_by_id(user_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID '{user_id}' not found"
            )
        
        # Business rule: Check username uniqueness (if changing)
        if user_data.username and user_data.username != existing.username:
            existing_username = self.repository.get_by_username(user_data.username)
            if existing_username:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Username '{user_data.username}' is already taken"
                )
        
        # Business rule: Check email uniqueness (if changing)
        if user_data.email and user_data.email != existing.email:
            existing_email = self.repository.get_by_email(user_data.email)
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Email '{user_data.email}' is already registered"
                )
        
        # Business logic: Hash password if provided
        hashed_password = None
        if user_data.password:
            hashed_password = self._hash_password(user_data.password)
        
        # Delegate to repository
        updated_user = self.repository.update(user_id, user_data, hashed_password)
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID '{user_id}' not found"
            )
        
        return updated_user
    
    def delete_user(self, user_id: str) -> bool:
        """
        Delete user.
        
        Args:
            user_id: User identifier
        
        Returns:
            True if deleted
        
        Raises:
            HTTPException: If user not found
        """
        deleted = self.repository.delete(user_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID '{user_id}' not found"
            )
        
        return True
