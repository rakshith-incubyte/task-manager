"""
User repository - data access layer.
"""

from datetime import datetime
from app.modules.users.interfaces import UserRepositoryProtocol
from app.modules.users.schemas import UserCreate, UserResponse, UserUpdate


def dict_to_user_response(user_dict: dict) -> UserResponse:
    """
    Args:
        user_dict: User data from persistence layer
    
    Returns:
        UserResponse without password
    """
    return UserResponse(
        id=user_dict["id"],
        username=user_dict["username"],
        email=user_dict["email"],
        created_at=user_dict["created_at"],
        updated_at=user_dict.get("updated_at")
    )


class UserRepository(UserRepositoryProtocol):
    """
    User data access layer.
    
    Manages the "users" table/collection in the database.
    """
    
    TABLE_NAME = "users"
    
    def __init__(self, db_factory):
        """
        Initialize repository with database factory.
        
        Args:
            db_factory: Factory function to create persistence instances
        """
        self.db = db_factory(self.TABLE_NAME)
    
    def create(
        self,
        user_id: str,
        user_data: UserCreate,
        hashed_password: str
    ) -> UserResponse:
        """
        Create a new user.
        
        Args:
            user_id: Generated UUIDv7
            user_data: User creation data
            hashed_password: Already hashed password (from service layer)
        
        Returns:
            Created user (without password)
        """
        now = datetime.now().isoformat()
        
        user_dict = {
            "id": user_id,
            "username": user_data.username,
            "email": user_data.email,
            "password": hashed_password,  # Stored but never returned
            "created_at": now,
            "updated_at": None
        }
        
        self.db.create(user_id, user_dict)
        
        # Return without password (using DRY helper)
        return dict_to_user_response(user_dict)
    
    def get_by_id(self, user_id: str) -> UserResponse | None:
        """
        Get user by ID.
        
        Args:
            user_id: User identifier
        
        Returns:
            User data (without password) or None if not found
        """
        user_dict = self.db.get(user_id)
        
        if not user_dict:
            return None
        
        return dict_to_user_response(user_dict)
    
    def get_by_username(self, username: str) -> dict | None:
        """
        Find user by username.
        
        Returns raw dict (includes password) for internal use only.
        Used by service layer to check uniqueness.
        
        Args:
            username: Username to search for
        
        Returns:
            User dict (with password) or None
        """
        return self.db.find_by_field("username", username)
    
    def get_by_email(self, email: str) -> dict | None:
        """
        Find user by email.
        
        Returns raw dict (includes password) for internal use only.
        Used by service layer to check uniqueness.
        
        Args:
            email: Email to search for
        
        Returns:
            User dict (with password) or None
        """
        return self.db.find_by_field("email", email)
    
    def get_all(self) -> list[UserResponse]:
        """
        Get all users.
        
        Returns:
            List of all users (without passwords)
        """
        users = self.db.get_all()
        
        return [dict_to_user_response(user) for user in users]
    
    def update(
        self,
        user_id: str,
        user_data: UserUpdate,
        hashed_password: str | None
    ) -> UserResponse | None:
        """
        Update user.
        
        Args:
            user_id: User identifier
            user_data: Update data (only provided fields)
            hashed_password: New hashed password (if password is being updated)
        
        Returns:
            Updated user or None if not found
        """
        existing = self.db.get(user_id)
        
        if not existing:
            return None
        
        # Update only provided fields
        if user_data.username is not None:
            existing["username"] = user_data.username
        
        if user_data.email is not None:
            existing["email"] = user_data.email
        
        if hashed_password is not None:
            existing["password"] = hashed_password
        
        existing["updated_at"] = datetime.now().isoformat()
        
        self.db.update(user_id, existing)
        
        return dict_to_user_response(existing)
    
    def delete(self, user_id: str) -> bool:
        """
        Delete user.
        
        Args:
            user_id: User identifier
        
        Returns:
            True if deleted, False if not found
        """
        return self.db.delete(user_id)
