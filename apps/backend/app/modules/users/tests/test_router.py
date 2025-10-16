"""Tests for user API endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from app.main import create_app
from app.core.logger import NullLogger
from app.core.database import get_db


@pytest.fixture(scope="function")
def client(test_engine):
    """Create test client with test database."""
    app = create_app(logger=NullLogger())
    
    # Create session factory
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    
    # Override the get_db dependency
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    
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
    
    def test_get_user_token_success(self, client):
        """Test successful authentication and token generation."""
        # Create user
        client.post(
            "/users/",
            json={
                "username": "john_doe",
                "email": "john@example.com",
                "password": "Pass@123"
            }
        )
        
        # Login
        response = client.post(
            "/users/auth/token",
            json={
                "username": "john_doe",
                "password": "Pass@123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "access_token" in data
        assert "refresh_token" in data
        assert len(data["access_token"]) > 0
        assert len(data["refresh_token"]) > 0
    
    def test_get_user_token_invalid_username(self, client):
        """Test authentication with invalid username."""
        response = client.post(
            "/users/auth/token",
            json={
                "username": "nonexistent_user",
                "password": "Pass@123"
            }
        )
        
        assert response.status_code == 401
        assert "Invalid username or password" in response.json()["detail"]
    
    def test_get_user_token_invalid_password(self, client):
        """Test authentication with invalid password."""
        # Create user
        client.post(
            "/users/",
            json={
                "username": "john_doe",
                "email": "john@example.com",
                "password": "Pass@123"
            }
        )
        
        # Try to login with wrong password
        response = client.post(
            "/users/auth/token",
            json={
                "username": "john_doe",
                "password": "WrongPass@123"
            }
        )
        
        assert response.status_code == 401
        assert "Invalid username or password" in response.json()["detail"]
    
    def test_get_user_token_missing_credentials(self, client):
        """Test authentication with missing credentials."""
        response = client.post(
            "/users/auth/token",
            json={}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_get_current_user_success(self, client):
        """Test getting current user with valid token."""
        # Create and login user
        client.post(
            "/users/",
            json={
                "username": "john_doe",
                "email": "john@example.com",
                "password": "Pass@123"
            }
        )
        
        login_response = client.post(
            "/users/auth/token",
            json={
                "username": "john_doe",
                "password": "Pass@123"
            }
        )
        access_token = login_response.json()["access_token"]
        
        # Get current user
        response = client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "john_doe"
        assert data["email"] == "john@example.com"
        assert "password" not in data
    
    def test_get_current_user_no_token(self, client):
        """Test getting current user without token."""
        response = client.get("/users/me")
        
        assert response.status_code == 422  # Missing required header
    
    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token."""
        response = client.get(
            "/users/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        
        assert response.status_code == 401
        assert "Invalid token" in response.json()["detail"]
    
    def test_get_current_user_expired_token(self, client):
        """Test getting current user with expired token."""
        # Create an expired token (you might need to mock this in real scenario)
        expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MTYwMDAwMDAwMH0.invalid"
        
        response = client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        
        assert response.status_code == 401
    
    def test_get_current_user_invalid_scheme(self, client):
        """Test getting current user with invalid auth scheme."""
        response = client.get(
            "/users/me",
            headers={"Authorization": "Basic some_token"}
        )
        
        assert response.status_code == 401
        assert "Invalid authentication scheme" in response.json()["detail"]

