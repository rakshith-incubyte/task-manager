"""Tests for database configuration and session management."""

from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy.orm import Session

from app.core.database import Base
from app.core.database import engine
from app.core.database import get_db
from app.core.database import init_db
from app.core.database import SessionLocal


class TestBase:
    """Test Base declarative class."""
    
    def test_base_has_metadata(self):
        """Test that Base has metadata."""
        assert hasattr(Base, 'metadata')
    
    def test_model_inheritance(self):
        """Test that models can inherit from Base."""
        class TestModel(Base):
            __tablename__ = "test_model"
            id = Column(Integer, primary_key=True)
        
        assert TestModel.__tablename__ == "test_model"


class TestGetDb:
    """Test get_db dependency function."""
    
    def test_get_db_yields_session(self):
        """Test that get_db yields a session."""
        db_gen = get_db()
        db = next(db_gen)
        
        assert isinstance(db, Session)
        
        # Cleanup
        db_gen.close()


class TestInitDb:
    """Test init_db function."""
    
    def test_init_db_creates_tables(self):
        """Test that init_db creates tables."""
        init_db()


class TestDatabaseConfiguration:
    """Test database configuration."""
    
    def test_engine_exists(self):
        """Test that engine is created."""
        assert engine is not None
    
    def test_session_local_exists(self):
        """Test that SessionLocal factory exists."""
        assert SessionLocal is not None
