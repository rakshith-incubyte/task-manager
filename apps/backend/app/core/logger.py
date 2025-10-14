"""
Logging implementations.

This provides concrete implementations of LoggerProtocol.
Following Dependency Inversion Principle (DIP):
- High-level code depends on LoggerProtocol (abstraction)
- This file provides low-level implementation
"""

import logging
from typing import Optional


class ConsoleLogger:
    """
    Simple console logger implementation.
    
    This implements LoggerProtocol (implicitly - Python uses structural typing).
    We can easily swap this with FileLogger, CloudLogger, etc.
    
    Why not just use print()?
    - print() is hardcoded and can't be configured
    - This logger can be easily mocked in tests
    - Can add log levels, formatting, timestamps
    - Can redirect to files, cloud services, etc.
    """
    
    def __init__(self, name: str = "app", level: int = logging.INFO):
        """
        Initialize the logger.
        
        Args:
            name: Logger name (useful for filtering)
            level: Logging level (DEBUG, INFO, WARNING, ERROR)
        """
        self.logger = logging.getLogger(name)
        self.logger.setLevel(level)
        
        # Only add handler if not already present
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(levelname)s: %(message)s'
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
    
    def info(self, message: str) -> None:
        """Log info message with ✓ prefix."""
        self.logger.info(f"✓ {message}")
    
    def warning(self, message: str) -> None:
        """Log warning message with ⚠ prefix."""
        self.logger.warning(f"⚠ {message}")
    
    def error(self, message: str) -> None:
        """Log error message with ✗ prefix."""
        self.logger.error(f"✗ {message}")


class NullLogger:
    """
    Null Object Pattern implementation for logger.
    
    This logger does nothing - useful for tests where we don't want output.
    
    Why?
    - Tests can inject this to silence logs
    - No need for if/else checks for None
    - Follows Null Object Pattern
    """
    
    def info(self, message: str) -> None:
        """Do nothing."""
        pass
    
    def warning(self, message: str) -> None:
        """Do nothing."""
        pass
    
    def error(self, message: str) -> None:
        """Do nothing."""
        pass


# Default logger instance
default_logger = ConsoleLogger()
