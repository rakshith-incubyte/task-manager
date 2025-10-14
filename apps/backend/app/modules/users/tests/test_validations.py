"""Tests for user validation functions."""

import pytest
from app.modules.users.validations import validate_username_format, validate_password_strength


class TestUsernameValidation:
    """Test username format validation."""
    
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


class TestPasswordValidation:
    """Test password strength validation."""
    
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
