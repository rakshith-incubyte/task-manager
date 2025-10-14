import re

def validate_username_format(username: str) -> str:
    """
    Validate username format.
    
    Rules:
    - Only letters, numbers, and underscores
    - No spaces or special characters
    
    Raises:
        ValueError: If validation fails
    """
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        raise ValueError(
            'Username can only contain letters, numbers, and underscores'
        )
    return username


def validate_password_strength(password: str) -> str:
    """
    Validate password strength.
    
    Rules:
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one special character
    - Minimum 8 characters
    
    Raises:
        ValueError: If validation fails
    """
    if not re.search(r'[A-Z]', password):
        raise ValueError('Password must contain at least one uppercase letter')
    
    if not re.search(r'[a-z]', password):
        raise ValueError('Password must contain at least one lowercase letter')
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValueError('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)')
    
    return password