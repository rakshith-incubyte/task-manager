from typing import List
from pathlib import Path
from pydantic_settings import BaseSettings

# Get the backend directory (parent of app directory)
BASE_DIR = Path(__file__).resolve().parent.parent


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
    # Note: When allow_credentials=True, origins cannot be ["*"]
    cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["*"]
    cors_allow_headers: List[str] = ["*"]
    
    # Database Configuration (SQLAlchemy + PostgreSQL)
    database_url: str = "postgresql://postgres:postgres@localhost:5432/taskmanager"
    database_echo: bool = False  # Set to True to log SQL queries
    
    model_config = {
        "env_file": str(BASE_DIR / ".env"),
        "case_sensitive": False,
    }
    
    # JWT Configuration
    secret_key: str = "dev-secret-key-change-in-production"  # Override via SECRET_KEY env var
    algorithm: str = "HS256"
    access_token_expires_in: int = 30  # minutes
    refresh_token_expires_in: int = 60  # minutes


# Installed modules (Django-style INSTALLED_APPS)
# Add new modules here to register them automatically
INSTALLED_MODULES = [
    "app.modules.health",
    "app.modules.users",
    "app.modules.tasks"
]


# Global settings instance
settings = Settings()
