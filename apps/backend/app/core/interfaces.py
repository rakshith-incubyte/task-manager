"""
Interfaces and protocols for the application.

This file defines the contracts (interfaces) that components must follow.
This enforces the Liskov Substitution Principle (LSP) - any module implementing
ModuleProtocol can be used interchangeably.
"""

from typing import Protocol
from fastapi import APIRouter


class ModuleProtocol(Protocol):
    """
    Protocol defining the interface for a module.
    
    Any module must have a 'router' attribute of type APIRouter.
    This is Python's way of defining an interface without inheritance.
    
    Why Protocol?
    - Enforces a contract without tight coupling
    - Allows static type checking (mypy, pyright)
    - Documents what a module must provide
    """
    router: APIRouter


class LoggerProtocol(Protocol):
    """
    Protocol for logging operations.
    
    This abstracts away the concrete logging implementation.
    We can swap print() for proper logging without changing code.
    
    Why?
    - Dependency Inversion: depend on abstraction, not concrete print()
    - Testability: can inject mock logger in tests
    - Flexibility: can switch to file logging, cloud logging, etc.
    """
    
    def info(self, message: str) -> None:
        """Log an info message."""
        ...
    
    def warning(self, message: str) -> None:
        """Log a warning message."""
        ...
    
    def error(self, message: str) -> None:
        """Log an error message."""
        ...
