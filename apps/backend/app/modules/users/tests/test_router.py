"""Tests for user API endpoints."""

import pytest
import tempfile
import os
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import create_app
from app.core.logger import NullLogger
from app.core.persistence import JSONPersistence
from app.modules.users.repository import UserRepository
from app.modules.users.service import UserService


@pytest.fixture
def temp_json_file():
    """Create temporary JSON file for testing."""
    fd, path = tempfile.mkstemp(suffix='.json')
    os.close(fd)
    yield path
    if os.path.exists(path):
        os.unlink(path)


@pytest.fixture
def client(temp_json_file):
    """Create test client with temporary storage."""
    from app.modules.users.router import get_user_service
    
    app = create_app(logger=NullLogger())
    
    # Override the dependency to use temp file
    def get_test_user_service():
        def db_factory(collection: str):
            return JSONPersistence(temp_json_file, collection)
        return UserService(db_factory)
    
    # Override dependency
    app.dependency_overrides[get_user_service] = get_test_user_service
    
    yield TestClient(app)
    
    # Cleanup
    app.dependency_overrides.clear()


class TestUserEndpoints:
    """Test user API endpoints."""
    
    def test_create_user_success(self, client):
        """Test successful user creation."""
        response = client.post(
            "/users/",
            json={
                "username": "john_doe",
                "email": "john@example.com",
                "password": "Pass@123"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "john_doe"
        assert data["email"] == "john@example.com"
        assert "id" in data
        assert "password" not in data  # Password should not be in response
    
    def test_create_user_invalid_username(self, client):
        """Test creating user with invalid username."""
        response = client.post(
            "/users/",
            json={
                "username": "john-doe",  # Invalid: contains hyphen
                "email": "john@example.com",
                "password": "Pass@123"
            }
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_create_user_invalid_email(self, client):
        """Test creating user with invalid email."""
        response = client.post(
            "/users/",
            json={
                "username": "john_doe",
                "email": "invalid-email",
                "password": "Pass@123"
            }
        )
        
        assert response.status_code == 422
    
    def test_create_user_weak_password(self, client):
        """Test creating user with weak password."""
        response = client.post(
            "/users/",
            json={
                "username": "john_doe",
                "email": "john@example.com",
                "password": "password"  # No uppercase, no special char
            }
        )
        
        assert response.status_code == 422
    
    def test_create_user_duplicate_username(self, client):
        """Test creating user with duplicate username."""
        # Create first user
        client.post(
            "/users/",
            json={
                "username": "john_doe",
                "email": "john@example.com",
                "password": "Pass@123"
            }
        )
        
        # Try to create with same username
        response = client.post(
            "/users/",
            json={
                "username": "john_doe",
                "email": "different@example.com",
                "password": "Pass@123"
            }
        )
        
        assert response.status_code == 400
        assert "already taken" in response.json()["detail"]
    
    def test_get_user_success(self, client):
        """Test getting existing user."""
        # Create user
        create_response = client.post(
            "/users/",
            json={
                "username": "john_doe",
                "email": "john@example.com",
                "password": "Pass@123"
            }
        )
        user_id = create_response.json()["id"]
        
        # Get user
        response = client.get(f"/users/{user_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user_id
        assert data["username"] == "john_doe"
    
    def test_get_user_not_found(self, client):
        """Test getting nonexistent user."""
        response = client.get("/users/nonexistent-id")
        assert response.status_code == 404
    
    def test_get_all_users_empty(self, client):
        """Test getting all users when none exist."""
        response = client.get("/users/")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_get_all_users(self, client):
        """Test getting all users."""
        # Create multiple users
        client.post("/users/", json={"username": "user1", "email": "user1@example.com", "password": "Pass@123"})
        client.post("/users/", json={"username": "user2", "email": "user2@example.com", "password": "Pass@123"})
        
        response = client.get("/users/")
        
        assert response.status_code == 200
        users = response.json()
        assert len(users) == 2
    
    def test_update_user_success(self, client):
        """Test successful user update."""
        # Create user
        create_response = client.post(
            "/users/",
            json={
                "username": "john_doe",
                "email": "john@example.com",
                "password": "Pass@123"
            }
        )
        user_id = create_response.json()["id"]
        
        # Update user
        response = client.put(
            f"/users/{user_id}",
            json={"username": "jane_doe"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "jane_doe"
        assert data["email"] == "john@example.com"  # Unchanged
    
    def test_update_user_not_found(self, client):
        """Test updating nonexistent user."""
        response = client.put(
            "/users/nonexistent-id",
            json={"username": "new_name"}
        )
        assert response.status_code == 404
    
    def test_delete_user_success(self, client):
        """Test successful user deletion."""
        # Create user
        create_response = client.post(
            "/users/",
            json={
                "username": "john_doe",
                "email": "john@example.com",
                "password": "Pass@123"
            }
        )
        user_id = create_response.json()["id"]
        
        # Delete user
        response = client.delete(f"/users/{user_id}")
        
        assert response.status_code == 204
        
        # Verify user is deleted
        get_response = client.get(f"/users/{user_id}")
        assert get_response.status_code == 404
    
    def test_delete_user_not_found(self, client):
        """Test deleting nonexistent user."""
        response = client.delete("/users/nonexistent-id")
        assert response.status_code == 404
