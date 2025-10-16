"""
Global authentication interfaces and utilities.

Defines authentication protocols and utilities that can be used across all modules.
Does NOT import from app.modules to avoid circular dependencies.
"""

from typing import Protocol, runtime_checkable
import jwt
from fastapi import HTTPException, status

from app.config import settings


def verify_jwt_token(token: str) -> dict:
    """
    Verify and decode JWT token.
    
    This is a utility function that can be used by any module.
    Does not depend on any module-specific code.
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded token payload containing user information
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


@runtime_checkable
class AuthenticatedUser(Protocol):
    """
    Protocol for authenticated user objects.
    
    Any object that implements these attributes can be used as an authenticated user.
    This allows different modules to define their own user representations.
    """
    
    id: str
    username: str
    email: str
