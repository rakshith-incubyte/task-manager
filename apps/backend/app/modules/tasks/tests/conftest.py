"""
Shared test fixtures for user module tests.

Provides reusable database fixtures for testing.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base


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
