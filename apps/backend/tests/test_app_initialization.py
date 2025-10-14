from fastapi import FastAPI
from app.main import app

def test_app_is_fastapi_instance():
    """Test that app is an instance of FastAPI"""
    assert isinstance(app, FastAPI)