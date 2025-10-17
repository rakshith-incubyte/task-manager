"""
Tests for ModuleLoader class.

These tests ensure 100% coverage of modules.py, including all error paths.
"""

from unittest.mock import Mock, patch
from fastapi import FastAPI, APIRouter

from app.core.modules import ModuleLoader, register_modules, INSTALLED_MODULES
from app.core.logger import NullLogger


# UNIT TESTS
# ==========

def test_module_loader_initialization():
    """Test ModuleLoader can be initialized with custom logger."""
    custom_logger = NullLogger()
    loader = ModuleLoader(logger=custom_logger)
    assert loader.logger == custom_logger


def test_module_loader_import_module_success():
    """Test successful module import."""
    loader = ModuleLoader(logger=NullLogger())
    module = loader.import_module("app.modules.health")
    assert hasattr(module, "router")


def test_module_loader_check_protocol_compliance_success():
    """Test protocol compliance check with valid module."""
    loader = ModuleLoader(logger=NullLogger())
    
    mock_module = Mock()
    mock_module.router = APIRouter()
    
    result = loader.check_protocol_compliance(mock_module)
    assert result is True


def test_module_loader_check_protocol_compliance_no_router():
    """Test protocol compliance check fails when module has no router."""
    loader = ModuleLoader(logger=NullLogger())
    
    mock_module = Mock(spec=[])  # No attributes
    
    result = loader.check_protocol_compliance(mock_module)
    assert result is False


def test_module_loader_check_protocol_compliance_wrong_type():
    """Test protocol compliance check fails when router is wrong type."""
    loader = ModuleLoader(logger=NullLogger())
    
    mock_module = Mock()
    mock_module.router = "not_a_router"
    
    result = loader.check_protocol_compliance(mock_module)
    assert result is False


def test_module_loader_validate_module_success():
    """Test validation of valid module."""
    loader = ModuleLoader(logger=NullLogger())
    
    mock_module = Mock()
    mock_module.router = APIRouter()
    
    result = loader.validate_module(mock_module, "test.module")
    assert result is True


def test_module_loader_validate_module_no_router():
    """Test validation fails when module has no router."""
    loader = ModuleLoader(logger=NullLogger())
    
    mock_module = Mock(spec=[])  # No attributes
    
    result = loader.validate_module(mock_module, "test.module")
    assert result is False


def test_module_loader_validate_module_wrong_type():
    """Test validation fails when router is not APIRouter."""
    loader = ModuleLoader(logger=NullLogger())
    
    mock_module = Mock()
    mock_module.router = "not_a_router"  # Wrong type
    
    result = loader.validate_module(mock_module, "test.module")
    assert result is False


def test_module_loader_register_module_import_error():
    """Test handling of ImportError during registration."""
    app = FastAPI()
    loader = ModuleLoader(logger=NullLogger())
    
    result = loader.register_module(app, "app.modules.nonexistent")
    assert result is False


def test_module_loader_register_module_validation_fails():
    """Test registration fails when validation fails."""
    app = FastAPI()
    loader = ModuleLoader(logger=NullLogger())
    
    with patch.object(loader, 'import_module') as mock_import:
        mock_module = Mock(spec=[])  # No router
        mock_import.return_value = mock_module
        
        result = loader.register_module(app, "test.module")
        assert result is False


def test_module_loader_register_module_generic_exception():
    """Test handling of generic exception during registration."""
    app = FastAPI()
    loader = ModuleLoader(logger=NullLogger())
    
    with patch.object(loader, 'import_module') as mock_import:
        mock_import.side_effect = RuntimeError("Something went wrong")
        
        result = loader.register_module(app, "test.module")
        assert result is False


def test_installed_modules_constant():
    """Test INSTALLED_MODULES is properly defined."""
    assert isinstance(INSTALLED_MODULES, list)
    assert "app.modules.health" in INSTALLED_MODULES


def test_module_loader_register_module_include_router_error():
    """Test handling of error when app.include_router fails."""
    app = FastAPI()
    loader = ModuleLoader(logger=NullLogger())
    
    with patch.object(loader, 'import_module') as mock_import:
        mock_module = Mock()
        mock_module.router = APIRouter()
        mock_import.return_value = mock_module
        
        # Make include_router raise an exception
        with patch.object(app, 'include_router', side_effect=ValueError("Router error")):
            result = loader.register_module(app, "test.module")
            assert result is False


# INTEGRATION TESTS
# =================

def test_module_loader_register_module_success():
    """Test successful module registration."""
    app = FastAPI()
    loader = ModuleLoader(logger=NullLogger())
    
    result = loader.register_module(app, "app.modules.health")
    assert result is True
    
    # Verify routes were added
    routes = [route.path for route in app.routes]
    assert "/" in routes
    assert "/health" in routes


def test_module_loader_register_all():
    """Test registering all modules from a list."""
    app = FastAPI()
    loader = ModuleLoader(logger=NullLogger())
    
    module_list = ["app.modules.health"]
    loader.register_all(app, module_list)
    
    # Verify routes were added
    routes = [route.path for route in app.routes]
    assert "/" in routes


def test_register_modules_function():
    """Test the convenience register_modules function."""
    app = FastAPI()
    
    # Should not raise any exceptions
    register_modules(app, logger=NullLogger())
    
    # Verify routes were added
    routes = [route.path for route in app.routes]
    assert "/" in routes


def test_register_modules_with_custom_logger():
    """Test register_modules with custom logger."""
    app = FastAPI()
    custom_logger = NullLogger()
    
    register_modules(app, logger=custom_logger)
    
    routes = [route.path for route in app.routes]
    assert len(routes) > 0
