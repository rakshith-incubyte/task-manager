"""
Consolidated tests for user module.

This file contains all tests for the user module, organized into unit and integration tests.
Unit tests focus on individual components (schemas, validations, repository, service).
Integration tests focus on full API endpoints.
"""

import pytest
from datetime import datetime
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from unittest.mock import patch

from app.core.database import Base
from app.main import create_app
from app.core.logger import NullLogger
from app.core.database import get_db
from app.modules.users.repository import UserRepository
from app.modules.users.service import UserService
from app.modules.users.schemas import UserCreate, UserResponse, UserUpdate
from app.modules.users.validations import validate_username_format, validate_password_strength


# Shared Fixtures
@pytest.fixture(scope="function")
def test_engine():
    """
    Create test database engine with proper threading support.

    Uses SQLite in-memory database with:
    - check_same_thread=False: Allows cross-thread usage
    - StaticPool: Ensures same connection is reused
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False
    )

    # Create all tables
    Base.metadata.create_all(engine)

    yield engine

    # Cleanup
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(test_engine):
    """
    Create database session for testing.

    Args:
        test_engine: Test database engine fixture

    Yields:
        SQLAlchemy session for database operations
    """
    SessionLocal = sessionmaker(bind=test_engine)
    session = SessionLocal()

    yield session

    # Cleanup
    session.close()


@pytest.fixture
def repository(db_session):
    """Create repository with test database session."""
    return UserRepository(db_session)


@pytest.fixture
def service(db_session):
    """Create service with test database."""
    repository = UserRepository(db_session)
    return UserService(repository)


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


# UNIT TESTS
# ==========

class TestUserValidations:
    """Test username and password validation functions."""

    def test_valid_username_lowercase(self):
        """Test valid username with lowercase letters."""
        assert validate_username_format("john") == "john"

    def test_valid_username_uppercase(self):
        """Test valid username with uppercase letters."""
        assert validate_username_format("JOHN") == "JOHN"

    def test_valid_username_mixed_case(self):
        """Test valid username with mixed case."""
        assert validate_username_format("JohnDoe") == "JohnDoe"

    def test_valid_username_with_numbers(self):
        """Test valid username with numbers."""
        assert validate_username_format("john123") == "john123"

    def test_valid_username_with_underscore(self):
        """Test valid username with underscores."""
        assert validate_username_format("john_doe_123") == "john_doe_123"

    def test_invalid_username_with_spaces(self):
        """Test that username with spaces is invalid."""
        with pytest.raises(ValueError, match="can only contain letters, numbers, and underscores"):
            validate_username_format("john doe")

    def test_invalid_username_with_special_chars(self):
        """Test that username with special characters is invalid."""
        with pytest.raises(ValueError, match="can only contain letters, numbers, and underscores"):
            validate_username_format("john@doe")

    def test_invalid_username_with_hyphen(self):
        """Test that username with hyphen is invalid."""
        with pytest.raises(ValueError, match="can only contain letters, numbers, and underscores"):
            validate_username_format("john-doe")

    def test_valid_password(self):
        """Test valid password with all requirements."""
        assert validate_password_strength("Pass@123") == "Pass@123"

    def test_valid_password_complex(self):
        """Test valid complex password."""
        assert validate_password_strength("MyP@ssw0rd!") == "MyP@ssw0rd!"

    def test_invalid_password_no_uppercase(self):
        """Test that password without uppercase is invalid."""
        with pytest.raises(ValueError, match="must contain at least one uppercase letter"):
            validate_password_strength("pass@123")

    def test_invalid_password_no_lowercase(self):
        """Test that password without lowercase is invalid."""
        with pytest.raises(ValueError, match="must contain at least one lowercase letter"):
            validate_password_strength("PASS@123")

    def test_invalid_password_no_special_char(self):
        """Test that password without special character is invalid."""
        with pytest.raises(ValueError, match="must contain at least one special character"):
            validate_password_strength("Pass1234")

    def test_valid_password_various_special_chars(self):
        """Test password with various special characters."""
        special_chars = "!@#$%^&*(),.?\":{}|<>"
        for char in special_chars:
            password = f"Pass123{char}"
            assert validate_password_strength(password) == password


class TestUserSchemas:
    """Test Pydantic schemas for user models."""

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
        assert user.updated_at is not None

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

        user_model = repository.get_by_username("john_doe")

        assert user_model is not None
        assert user_model.username == "john_doe"
        assert user_model.password == "hashed_password"  # User model includes password

    def test_get_by_username_nonexistent(self, repository):
        """Test finding nonexistent username returns None."""
        user_model = repository.get_by_username("nonexistent")
        assert user_model is None

    def test_get_by_email_existing(self, repository):
        """Test finding user by email."""
        user_data = UserCreate(
            username="john_doe",
            email="john@example.com",
            password="Pass@123"
        )
        repository.create("user-123", user_data, "hashed_password")

        user_model = repository.get_by_email("john@example.com")

        assert user_model is not None
        assert user_model.email == "john@example.com"

    def test_get_by_email_nonexistent(self, repository):
        """Test finding nonexistent email returns None."""
        user_model = repository.get_by_email("nonexistent@example.com")
        assert user_model is None

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

    def test_update_current_user_success(self, service):
        """Test successful user update."""
        user_data = UserCreate(
            username="john_doe",
            email="john@example.com",
            password="Pass@123"
        )
        created = service.register_user(user_data)

        update_data = UserUpdate(username="jane_doe")
        updated = service.update_current_user(update_data, created.id)

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
        updated = service.update_current_user(update_data, created.id)

        assert updated is not None
        assert updated.username == created.username

    def test_update_user_duplicate_username(self, service):
        """Test that updating to duplicate username is rejected."""
        user1 = UserCreate(username="user1", email="user1@example.com", password="Pass@123")
        user2 = UserCreate(username="user2", email="user2@example.com", password="Pass@123")

        created1 = service.register_user(user1)
        created2 = service.register_user(user2)

        # Try to update user2's username to user1's username
        update_data = UserUpdate(username="user1")

        with pytest.raises(HTTPException) as exc_info:
            service.update_current_user(update_data, created2.id)

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
            service.update_current_user(update_data, created2.id)

        assert exc_info.value.status_code == 400
        assert "already registered" in exc_info.value.detail


# INTEGRATION TESTS
# =================

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

        # Update user using new endpoint
        response = client.put(
            "/users/",
            json={"username": "jane_doe"},
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "jane_doe"
        assert data["email"] == "john@example.com"  # Unchanged

    def test_update_user_unauthenticated(self, client):
        """Test updating user without authentication."""
        response = client.put(
            "/users/me",
            json={"username": "new_name"}
        )
        assert response.status_code == 422  # Missing authentication header

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
        
        assert response.status_code == 422
        assert "Invalid authentication scheme" in response.json()["detail"]


class TestSecurityFunctions:
    """Unit tests for security functions."""

    def test_create_access_token_default_expires(self):
        """Test create_access_token with default expiration."""
        from app.modules.users.security import create_access_token
        
        token = create_access_token("user-123")
        
        # Should use default expiration from settings
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Decode to verify it contains expected data
        import jwt
        from app.config import settings
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        assert payload["sub"] == "user-123"
        assert "exp" in payload

    def test_create_refresh_token_default_expires(self):
        """Test create_refresh_token with default expiration."""
        from app.modules.users.security import create_refresh_token
        
        token = create_refresh_token("user-123")
        
        # Should use default expiration from settings
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Decode to verify it contains expected data
        import jwt
        from app.config import settings
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        assert payload["sub"] == "user-123"
        assert "exp" in payload

    def test_get_current_user_invalid_token(self):
        """Test get_current_user with invalid token that decodes to None."""
        from app.modules.users.security import get_current_user
        
        # Mock decodeJWT to return None
        with patch('app.modules.users.security.decodeJWT', return_value=None):
            with pytest.raises(HTTPException) as exc_info:
                get_current_user(token="invalid_token")
            
            assert exc_info.value.status_code == 401
            assert "Could not validate credentials" in str(exc_info.value.detail)

    def test_get_current_user_missing_sub_claim(self):
        """Test get_current_user when token payload missing 'sub' claim."""
        from app.modules.users.security import get_current_user
        
        # Mock decodeJWT to return payload without 'sub'
        with patch('app.modules.users.security.decodeJWT', return_value={"exp": 1234567890}):
            with pytest.raises(HTTPException) as exc_info:
                get_current_user(token="token_without_sub")
            
            assert exc_info.value.status_code == 401
            assert "Could not validate credentials" in str(exc_info.value.detail)
