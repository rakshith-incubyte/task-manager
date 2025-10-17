"""
models defined for tasks module
"""

import enum
from datetime import datetime
from datetime import timezone

from sqlalchemy import DateTime
from sqlalchemy import Enum
from sqlalchemy import ForeignKey
from sqlalchemy import String
from sqlalchemy import Index
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.core.database import Base


class TaskStatus(str, enum.Enum):
    """Task status enumeration."""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class TaskPriority(str, enum.Enum):
    """Task priority enumeration."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)  # UUIDv7
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), nullable=False, default=TaskStatus.TODO)
    priority: Mapped[TaskPriority] = mapped_column(Enum(TaskPriority), nullable=False, default=TaskPriority.MEDIUM)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    owner: Mapped["User"] = relationship("User", back_populates="tasks")
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
    
    # Database indexes for efficient pagination and filtering
    __table_args__ = (
        # Composite index for owner_id + id (cursor-based pagination)
        Index('ix_tasks_owner_id_id', 'owner_id', 'id'),
        # Index for owner filtering
        Index('ix_tasks_owner_id', 'owner_id'),
        # Indexes for filtering
        Index('ix_tasks_owner_status', 'owner_id', 'status'),
        Index('ix_tasks_owner_priority', 'owner_id', 'priority'),
        Index('ix_tasks_owner_created_at', 'owner_id', 'created_at'),
        Index('ix_tasks_owner_updated_at', 'owner_id', 'updated_at'),
    )
    