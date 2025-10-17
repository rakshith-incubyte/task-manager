"""
User security and authentication.

Implements JWT authentication following the Medium article pattern.
Uses HTTPBearer for token authentication.
"""

from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING, Annotated, Any, Union

import jwt
from fastapi import Depends, HTTPException, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.core.database import get_db
from app.modules.users.jwt import jwt_bearer, decodeJWT

if TYPE_CHECKING:
    from app.modules.users.schemas import UserResponse


# Password hashing context
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def get_user_service(db: Session = Depends(get_db)):
    """
    Dependency injection for UserService.

    Creates repository with database session and injects into service.

    Args:
        db: SQLAlchemy database session

    Returns:
        UserService instance
    """
    from app.modules.users.repository import UserRepository
    from app.modules.users.service import UserService
    
    repository = UserRepository(db)
    return UserService(repository)


def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    """
    Create JWT access token.

    Args:
        subject: Subject (user ID) to encode in token
        expires_delta: Token expiration time

    Returns:
        JWT access token string
    """
    if expires_delta is not None:
        expires_delta = datetime.now(timezone.utc) + expires_delta
    else:
        expires_delta = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expires_in)
    
    to_encode = {"exp": expires_delta, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, settings.algorithm)
    return encoded_jwt


def create_refresh_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    """
    Create JWT refresh token.

    Args:
        subject: Subject (user ID) to encode in token
        expires_delta: Token expiration time

    Returns:
        JWT refresh token string
    """
    if expires_delta is not None:
        expires_delta = datetime.now(timezone.utc) + expires_delta
    else:
        expires_delta = datetime.now(timezone.utc) + timedelta(minutes=settings.refresh_token_expires_in)
    
    to_encode = {"exp": expires_delta, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, settings.algorithm)
    return encoded_jwt


def get_current_user(
    token: str = Depends(jwt_bearer),
    service = Depends(get_user_service)
):
    """
    Get current authenticated user from JWT token.

    Args:
        token: JWT token from JWTBearer
        service: User service dependency

    Returns:
        Current authenticated user

    Raises:
        HTTPException: If user not found
    """
    # Decode token using jwt_bearer's method
    payload = decodeJWT(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    # Get user ID from payload
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    # Get user from database
    user = service.get_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    return user


# Type alias for protected routes - import this in any module
AuthUser = Annotated["UserResponse", Depends(get_current_user)]
