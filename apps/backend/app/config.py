from typing import List, Type
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings.
    
    Centralized configuration for the entire application.
    """
    
    # Application metadata
    app_name: str = "Task Manager API"
    app_description: str = "A task management API built with FastAPI"
    app_version: str = "0.1.0"
    debug: bool = False
    
    # CORS Configuration
    cors_origins: List[str] = ["*"]
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["*"]
    cors_allow_headers: List[str] = ["*"]
    
    # Database Configuration (SQLAlchemy + PostgreSQL)
    database_url: str = "postgresql://postgres:postgres@localhost:5432/taskmanager"
    database_echo: bool = False  # Set to True to log SQL queries
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
    }


# Installed modules (Django-style INSTALLED_APPS)
# Add new modules here to register them automatically
INSTALLED_MODULES = [
    "app.modules.health",
    "app.modules.users",
    "app.modules.tasks"
]


# Global settings instance
settings = Settings()
