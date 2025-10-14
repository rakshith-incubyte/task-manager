"""
Module/Feature management - Django-style INSTALLED_APPS.

This module handles dynamic loading and registration of feature modules.
Following SOLID principles:
- SRP: Each function has one responsibility
- DIP: Depends on abstractions (LoggerProtocol), not concrete implementations
"""

from typing import List, Any
from fastapi import FastAPI, APIRouter

from app.core.interfaces import LoggerProtocol
from app.core.logger import default_logger


# List of installed modules (similar to Django's INSTALLED_APPS)
INSTALLED_MODULES = [
    "app.modules.health"
]


class ModuleLoader:
    """
    Handles loading and registration of modules.
    
    Why a class?
    - Encapsulates module loading logic
    - Can inject dependencies (logger)
    - Easy to test with mock logger
    - Single Responsibility: only loads modules
    
    This follows:
    - SRP: Only responsible for module loading
    - DIP: Depends on LoggerProtocol (abstraction)
    - OCP: Can extend without modifying
    """
    
    def __init__(self, logger: LoggerProtocol = default_logger):
        """
        Initialize module loader.
        
        Args:
            logger: Logger implementation (injected dependency)
        
        Why inject logger?
        - Dependency Inversion: we depend on interface, not concrete logger
        - Testability: tests can inject NullLogger or mock
        - Flexibility: can swap logging implementation
        """
        self.logger = logger
    
    def import_module(self, module_path: str) -> Any:
        """
        Import a module by its path.
        
        Single Responsibility: Only imports, doesn't register.
        
        Args:
            module_path: Dotted path to module (e.g., "app.modules.health")
        
        Returns:
            Imported module object
        
        Raises:
            ImportError: If module cannot be imported
        """
        return __import__(module_path, fromlist=["router"])
    
    def validate_module(self, module: Any, module_path: str) -> bool:
        """
        Validate that module has required router attribute.
        
        Single Responsibility: Only validates.
        
        Args:
            module: Module object to validate
            module_path: Module path (for logging)
        
        Returns:
            True if valid, False otherwise
        """
        if not hasattr(module, "router"):
            self.logger.warning(f"Module {module_path} has no router")
            return False
        
        if not isinstance(module.router, APIRouter):
            self.logger.warning(
                f"Module {module_path} router is not an APIRouter instance"
            )
            return False
        
        return True
    
    def register_module(
        self, 
        app: FastAPI, 
        module_path: str
    ) -> bool:
        """
        Register a single module with the FastAPI app.
        
        Single Responsibility: Coordinates import, validate, register.
        
        Args:
            app: FastAPI application instance
            module_path: Path to module to register
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Step 1: Import
            module = self.import_module(module_path)
            
            # Step 2: Validate
            if not self.validate_module(module, module_path):
                return False
            
            # Step 3: Register
            app.include_router(module.router)
            self.logger.info(f"Registered module: {module_path}")
            return True
            
        except ImportError as e:
            self.logger.error(f"Failed to import module {module_path}: {e}")
            return False
        except Exception as e:
            self.logger.error(f"Error registering module {module_path}: {e}")
            return False
    
    def register_all(self, app: FastAPI, module_paths: List[str]) -> None:
        """
        Register all modules from a list.
        
        Args:
            app: FastAPI application instance
            module_paths: List of module paths to register
        """
        for module_path in module_paths:
            self.register_module(app, module_path)


def register_modules(
    app: FastAPI, 
    logger: LoggerProtocol = default_logger
) -> None:
    """
    Convenience function to register all installed modules.
    
    This is the public API - keeps backward compatibility.
    
    Args:
        app: FastAPI application instance
        logger: Logger implementation (dependency injection)
    
    Why keep this function?
    - Simple API for users
    - Backward compatible
    - Hides ModuleLoader complexity
    """
    loader = ModuleLoader(logger=logger)
    loader.register_all(app, INSTALLED_MODULES)
