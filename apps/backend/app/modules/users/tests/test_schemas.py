"""Tests for user schemas."""

import pytest
from datetime import datetime
from pydantic import ValidationError
from app.modules.users.schemas import UserCreate, UserResponse, UserUpdate


class TestUserCreate:
    """Test UserCreate schema validation."""
    
    def test_valid_user_create(self):
        """Test creating valid user."""
        user = UserCreate(
            username="john_doe",
            email="john@example.com",
            password="Pass@123"
        )
        assert user.username == "john_doe"
        assert user.email == "john@example.com"
        assert user.password == "Pass@123"
    
    def test_username_too_short(self):
        """Test that username shorter than 3 chars is invalid."""
        with pytest.raises(ValidationError) as exc_info:
            UserCreate(
                username="ab",
                email="john@example.com",
                password="Pass@123"
            )
        assert "at least 3 characters" in str(exc_info.value)
    
    def test_username_too_long(self):
        """Test that username longer than 50 chars is invalid."""
        with pytest.raises(ValidationError) as exc_info:
            UserCreate(
                username="a" * 51,
                email="john@example.com",
                password="Pass@123"
            )
        assert "at most 50 characters" in str(exc_info.value)
    
    def test_username_invalid_characters(self):
        """Test that username with invalid characters is rejected."""
        with pytest.raises(ValidationError, match="can only contain letters, numbers, and underscores"):
            UserCreate(
                username="john-doe",
                email="john@example.com",
                password="Pass@123"
            )
    
    def test_invalid_email(self):
        """Test that invalid email is rejected."""
        with pytest.raises(ValidationError):
            UserCreate(
                username="john_doe",
                email="invalid-email",
                password="Pass@123"
            )
    
    def test_password_too_short(self):
        """Test that password shorter than 8 chars is invalid."""
        with pytest.raises(ValidationError) as exc_info:
            UserCreate(
                username="john_doe",
                email="john@example.com",
                password="Pass@1"
            )
        assert "at least 8 characters" in str(exc_info.value)
    
    def test_password_no_uppercase(self):
        """Test that password without uppercase is invalid."""
        with pytest.raises(ValidationError, match="must contain at least one uppercase letter"):
            UserCreate(
                username="john_doe",
                email="john@example.com",
                password="pass@123"
            )
    
    def test_password_no_lowercase(self):
        """Test that password without lowercase is invalid."""
        with pytest.raises(ValidationError, match="must contain at least one lowercase letter"):
            UserCreate(
                username="john_doe",
                email="john@example.com",
                password="PASS@123"
            )
    
    def test_password_no_special_char(self):
        """Test that password without special character is invalid."""
        with pytest.raises(ValidationError, match="must contain at least one special character"):
            UserCreate(
                username="john_doe",
                email="john@example.com",
                password="Pass1234"
            )


class TestUserResponse:
    """Test UserResponse schema."""
    
    def test_user_response_creation(self):
        """Test creating UserResponse."""
        created_at = datetime(2025, 10, 14, 12, 0, 0)
        user = UserResponse(
            id="123",
            username="john_doe",
            email="john@example.com",
            created_at=created_at,
            updated_at=created_at
        )
        assert user.id == "123"
        assert user.username == "john_doe"
        assert user.email == "john@example.com"
        assert user.created_at == created_at
        assert user.updated_at == created_at
    
    def test_user_response_with_updated_at(self):
        """Test UserResponse with updated_at timestamp."""
        created_at = datetime(2025, 10, 14, 12, 0, 0)
        updated_at = datetime(2025, 10, 14, 13, 0, 0)
        user = UserResponse(
            id="123",
            username="john_doe",
            email="john@example.com",
            created_at=created_at,
            updated_at=updated_at
        )
        assert user.updated_at == updated_at


class TestUserUpdate:
    """Test UserUpdate schema."""
    
    def test_update_all_fields(self):
        """Test updating all fields."""
        update = UserUpdate(
            username="new_username",
            email="new@example.com",
            password="NewPass@123"
        )
        assert update.username == "new_username"
        assert update.email == "new@example.com"
        assert update.password == "NewPass@123"
    
    def test_update_only_username(self):
        """Test updating only username."""
        update = UserUpdate(username="new_username")
        assert update.username == "new_username"
        assert update.email is None
        assert update.password is None
    
    def test_update_only_email(self):
        """Test updating only email."""
        update = UserUpdate(email="new@example.com")
        assert update.username is None
        assert update.email == "new@example.com"
        assert update.password is None
    
    def test_update_only_password(self):
        """Test updating only password."""
        update = UserUpdate(password="NewPass@123")
        assert update.username is None
        assert update.email is None
        assert update.password == "NewPass@123"
    
    def test_update_no_fields(self):
        """Test update with no fields (all None)."""
        update = UserUpdate()
        assert update.username is None
        assert update.email is None
        assert update.password is None
    
    def test_update_explicit_none_username(self):
        """Test update with explicit None username."""
        update = UserUpdate(username=None)
        assert update.username is None
    
    def test_update_explicit_none_password(self):
        """Test update with explicit None password."""
        update = UserUpdate(password=None)
        assert update.password is None
    
    def test_update_invalid_username(self):
        """Test that invalid username in update is rejected."""
        with pytest.raises(ValidationError, match="can only contain letters, numbers, and underscores"):
            UserUpdate(username="john-doe")
    
    def test_update_invalid_password(self):
        """Test that invalid password in update is rejected."""
        with pytest.raises(ValidationError, match="must contain at least one uppercase letter"):
            UserUpdate(password="pass@123")
