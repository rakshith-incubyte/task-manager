"""
Global authentication interfaces and utilities.

Defines authentication protocols and utilities that can be used across all modules.
Does NOT import from app.modules to avoid circular dependencies.
"""

from typing import Protocol, runtime_checkable

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
