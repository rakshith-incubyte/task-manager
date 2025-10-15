from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator
from .validations import validate_username_format, validate_password_strength

USERNAME_MIN_LENGTH = 3
USERNAME_MAX_LENGTH = 50
PASSWORD_MIN_LENGTH = 8

class UserBase(BaseModel):
    """
    Base user model with common fields (DRY).
    
    All user schemas inherit from this to avoid field duplication.
    """
    
    username: str = Field(
        min_length=USERNAME_MIN_LENGTH,
        max_length=USERNAME_MAX_LENGTH,
        description="Username (3-50 characters, alphanumeric and underscore only)"
    )
    email: EmailStr = Field(description="Valid email address")
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Validate username format using centralized function."""
        return validate_username_format(v)


class UserCreate(UserBase):
    """
    Schema for creating a new user.
    
    Inherits username and email from UserBase (DRY).
    Adds password field for registration.
    """
    
    password: str = Field(
        min_length=PASSWORD_MIN_LENGTH,
        description="Password (min 8 chars, must have uppercase, lowercase, special char)"
    )
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength using centralized function."""
        return validate_password_strength(v)


class UserResponse(UserBase):
    """
    Schema for user response (excludes password).
    
    Inherits username and email from UserBase (DRY).
    Adds id and timestamps for API response.
    This is what the API returns - never expose passwords!
    
    Note: Pydantic automatically serializes datetime to ISO string in JSON responses.
    """
    
    id: str = Field(description="User ID (UUIDv7)")
    created_at: datetime = Field(description="Creation timestamp")
    updated_at: datetime = Field(description="Last update timestamp")
    
    model_config = {
        "from_attributes": True,  # Allows conversion from SQLAlchemy models
        "json_schema_extra": {
            "example": {
                "id": "01234567-89ab-cdef-0123-456789abcdef",
                "username": "john_doe",
                "email": "john@example.com",
                "created_at": "2025-10-14T12:00:00",
                "updated_at": None
            }
        }
    }


class UserUpdate(BaseModel):
    """
    Schema for updating a user.
    
    All fields are optional - only update what's provided.
    
    Note: Cannot inherit from UserBase because Pydantic doesn't allow
    changing required fields to optional in subclasses.
    However, validation logic is still DRY via centralized functions.
    """
    
    username: Optional[str] = Field(
        default=None,
        min_length=USERNAME_MIN_LENGTH,
        max_length=USERNAME_MAX_LENGTH,
        description="New username (optional)"
    )
    email: Optional[EmailStr] = Field(default=None, description="New email (optional)")
    password: Optional[str] = Field(
        default=None,
        min_length=PASSWORD_MIN_LENGTH,
        description="New password (optional)"
    )
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v: Optional[str]) -> Optional[str]:
        """Validate username format if provided using centralized function."""
        if v is not None:
            return validate_username_format(v)
        return v
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: Optional[str]) -> Optional[str]:
        """Validate password strength if provided using centralized function."""
        if v is not None:
            return validate_password_strength(v)
        return v
