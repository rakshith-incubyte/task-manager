"""Tests for health check endpoints."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_endpoint_returns_message():
    """Test root endpoint returns correct message."""
    response = client.get("/")
    
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, World!"}


def test_root_endpoint_content_type():
    """Test root endpoint returns JSON content type."""
    response = client.get("/")
    
    assert response.headers["content-type"] == "application/json"


def test_health_check_returns_healthy():
    """Test health check endpoint returns healthy status."""
    response = client.get("/health")
    
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_health_check_content_type():
    """Test health check endpoint returns JSON content type."""
    response = client.get("/health")
    
    assert response.headers["content-type"] == "application/json"
