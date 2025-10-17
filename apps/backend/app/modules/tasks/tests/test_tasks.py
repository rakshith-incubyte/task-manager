"""Tests for task API endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from app.main import create_app
from app.core.logger import NullLogger
from app.core.database import get_db


@pytest.fixture(scope="function")
def client(test_engine):
    """Create test client with test database."""
    app = create_app(logger=NullLogger())
    
    # Create session factory
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    
    # Override the get_db dependency
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    # Mock authenticated user for tests
    def mock_auth_user():
        from app.modules.users.schemas import UserResponse
        from datetime import datetime
        return UserResponse(
            id="test-user-id",
            username="testuser",
            email="test@example.com",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
    app.dependency_overrides[get_db] = override_get_db
    from app.modules.users.security import get_current_user
    app.dependency_overrides[get_current_user] = mock_auth_user
    
    yield TestClient(app)
    
    # Cleanup
    app.dependency_overrides.clear()

class TestTaskEndpoints:
    def test_create_task_success(self, client):
        response = client.post(
            "/tasks/",
            json={
                "title": "Test Task",
                "description": "This is a test task",
                "priority": "high",
                "status": "todo"
            }
        )
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        if response.status_code == 422:
            print(f"Validation errors: {response.json()}")
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Task"
        assert data["description"] == "This is a test task"
        assert data["priority"] == "high"
        assert data["status"] == "todo"
        assert "id" in data

    def test_create_task_invalid_data(self, client):
        response = client.post(
            "/tasks/",
            json={
                "title": "Test Task",
                "description": "This is a test task",
                "priority": "high",
                "status": "invalid"
            }
        )
        assert response.status_code == 422
    
    def test_get_task_by_id_success(self, client):
        task1 = client.post(
            "/tasks/",
            json={
                "title": "Test Task",
                "description": "This is a test task",
                "priority": "high",
                "status": "todo"
            }
        )
        task_id = task1.json()["id"]
        response = client.get(f"/tasks/{task_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Task"
        assert data["description"] == "This is a test task"
        assert data["priority"] == "high"
        assert data["status"] == "todo"
        assert "id" in data

    def test_get_task_by_id_invalid_id(self, client):
        response = client.get("/tasks/invalid_id")
        assert response.status_code == 404

    def test_get_tasks_pagination_success(self, client):
        response = client.get("/tasks/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        assert "data" in data
        assert "next_cursor" in data
        assert "has_more" in data
        assert isinstance(data["data"], list)
    
    def test_update_task_success(self, client):
        """Test updating a task."""
        # First create a task
        create_response = client.post(
            "/tasks/",
            json={
                "title": "Test Task",
                "description": "This is a test task",
                "priority": "high",
                "status": "todo"
            }
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["id"]
        
        # Now update the task
        response = client.put(
            f"/tasks/{task_id}",
            json={
                "title": "Updated Task",
                "description": "This is an updated test task",
                "priority": "low",
                "status": "in_progress"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Task"
        assert data["description"] == "This is an updated test task"
        assert data["priority"] == "low"
        assert data["status"] == "in_progress"
        assert "id" in data

    def test_update_task_invalid_id(self, client):
        """Test updating a non-existent task."""
        response = client.put(
            "/tasks/invalid_id",
            json={
                "title": "Updated Task",
                "status": "in_progress"
            }
        )
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Task not found"

    def test_delete_task_success(self, client):
        """Test deleting a task."""
        # First create a task
        create_response = client.post(
            "/tasks/",
            json={
                "title": "Test Task",
                "description": "This is a test task",
                "priority": "high",
                "status": "todo"
            }
        )
        assert create_response.status_code == 201
        task_id = create_response.json()["id"]
        
        # Now delete the task
        response = client.delete(f"/tasks/{task_id}")
        assert response.status_code == 204
        
        # Verify task is deleted by trying to get it
        get_response = client.get(f"/tasks/{task_id}")
        assert get_response.status_code == 404
        
    def test_delete_task_invalid_id(self, client):
        """Test deleting a non-existent task."""
        response = client.delete("/tasks/invalid_id")
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Task not found"