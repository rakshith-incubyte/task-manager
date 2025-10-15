"""
Module/Feature management - Django-style INSTALLED_APPS.
"""

from typing import List, Any, Union
from fastapi import FastAPI, APIRouter

from app.core.interfaces import LoggerProtocol, ModuleProtocol
from app.core.logger import default_logger
from app.config import INSTALLED_MODULES


class ModuleLoader:
    """
    Handles loading and registration of modules.
    """
    
    def __init__(self, logger: LoggerProtocol = default_logger):
        """
        Initialize module loader.
        
        Args:
            logger: Logger implementation (injected dependency)
        """
        self.logger = logger
    
    def import_module(self, module_path: str) -> Any:
        """
        Import a module by its path.
        
        Args:
            module_path: Dotted path to module (e.g., "app.modules.health")
        
        Returns:
            Imported module object
        
        Raises:
            ImportError: If module cannot be imported
        """
        return __import__(module_path, fromlist=["router"])
    
    def check_protocol_compliance(self, module: Union[ModuleProtocol, Any]) -> bool:
        """
        Check if module conforms to ModuleProtocol.
        
        This is a runtime check for protocol compliance.
        ModuleProtocol requires: router attribute of type APIRouter
        
        Args:
            module: Module to check (should implement ModuleProtocol)
        
        Returns:
            True if module follows ModuleProtocol, False otherwise
        
        Note:
            Type hint is Union[ModuleProtocol, Any] because we're validating
            unknown modules at runtime. If it passes, it's a ModuleProtocol.
        """
        return (
            hasattr(module, "router") and 
            isinstance(module.router, APIRouter)
        )
    
    def validate_module(self, module: Any, module_path: str) -> bool:
        """
        Validate that module follows ModuleProtocol.
        Args:
            module: Module object to validate
            module_path: Module path (for logging)
        
        Returns:
            True if valid, False otherwise
        """
        # Use protocol compliance check
        if not self.check_protocol_compliance(module):
            # Provide detailed error message
            if not hasattr(module, "router"):
                self.logger.warning(
                    f"Module {module_path} does not follow ModuleProtocol: "
                    f"missing 'router' attribute"
                )
            else:
                self.logger.warning(
                    f"Module {module_path} does not follow ModuleProtocol: "
                    f"'router' must be an APIRouter instance, got {type(module.router).__name__}"
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
    Utility function to register all installed modules.
    
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
