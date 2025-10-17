"""
User repository - SQLAlchemy ORM data access layer.
"""

from sqlalchemy.orm import Session
from app.modules.users.schemas import UserCreate
from app.modules.users.schemas import UserResponse
from app.modules.users.schemas import UserUpdate
from app.modules.users.models import User


class UserRepository:
    """
    Repository for User entity using SQLAlchemy ORM.
    
    Handles all database operations for users.
    """
    
    def __init__(self, db: Session):
        """
        Initialize repository with database session.
        
        Args:
            db: SQLAlchemy session
        """
        self.db = db
    
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
        user = User(
            id=user_id,
            username=user_data.username,
            email=user_data.email,
            password=hashed_password
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
    
    def get_by_id(self, user_id: str) -> UserResponse | None:
        """
        Get user by ID.
        
        Args:
            user_id: User identifier
        
        Returns:
            User data (without password) or None if not found
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        
        if not user:
            return None
        
        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
    
    def get_by_username(self, username: str) -> User | None:
        """
        Find user by username.
        
        Returns User model (includes password) for internal use only.
        Used by service layer for authentication and uniqueness checks.
        
        Args:
            username: Username to search for
        
        Returns:
            User model (with password) or None
        """
        return self.db.query(User).filter(User.username == username).first()
    
    def get_by_email(self, email: str) -> User | None:
        """
        Find user by email.
        
        Returns User model (includes password) for internal use only.
        Used by service layer for uniqueness checks.
        
        Args:
            email: Email to search for
        
        Returns:
            User model (with password) or None
        """
        return self.db.query(User).filter(User.email == email).first()
    
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
        user = self.db.query(User).filter(User.id == user_id).first()
        
        if not user:
            return None
        
        # Update only provided fields
        if user_data.username is not None:
            user.username = user_data.username
        
        if user_data.email is not None:
            user.email = user_data.email
        
        if hashed_password is not None:
            user.password = hashed_password
        
        self.db.commit()
        self.db.refresh(user)
        
        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
