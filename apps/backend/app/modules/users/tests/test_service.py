"""Tests for user service."""

import pytest
from fastapi import HTTPException

from app.modules.users.repository import UserRepository
from app.modules.users.service import UserService
from app.modules.users.schemas import UserCreate, UserUpdate


@pytest.fixture
def service(db_session):
    """Create service with test database."""
    repository = UserRepository(db_session)
    return UserService(repository)


class TestUserService:
    """Test UserService business logic."""
    
    def test_register_user_success(self, service):
        """Test successful user registration."""
        user_data = UserCreate(
            username="john_doe",
            email="john@example.com",
            password="Pass@123"
        )
        
        user = service.register_user(user_data)
        
        assert user.username == "john_doe"
        assert user.email == "john@example.com"
        assert user.id is not None  # UUIDv7 generated
        assert user.created_at is not None
    
    def test_register_user_duplicate_username(self, service):
        """Test that duplicate username is rejected."""
        user_data = UserCreate(
            username="john_doe",
            email="john@example.com",
            password="Pass@123"
        )
        service.register_user(user_data)
        
        # Try to register with same username
        duplicate_data = UserCreate(
            username="john_doe",
            email="different@example.com",
            password="Pass@123"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            service.register_user(duplicate_data)
        
        assert exc_info.value.status_code == 400
        assert "already taken" in exc_info.value.detail
    
    def test_register_user_duplicate_email(self, service):
        """Test that duplicate email is rejected."""
        user_data = UserCreate(
            username="john_doe",
            email="john@example.com",
            password="Pass@123"
        )
        service.register_user(user_data)
        
        # Try to register with same email
        duplicate_data = UserCreate(
            username="different_user",
            email="john@example.com",
            password="Pass@123"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            service.register_user(duplicate_data)
        
        assert exc_info.value.status_code == 400
        assert "already registered" in exc_info.value.detail
    
    def test_get_user_existing(self, service):
        """Test getting existing user."""
        user_data = UserCreate(
            username="john_doe",
            email="john@example.com",
            password="Pass@123"
        )
        created = service.register_user(user_data)
        
        user = service.get_user(created.id)
        
        assert user.id == created.id
        assert user.username == created.username
    
    def test_get_user_nonexistent(self, service):
        """Test getting nonexistent user raises 404."""
        with pytest.raises(HTTPException) as exc_info:
            service.get_user("nonexistent-id")
        
        assert exc_info.value.status_code == 404
        assert "not found" in exc_info.value.detail
    
    def test_get_all_users_empty(self, service):
        """Test getting all users when none exist."""
        users = service.get_all_users()
        assert users == []
    
    def test_get_all_users(self, service):
        """Test getting all users."""
        user1 = UserCreate(username="user1", email="user1@example.com", password="Pass@123")
        user2 = UserCreate(username="user2", email="user2@example.com", password="Pass@123")
        
        service.register_user(user1)
        service.register_user(user2)
        
        users = service.get_all_users()
        
        assert len(users) == 2
    
    def test_update_user_success(self, service):
        """Test successful user update."""
        user_data = UserCreate(
            username="john_doe",
            email="john@example.com",
            password="Pass@123"
        )
        created = service.register_user(user_data)
        
        update_data = UserUpdate(username="jane_doe")
        updated = service.update_user(created.id, update_data)
        
        assert updated.username == "jane_doe"
        assert updated.email == created.email  # Unchanged
    
    def test_update_user_with_password(self, service):
        """Test updating user with new password."""
        user_data = UserCreate(
            username="john_doe",
            email="john@example.com",
            password="Pass@123"
        )
        created = service.register_user(user_data)
        
        update_data = UserUpdate(password="NewPass@456")
        updated = service.update_user(created.id, update_data)
        
        assert updated is not None
        assert updated.username == created.username
    
    def test_update_user_nonexistent(self, service):
        """Test updating nonexistent user raises 404."""
        update_data = UserUpdate(username="new_name")
        
        with pytest.raises(HTTPException) as exc_info:
            service.update_user("nonexistent-id", update_data)
        
        assert exc_info.value.status_code == 404
        assert "not found" in exc_info.value.detail
    
    def test_update_user_duplicate_username(self, service):
        """Test that updating to duplicate username is rejected."""
        user1 = UserCreate(username="user1", email="user1@example.com", password="Pass@123")
        user2 = UserCreate(username="user2", email="user2@example.com", password="Pass@123")
        
        created1 = service.register_user(user1)
        created2 = service.register_user(user2)
        
        # Try to update user2's username to user1's username
        update_data = UserUpdate(username="user1")
        
        with pytest.raises(HTTPException) as exc_info:
            service.update_user(created2.id, update_data)
        
        assert exc_info.value.status_code == 400
        assert "already taken" in exc_info.value.detail
    
    def test_update_user_duplicate_email(self, service):
        """Test that updating to duplicate email is rejected."""
        user1 = UserCreate(username="user1", email="user1@example.com", password="Pass@123")
        user2 = UserCreate(username="user2", email="user2@example.com", password="Pass@123")
        
        created1 = service.register_user(user1)
        created2 = service.register_user(user2)
        
        # Try to update user2's email to user1's email
        update_data = UserUpdate(email="user1@example.com")
        
        with pytest.raises(HTTPException) as exc_info:
            service.update_user(created2.id, update_data)
        
        assert exc_info.value.status_code == 400
        assert "already registered" in exc_info.value.detail
    
    def test_delete_user_success(self, service):
        """Test successful user deletion."""
        user_data = UserCreate(
            username="john_doe",
            email="john@example.com",
            password="Pass@123"
        )
        created = service.register_user(user_data)
        
        result = service.delete_user(created.id)
        
        assert result is True
        
        # Verify user is deleted
        with pytest.raises(HTTPException):
            service.get_user(created.id)
    
    def test_delete_user_nonexistent(self, service):
        """Test deleting nonexistent user raises 404."""
        with pytest.raises(HTTPException) as exc_info:
            service.delete_user("nonexistent-id")
        
        assert exc_info.value.status_code == 404
