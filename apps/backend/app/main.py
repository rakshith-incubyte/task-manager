"""
FastAPI application entry point.

This module follows strict SOLID principles:
- SRP: create_app only creates and configures the app
- OCP: Can extend via modules without modifying this file
- LSP: All modules follow ModuleProtocol
- ISP: Dependencies are minimal and focused
- DIP: Depends on abstractions (Settings, LoggerProtocol), not concrete implementations
"""

from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import Settings, settings as default_settings
from app.core.modules import register_modules
from app.core.interfaces import LoggerProtocol
from app.core.logger import default_logger


def configure_cors(app: FastAPI, config: Settings) -> None:
    """
    Configure CORS middleware for the application.
    
    Single Responsibility: Only handles CORS configuration.
    
    Why separate function?
    - SRP: Separates CORS config from app creation
    - Testability: Can test CORS config independently
    - Reusability: Can be called from different contexts
    
    Args:
        app: FastAPI application instance
        config: Settings object with CORS configuration
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.cors_origins,
        allow_credentials=config.cors_allow_credentials,
        allow_methods=config.cors_allow_methods,
        allow_headers=config.cors_allow_headers,
    )


def create_app(
    config: Optional[Settings] = None,
    logger: Optional[LoggerProtocol] = None,
) -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    This is the Application Factory Pattern with Dependency Injection.
    
    Why dependency injection?
    - DIP: Depends on abstractions (Settings, LoggerProtocol)
    - Testability: Tests can inject mock config and logger
    - Flexibility: Can create multiple app instances with different configs
    - No global state: Everything is explicit
    
    Args:
        config: Settings instance (injected). Defaults to global settings.
        logger: Logger instance (injected). Defaults to console logger.
    
    Returns:
        Configured FastAPI application instance
    
    Example:
        # Production
        app = create_app()
        
        # Testing with custom config
        test_config = Settings(debug=True, cors_origins=["http://localhost:3000"])
        test_app = create_app(config=test_config, logger=NullLogger())
    """
    # Use defaults if not provided (Dependency Injection with defaults)
    config = config or default_settings
    logger = logger or default_logger
    
    # Create FastAPI instance
    # Why from config? So tests can override
    application = FastAPI(
        title=config.app_name,
        description=config.app_description,
        version=config.app_version,
        debug=config.debug,
    )
    
    # Configure CORS middleware
    # Why separate function? Single Responsibility
    configure_cors(application, config)
    
    # Register all installed modules (Django-style)
    # Why inject logger? Dependency Inversion
    register_modules(application, logger=logger)
    
    return application


# Global app instance for production use
# Why keep this? Backward compatibility and convenience
app = create_app()
