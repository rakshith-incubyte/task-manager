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
    