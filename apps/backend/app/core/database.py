"""
Database configuration and session management.

This module provides:
- SQLAlchemy engine and session factory
- Base model class for all database models
- Database dependency for FastAPI routes

Usage in Modules:
    1. Define models in module's models.py:
       from app.core.database import Base
       
       class Task(Base):
           __tablename__ = "tasks"
           ...
    
    2. Register module in app.config.INSTALLED_MODULES
       (Models are auto-discovered by Alembic!)
    
    3. Use get_db() dependency in routes:
       from app.core.database import get_db
       from sqlalchemy.orm import Session
       
       @router.get("/tasks")
       def list_tasks(db: Session = Depends(get_db)):
           return db.query(Task).all()
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session
from typing import Generator
from app.config import settings


# Create SQLAlchemy engine
engine = create_engine(
    settings.database_url,
    echo=settings.database_echo,
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=5,
    max_overflow=10
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


class Base(DeclarativeBase):
    """
    Base class for all database models.
    
    All models should inherit from this class.
    Provides common functionality and metadata.
    """
    pass


def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency for FastAPI.
    
    Usage in routes:
        @router.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    
    Yields:
        Database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize database tables.
    
    Creates all tables defined by models inheriting from Base.
    Should be called on application startup.
    """
    Base.metadata.create_all(bind=engine)
