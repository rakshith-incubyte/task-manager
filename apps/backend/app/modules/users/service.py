"""
User service - business logic layer.

Handles all business rules for user operations.
Depends on UserRepositoryProtocol (abstraction), not concrete implementation.
"""

import uuid
from datetime import timedelta

from fastapi import HTTPException, status
import jwt

from app.config import settings
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserResponse, UserUpdate, UserTokenResponse

# Import password context and token functions from security module
from app.modules.users.security import pwd_context, create_access_token, create_refresh_token


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
    
    def __init__(self, repository: UserRepository):
        """
        Initialize service with repository.
        
        Args:
            repository: User repository instance
        """
        self.repository = repository
    
    def _hash_password(self, password: str) -> str:
        """
        Hash password using Argon2.
        
        Args:
            password: Plain text password
        
        Returns:
            Hashed password
        """
        return pwd_context.hash(password)
    
    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verify a plain password against a hashed password using Argon2.
        
        Args:
            plain_password: Plain text password to verify
            hashed_password: Hashed password to compare against
        
        Returns:
            True if password matches, False otherwise
        """
        return pwd_context.verify(plain_password, hashed_password)
    
    def _generate_user_id(self) -> str:
        """
        Generate UUIDv7 for user.
        
        UUIDv7 is time-ordered, making it better for databases.
        
        Returns:
            UUIDv7 as string
        """
        return str(uuid.uuid7())

    
    def _validate_user_uniqueness(self, username: str | None, email: str | None, exclude_user_id: str | None = None) -> None:
        """
        Validate that username and email are unique.
        
        Args:
            username: Username to check (optional)
            email: Email to check (optional) 
            exclude_user_id: User ID to exclude from uniqueness check (for updates)
            
        Raises:
            HTTPException: If username or email already exists
        """
        # Check username uniqueness
        if username:
            existing_user = self.repository.get_by_username(username)
            if existing_user and existing_user.id != exclude_user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Username '{username}' is already taken"
                )
        
        # Check email uniqueness
        if email:
            existing_email = self.repository.get_by_email(email)
            if existing_email and existing_email.id != exclude_user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Email '{email}' is already registered"
                )
    
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
        # Check username and email uniqueness
        self._validate_user_uniqueness(user_data.username, user_data.email)
        
        # Hash password
        hashed_password = self._hash_password(user_data.password)
        
        # Generate ID
        user_id = self._generate_user_id()
        
        # Delegate to repository
        return self.repository.create(user_id, user_data, hashed_password)

    def get_user_token(self, username: str, password: str) -> UserTokenResponse:
        """
        Authenticate user and generate JWT tokens.
        
        Business rules:
        1. User must exist
        2. Password must match
        3. Generate both access and refresh tokens
        
        Args:
            username: User's username
            password: Plain text password
        
        Returns:
            UserTokenResponse with user_id, access_token, and refresh_token
        
        Raises:
            HTTPException: If authentication fails
        """
        # Get user by username (includes password for verification)
        user = self.repository.get_by_username(username)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        # Verify password
        if not self._verify_password(password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        # Generate tokens
        access_token_expires = timedelta(minutes=settings.access_token_expires_in)
        refresh_token_expires = timedelta(minutes=settings.refresh_token_expires_in)
        
        access_token = create_access_token(user.id, access_token_expires)
        refresh_token = create_refresh_token(user.id, refresh_token_expires)
        
        # Return structured response
        return UserTokenResponse(
            user_id=user.id,
            access_token=access_token,
            refresh_token=refresh_token
        )
    
    def refresh_access_token(self, refresh_token: str) -> UserTokenResponse:
        """
        Generate new access token using refresh token.
        
        Business rules:
        1. Refresh token must be valid
        2. User must still exist
        3. Generate new access and refresh tokens
        
        Args:
            refresh_token: Valid refresh token
        
        Returns:
            UserTokenResponse with new access_token and refresh_token
        
        Raises:
            HTTPException: If refresh token is invalid or expired
        """
        try:
            # Decode refresh token
            payload = jwt.decode(
                refresh_token,
                settings.secret_key,
                algorithms=[settings.algorithm]
            )
            user_id: str = payload.get("sub")
            
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid refresh token"
                )
            
            # Verify user still exists
            user = self.repository.get_by_id(user_id)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )
            
            # Generate new tokens
            access_token_expires = timedelta(minutes=settings.access_token_expires_in)
            refresh_token_expires = timedelta(minutes=settings.refresh_token_expires_in)
            
            new_access_token = create_access_token(user.id, access_token_expires)
            new_refresh_token = create_refresh_token(user.id, refresh_token_expires)
            
            return UserTokenResponse(
                user_id=user.id,
                access_token=new_access_token,
                refresh_token=new_refresh_token
            )
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired"
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
    

    def update_current_user(self, user_data: UserUpdate, current_user_id: str) -> UserResponse:
        """
        Update current user profile.
        
        Business rules:
        1. New username must be unique (if changing)
        2. New email must be unique (if changing)
        3. Password must be hashed (if changing)
        
        Args:
            user_data: Update data
            current_user_id: Current authenticated user ID
        
        Returns:
            Updated user
        
        Raises:
            HTTPException: If validation fails
        """
        # Get current user (we know they exist since they're authenticated)
        existing = self.repository.get_by_id(current_user_id)
        
        # Business rule: Check username uniqueness (if changing)
        if user_data.username and user_data.username != existing.username:
            self._validate_user_uniqueness(user_data.username, None, current_user_id)
        
        # Business rule: Check email uniqueness (if changing)
        if user_data.email and user_data.email != existing.email:
            self._validate_user_uniqueness(None, user_data.email, current_user_id)
        
        # Business logic: Hash password if provided
        hashed_password = None
        if user_data.password:
            hashed_password = self._hash_password(user_data.password)
        
        # Delegate to repository
        updated_user = self.repository.update(current_user_id, user_data, hashed_password)
        
        return updated_user

    def get_by_id(self, user_id: str) -> UserResponse | None:
        """
        Get user by ID.
        """
        return self.repository.get_by_id(user_id)
