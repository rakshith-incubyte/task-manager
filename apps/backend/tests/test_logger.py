"""
Tests for logger implementations.

These tests ensure 100% coverage of logger.py
"""

from app.core.logger import ConsoleLogger, NullLogger


def test_console_logger_info():
    """Test ConsoleLogger info method."""
    logger = ConsoleLogger(name="test")
    # Should not raise any exceptions
    logger.info("Test info message")


def test_console_logger_warning():
    """Test ConsoleLogger warning method."""
    logger = ConsoleLogger(name="test")
    # Should not raise any exceptions
    logger.warning("Test warning message")


def test_console_logger_error():
    """Test ConsoleLogger error method."""
    logger = ConsoleLogger(name="test")
    # Should not raise any exceptions
    logger.error("Test error message")


def test_null_logger_info():
    """Test NullLogger info method (does nothing)."""
    logger = NullLogger()
    # Should not raise any exceptions
    logger.info("This should do nothing")


def test_null_logger_warning():
    """Test NullLogger warning method (does nothing)."""
    logger = NullLogger()
    # Should not raise any exceptions
    logger.warning("This should do nothing")


def test_null_logger_error():
    """Test NullLogger error method (does nothing)."""
    logger = NullLogger()
    # Should not raise any exceptions
    logger.error("This should do nothing")


def test_console_logger_with_custom_level():
    """Test ConsoleLogger with custom log level."""
    import logging
    logger = ConsoleLogger(name="custom", level=logging.DEBUG)
    logger.info("Debug level logger")
    assert logger.logger.level == logging.DEBUG


def test_console_logger_no_duplicate_handlers():
    """Test that ConsoleLogger doesn't add duplicate handlers."""
    logger1 = ConsoleLogger(name="same_name")
    initial_handlers = len(logger1.logger.handlers)
    
    logger2 = ConsoleLogger(name="same_name")
    # Should not add another handler
    assert len(logger2.logger.handlers) == initial_handlers
