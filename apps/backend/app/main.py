
from typing import Optional, Callable
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings, settings as default_settings
from app.core.modules import register_modules
from app.core.interfaces import LoggerProtocol
from app.core.logger import default_logger
from app.core.persistence import PersistenceProtocol
import importlib


def configure_cors(app: FastAPI, config: Settings) -> None:
    """
    Configure CORS middleware for the application.
    
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
    application = FastAPI(
        title=config.app_name,
        description=config.app_description,
        version=config.app_version,
        debug=config.debug,
    )
    
    # Initialize database factory (application state)
    # Dynamically load persistence class from config
    # To swap to PostgreSQL: just change config.persistence_class = "PostgreSQLPersistence"
    
    # Import the persistence class dynamically
    persistence_module = importlib.import_module("app.core.persistence")
    persistence_class = getattr(persistence_module, config.persistence_class)
    
    def create_persistence(collection: str) -> PersistenceProtocol:
        """
        Generic factory function to create persistence instances.
        
        Uses the persistence class specified in config.
        To switch databases, just change config.persistence_class!
        """
        return persistence_class.create_instance(config.database_path, collection)
    
    application.state.create_db = create_persistence
    
    configure_cors(application, config)
    register_modules(application, logger=logger)
    
    return application

app = create_app()
