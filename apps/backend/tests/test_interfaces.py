"""
Tests for interface protocols.

These tests ensure protocols are correctly defined and can be used for type checking.
"""

from fastapi import APIRouter

from app.core.interfaces import LoggerProtocol, ModuleProtocol
from app.core.logger import ConsoleLogger, NullLogger


def test_logger_protocol_with_console_logger():
    """Test that ConsoleLogger implements LoggerProtocol."""
    logger: LoggerProtocol = ConsoleLogger()
    
    # Should have all required methods
    assert hasattr(logger, 'info')
    assert hasattr(logger, 'warning')
    assert hasattr(logger, 'error')
    
    # Should be callable
    logger.info("test")
    logger.warning("test")
    logger.error("test")


def test_logger_protocol_with_null_logger():
    """Test that NullLogger implements LoggerProtocol."""
    logger: LoggerProtocol = NullLogger()
    
    # Should have all required methods
    assert hasattr(logger, 'info')
    assert hasattr(logger, 'warning')
    assert hasattr(logger, 'error')
    
    # Should be callable
    logger.info("test")
    logger.warning("test")
    logger.error("test")


def test_module_protocol_structure():
    """Test that modules can implement ModuleProtocol."""
    # Create a mock module that implements the protocol
    class MockModule:
        def __init__(self):
            self.router = APIRouter()
    
    module: ModuleProtocol = MockModule()
    
    # Should have router attribute
    assert hasattr(module, 'router')
    assert isinstance(module.router, APIRouter)


def test_logger_protocol_methods_signature():
    """Test that LoggerProtocol methods have correct signatures."""
    logger = ConsoleLogger()
    
    # All methods should accept string and return None
    result_info = logger.info("test")
    result_warning = logger.warning("test")
    result_error = logger.error("test")
    
    assert result_info is None
    assert result_warning is None
    assert result_error is None


def test_custom_logger_implements_protocol():
    """Test that custom logger can implement LoggerProtocol."""
    class CustomLogger:
        """Custom logger implementation."""
        def info(self, message: str) -> None:
            pass
        
        def warning(self, message: str) -> None:
            pass
        
        def error(self, message: str) -> None:
            pass
    
    logger: LoggerProtocol = CustomLogger()
    
    # Should work as LoggerProtocol
    logger.info("test")
    logger.warning("test")
    logger.error("test")
