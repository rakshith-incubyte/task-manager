"""
Core background task processor.

This module provides a generic background task processing framework
that can be used across all modules.
"""

from typing import Callable, Any
from functools import wraps


class BackgroundProcessor:
    """Generic background task processor."""

    @staticmethod
    def execute_task(
        task_func: Callable,
        *args,
        **kwargs
    ) -> None:
        """
        Execute a task in background with error handling.
        
        Args:
            task_func: Function to execute
            *args: Positional arguments for the function
            **kwargs: Keyword arguments for the function
        """
        try:
            # Execute the task
            result = task_func(*args, **kwargs)
            
            # Log success
            print(f"Background task '{task_func.__name__}' completed successfully")
            
            return result
            
        except Exception as e:
            # Log error
            print(f"Background task '{task_func.__name__}' failed: {str(e)}")
            raise

    @staticmethod
    def with_error_handling(task_func: Callable) -> Callable:
        """
        Decorator to add error handling to background tasks.
        
        Args:
            task_func: Function to wrap
            
        Returns:
            Wrapped function with error handling
        """
        @wraps(task_func)
        def wrapper(*args, **kwargs) -> Any:
            try:
                result = task_func(*args, **kwargs)
                print(f"Background task '{task_func.__name__}' completed successfully")
                return result
            except Exception as e:
                print(f"Background task '{task_func.__name__}' failed: {str(e)}")
                raise
        
        return wrapper
