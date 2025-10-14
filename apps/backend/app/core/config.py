"""
Application configuration settings.

This follows the Dependency Inversion Principle:
- Configuration is abstracted into a class
- Can be easily mocked/overridden in tests
- All settings in one place (Single Responsibility)
"""

from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings.
    
    Why use Pydantic BaseSettings?
    - Type validation (catches config errors early)
    - Environment variable support (.env files)
    - Default values with type hints
    - Easy to test (can create Settings with custom values)
    
    This follows:
    - SRP: Only handles configuration
    - DIP: Other code depends on this abstraction
    """
    
    # Application metadata
    app_name: str = "Task Manager API"
    app_description: str = "A task management API built with FastAPI"
    app_version: str = "0.1.0"
    debug: bool = False
    
    # CORS Configuration
    # Why configurable?
    # - Production needs restricted origins
    # - Development needs permissive settings
    # - Can be changed without code changes
    cors_origins: List[str] = ["*"]
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["*"]
    cors_allow_headers: List[str] = ["*"]
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
    }


# Global settings instance
# Why a global?
# - Convenience: easy to import
# - Singleton pattern: one source of truth
# - Can still be overridden in tests
settings = Settings()
