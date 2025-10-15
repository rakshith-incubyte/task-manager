"""
User database models using SQLAlchemy ORM.
"""

from datetime import datetime
from datetime import timezone
from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.modules.tasks.models import Task


class User(Base):
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)  # UUIDv7
    username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)  # Hashed password
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now(timezone.utc),
        onupdate=datetime.now(timezone.utc),
        nullable=False
    )
    
    # Relationship to tasks
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="owner")
    
    def __repr__(self) -> str:
        return f"<User(id='{self.id}', username='{self.username}', email='{self.email}')>"
