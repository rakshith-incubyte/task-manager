"""
Tests for FastAPI application initialization.

These tests demonstrate the benefits of SOLID principles:
- DIP: We can inject custom config and logger
- SRP: Each test has one clear purpose
- Testability: No global state, everything is injectable
"""

from fastapi import FastAPI

from app.main import app, create_app, configure_cors
from app.config import settings, Settings
from app.core.logger import NullLogger


def test_app_is_fastapi_instance():
    """Test that app is an instance of FastAPI."""
    assert isinstance(app, FastAPI)


def test_create_app_returns_fastapi():
    """Test that create_app factory returns FastAPI instance."""
    new_app = create_app()
    assert isinstance(new_app, FastAPI)


def test_app_has_correct_title():
    """Test that app has correct title from settings."""
    assert app.title == settings.app_name


def test_app_has_correct_version():
    """Test that app has correct version from settings."""
    assert app.version == settings.app_version


def test_app_has_routes():
    """Test that app has routes configured."""
    routes = [route.path for route in app.routes]
    assert len(routes) > 0
    assert "/" in routes
    assert "/health" in routes


def test_create_app_with_custom_config():
    """
    Test creating app with custom configuration.

    """
    custom_config = Settings(
        app_name="Custom Test API",
        app_version="99.99.99",
        debug=True
    )
    
    test_app = create_app(config=custom_config)
    
    assert test_app.title == "Custom Test API"
    assert test_app.version == "99.99.99"
    assert test_app.debug is True


def test_create_app_with_null_logger():
    """
    Test creating app with NullLogger (no output).
    
    This demonstrates:
    - DIP: Logger is injected, not hardcoded
    - Testability: Can silence logs in tests
    - Flexibility: Can swap logger implementations
    """
    test_app = create_app(logger=NullLogger())
    
    # App should still work, just without log output
    assert isinstance(test_app, FastAPI)
    routes = [route.path for route in test_app.routes]
    assert "/" in routes


def test_configure_cors_applies_settings():
    """
    Test that CORS configuration is applied from settings.

    """
    custom_config = Settings(
        cors_origins=["https://example.com"],
        cors_allow_credentials=False
    )
    
    test_app = FastAPI()
    configure_cors(test_app, custom_config)
    
    # Verify middleware was added
    assert len(test_app.user_middleware) > 0


def test_create_app_uses_default_settings_when_none_provided():
    """
    Test that default settings are used when no config is provided.
    """
    test_app = create_app()
    
    assert test_app.title == settings.app_name
    assert test_app.version == settings.app_version