"""Tests for user repository."""

import pytest
import tempfile
import os
from app.core.persistence import JSONPersistence
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserUpdate


@pytest.fixture
def temp_json_file():
    """Create temporary JSON file for testing."""
    fd, path = tempfile.mkstemp(suffix='.json')
    os.close(fd)
    yield path
    os.unlink(path)


@pytest.fixture
def repository(temp_json_file):
    """Create repository with temporary storage."""
    def db_factory(collection: str):
        return JSONPersistence(temp_json_file, collection)
    return UserRepository(db_factory)


class TestUserRepository:
    """Test UserRepository operations."""
    
    def test_create_user(self, repository):
        """Test creating a user."""
        user_data = UserCreate(
            username="john_doe",
            email="john@example.com",
            password="Pass@123"
        )
        
        user = repository.create("user-123", user_data, "hashed_password")
        
        assert user.id == "user-123"
        assert user.username == "john_doe"
        assert user.email == "john@example.com"
        assert user.created_at is not None
        assert user.updated_at is None
    
    def test_get_by_id_existing(self, repository):
        """Test getting existing user by ID."""
        user_data = UserCreate(
            username="john_doe",
            email="john@example.com",
            password="Pass@123"
        )
        created = repository.create("user-123", user_data, "hashed_password")
        
        user = repository.get_by_id("user-123")
        
        assert user is not None
        assert user.id == created.id
        assert user.username == created.username
    
    def test_get_by_id_nonexistent(self, repository):
        """Test getting nonexistent user returns None."""
        user = repository.get_by_id("nonexistent")
        assert user is None
    
    def test_get_by_username_existing(self, repository):
        """Test finding user by username."""
        user_data = UserCreate(
            username="john_doe",
            email="john@example.com",
            password="Pass@123"
        )
        repository.create("user-123", user_data, "hashed_password")
        
        user_dict = repository.get_by_username("john_doe")
        
        assert user_dict is not None
        assert user_dict["username"] == "john_doe"
        assert "password" in user_dict  # Raw dict includes password
    
    def test_get_by_username_nonexistent(self, repository):
        """Test finding nonexistent username returns None."""
        user_dict = repository.get_by_username("nonexistent")
        assert user_dict is None
    
    def test_get_by_email_existing(self, repository):
        """Test finding user by email."""
        user_data = UserCreate(
            username="john_doe",
            email="john@example.com",
            password="Pass@123"
        )
        repository.create("user-123", user_data, "hashed_password")
        
        user_dict = repository.get_by_email("john@example.com")
        
        assert user_dict is not None
        assert user_dict["email"] == "john@example.com"
    
    def test_get_by_email_nonexistent(self, repository):
        """Test finding nonexistent email returns None."""
        user_dict = repository.get_by_email("nonexistent@example.com")
        assert user_dict is None
    
    def test_get_all_empty(self, repository):
        """Test getting all users when none exist."""
        users = repository.get_all()
        assert users == []
    
    def test_get_all_multiple_users(self, repository):
        """Test getting all users."""
        user1_data = UserCreate(username="user1", email="user1@example.com", password="Pass@123")
        user2_data = UserCreate(username="user2", email="user2@example.com", password="Pass@123")
        
        repository.create("user-1", user1_data, "hashed1")
        repository.create("user-2", user2_data, "hashed2")
        
        users = repository.get_all()
        
        assert len(users) == 2
        usernames = [u.username for u in users]
        assert "user1" in usernames
        assert "user2" in usernames
    
    def test_update_user(self, repository):
        """Test updating user."""
        user_data = UserCreate(
            username="john_doe",
            email="john@example.com",
            password="Pass@123"
        )
        repository.create("user-123", user_data, "hashed_password")
        
        update_data = UserUpdate(username="jane_doe", email="jane@example.com")
        updated = repository.update("user-123", update_data, None)
        
        assert updated is not None
        assert updated.username == "jane_doe"
        assert updated.email == "jane@example.com"
        assert updated.updated_at is not None
    
    def test_update_user_with_password(self, repository):
        """Test updating user with new password."""
        user_data = UserCreate(
            username="john_doe",
            email="john@example.com",
            password="Pass@123"
        )
        repository.create("user-123", user_data, "hashed_password")
        
        update_data = UserUpdate(password="NewPass@123")
        updated = repository.update("user-123", update_data, "new_hashed_password")
        
        assert updated is not None
        # Password not in response, but should be updated in storage
    
    def test_update_nonexistent_user(self, repository):
        """Test updating nonexistent user returns None."""
        update_data = UserUpdate(username="new_name")
        updated = repository.update("nonexistent", update_data, None)
        assert updated is None
    
    def test_delete_user(self, repository):
        """Test deleting user."""
        user_data = UserCreate(
            username="john_doe",
            email="john@example.com",
            password="Pass@123"
        )
        repository.create("user-123", user_data, "hashed_password")
        
        deleted = repository.delete("user-123")
        
        assert deleted is True
        assert repository.get_by_id("user-123") is None
    
    def test_delete_nonexistent_user(self, repository):
        """Test deleting nonexistent user returns False."""
        deleted = repository.delete("nonexistent")
        assert deleted is False
