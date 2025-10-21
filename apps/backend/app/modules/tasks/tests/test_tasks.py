"""Tests for task API endpoints."""
import io
import pytest
from datetime import datetime, timedelta
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from app.main import create_app
from app.core.logger import NullLogger
from app.core.database import get_db
from app.modules.tasks.schemas import TaskCreate, TaskFilter, TaskUpdate, TaskPaginationRequest
from app.modules.users.schemas import UserResponse
from app.modules.users.security import get_current_user
from app.modules.tasks.models import Task


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
        return UserResponse(
            id="test-user-id",
            username="testuser",
            email="test@example.com",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
    app.dependency_overrides[get_db] = override_get_db
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
    
    def test_get_tasks_pagination_with_tasks(self, client):
        """Test pagination with actual tasks."""
        # Create multiple tasks
        tasks = []
        for i in range(5):
            response = client.post(
                "/tasks/",
                json={
                    "title": f"Task {i+1}",
                    "description": f"Description for task {i+1}",
                    "priority": "high" if i % 2 == 0 else "low",
                    "status": "todo" if i < 3 else "in_progress"
                }
            )
            assert response.status_code == 201
            tasks.append(response.json())
        
        # Test pagination with limit
        response = client.get("/tasks/?limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 2
        assert data["has_more"] is True
        assert data["next_cursor"] is not None
        
        # Get next page
        next_cursor = data["next_cursor"]
        response = client.get(f"/tasks/?cursor={next_cursor}&limit=2")
        assert response.status_code == 200
        data2 = response.json()
        assert len(data2["data"]) == 2
        assert data2["has_more"] is True
        
        # Get final page
        next_cursor2 = data2["next_cursor"]
        response = client.get(f"/tasks/?cursor={next_cursor2}&limit=2")
        assert response.status_code == 200
        data3 = response.json()
        assert len(data3["data"]) == 1  # Only 1 task left
        assert data3["has_more"] is False
    
    def test_get_tasks_filter_by_status(self, client):
        """Test filtering tasks by status."""
        # Create tasks with different statuses
        client.post("/tasks/", json={"title": "Todo Task", "description": "Todo", "priority": "high", "status": "todo"})
        client.post("/tasks/", json={"title": "In Progress Task", "description": "In progress", "priority": "high", "status": "in_progress"})
        client.post("/tasks/", json={"title": "Done Task", "description": "Done", "priority": "high", "status": "done"})
        
        # Filter by todo status
        response = client.get("/tasks/?status=todo")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1
        assert data["data"][0]["title"] == "Todo Task"
        assert data["data"][0]["status"] == "todo"
        
        # Filter by in_progress status
        response = client.get("/tasks/?status=in_progress")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1
        assert data["data"][0]["title"] == "In Progress Task"
        assert data["data"][0]["status"] == "in_progress"
    
    def test_get_tasks_filter_by_priority(self, client):
        """Test filtering tasks by priority."""
        # Create tasks with different priorities
        client.post("/tasks/", json={"title": "High Priority", "description": "High", "priority": "high", "status": "todo"})
        client.post("/tasks/", json={"title": "Medium Priority", "description": "Medium", "priority": "medium", "status": "todo"})
        client.post("/tasks/", json={"title": "Low Priority", "description": "Low", "priority": "low", "status": "todo"})
        
        # Filter by high priority
        response = client.get("/tasks/?priority=high")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1
        assert data["data"][0]["title"] == "High Priority"
        assert data["data"][0]["priority"] == "high"
        
        # Filter by medium priority
        response = client.get("/tasks/?priority=medium")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1
        assert data["data"][0]["title"] == "Medium Priority"
        assert data["data"][0]["priority"] == "medium"
    
    def test_get_tasks_combined_filters(self, client):
        """Test combining status and priority filters."""
        # Create tasks with different combinations
        client.post("/tasks/", json={"title": "High Todo", "description": "High todo", "priority": "high", "status": "todo"})
        client.post("/tasks/", json={"title": "High In Progress", "description": "High in progress", "priority": "high", "status": "in_progress"})
        client.post("/tasks/", json={"title": "Low Todo", "description": "Low todo", "priority": "low", "status": "todo"})
        client.post("/tasks/", json={"title": "Low In Progress", "description": "Low in progress", "priority": "low", "status": "in_progress"})
        
        # Filter by high priority AND todo status
        response = client.get("/tasks/?priority=high&status=todo")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1
        assert data["data"][0]["title"] == "High Todo"
        assert data["data"][0]["priority"] == "high"
        assert data["data"][0]["status"] == "todo"
        
        # Filter by low priority AND in_progress status
        response = client.get("/tasks/?priority=low&status=in_progress")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 1
        assert data["data"][0]["title"] == "Low In Progress"
        assert data["data"][0]["priority"] == "low"
        assert data["data"][0]["status"] == "in_progress"
    
    def test_get_tasks_pagination_with_filters(self, client):
        """Test pagination combined with filters."""
        # Create multiple tasks with same priority
        for i in range(4):
            client.post(
                "/tasks/",
                json={
                    "title": f"Task {i+1}",
                    "description": f"Description {i+1}",
                    "priority": "high",
                    "status": "todo"
                }
            )
        
        # Test pagination with priority filter
        response = client.get("/tasks/?priority=high&limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 2
        assert data["has_more"] is True
        assert data["next_cursor"] is not None
        
        # Get next page with same filter
        next_cursor = data["next_cursor"]
        response = client.get(f"/tasks/?priority=high&cursor={next_cursor}&limit=2")
        assert response.status_code == 200
        data2 = response.json()
        assert len(data2["data"]) == 2
        assert data2["has_more"] is False
    
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


class TestTaskRepository:
    """Unit tests for TaskRepository methods."""

    @pytest.fixture
    def repository(self, test_engine):
        """Create repository instance with test database."""
        from app.modules.tasks.repository import TaskRepository
        
        TestingSessionLocal = sessionmaker(bind=test_engine)
        db = TestingSessionLocal()
        try:
            yield TaskRepository(db)
        finally:
            db.close()

    def test_get_list_with_datetime_filters(self, repository):
        """Test datetime filtering in get_list method."""
        from datetime import timedelta
        
        owner_id = "test-user-id"
        
        # Create task 1 - older (2 days ago)
        task1_data = TaskCreate(title="Old Task", description="Old", priority="high", status="todo")
        task1 = repository.create(task1_data, owner_id)
        
        # Manually set timestamps for task1
        old_created = datetime.now() - timedelta(days=2)
        old_updated = datetime.now() - timedelta(days=1)
        repository.db.query(Task).filter(Task.id == task1.id).update({
            'created_at': old_created,
            'updated_at': old_updated
        })
        repository.db.commit()
        
        # Create task 2 - newer (now)
        task2_data = TaskCreate(title="New Task", description="New", priority="high", status="todo")
        task2 = repository.create(task2_data, owner_id)
        
        # Use yesterday as the filter time
        filter_time = datetime.now() - timedelta(days=1)
        
        # Test created_after filter (should return only task2)
        filters = TaskFilter(created_after=filter_time)
        tasks, cursor, has_more = repository.get_list(owner_id, filters=filters)
        assert len(tasks) == 1
        assert tasks[0].title == "New Task"
        
        # Test created_before filter (should return only task1)
        filters = TaskFilter(created_before=filter_time)
        tasks, cursor, has_more = repository.get_list(owner_id, filters=filters)
        assert len(tasks) == 1
        assert tasks[0].title == "Old Task"
        
        # Test updated_after filter (should return only task2)
        filters = TaskFilter(updated_after=filter_time)
        tasks, cursor, has_more = repository.get_list(owner_id, filters=filters)
        assert len(tasks) == 1
        assert tasks[0].title == "New Task"
        
        # Test updated_before filter (should return only task1)
        filters = TaskFilter(updated_before=filter_time)
        tasks, cursor, has_more = repository.get_list(owner_id, filters=filters)
        assert len(tasks) == 1
        assert tasks[0].title == "Old Task"

    def test_update_nonexistent_task(self, repository):
        """Test updating a task that doesn't exist."""
        
        owner_id = "test-user-id"
        update_data = TaskUpdate(title="Updated Title")
        
        result = repository.update("nonexistent-id", update_data, owner_id)
        assert result is None

    def test_delete_nonexistent_task(self, repository):
        """Test deleting a task that doesn't exist."""
        owner_id = "test-user-id"
        
        result = repository.delete("nonexistent-id", owner_id)
        assert result is False


class TestTaskService:
    """Unit tests for TaskService methods."""

    @pytest.fixture
    def service(self, test_engine):
        """Create service instance with test database."""
        from app.modules.tasks.repository import TaskRepository
        from app.modules.tasks.service import TaskService
        from sqlalchemy.orm import sessionmaker
        
        TestingSessionLocal = sessionmaker(bind=test_engine)
        db = TestingSessionLocal()
        try:
            repository = TaskRepository(db)
            yield TaskService(repository)
        finally:
            db.close()

    def test_get_task_empty_task_id(self, service):
        """Test get_task with empty task_id raises validation error."""
        
        owner_id = "test-user-id"
        
        with pytest.raises(HTTPException) as exc_info:
            service.get_task("", owner_id)
        
        assert exc_info.value.status_code == 400
        assert exc_info.value.detail == "Task ID is required"

    def test_get_list_empty_owner_id(self, service):
        """Test get_list with empty owner_id raises validation error."""
        
        pagination_request = TaskPaginationRequest()
        
        with pytest.raises(HTTPException) as exc_info:
            service.get_list("", pagination_request)
        
        assert exc_info.value.status_code == 400
        assert exc_info.value.detail == "Owner ID is required"

    def test_update_task_empty_task_id(self, service):
        """Test update_task with empty task_id raises validation error."""
        
        owner_id = "test-user-id"
        update_data = TaskUpdate(title="Updated Title")
        
        with pytest.raises(HTTPException) as exc_info:
            service.update_task("", update_data, owner_id)
        
        assert exc_info.value.status_code == 400
        assert exc_info.value.detail == "Task ID is required"

    def test_delete_task_empty_task_id(self, service):
        """Test delete_task with empty task_id raises validation error."""
        
        owner_id = "test-user-id"
        
        with pytest.raises(HTTPException) as exc_info:
            service.delete_task("", owner_id)
        
        assert exc_info.value.status_code == 400
        assert exc_info.value.detail == "Task ID is required"


class TestCsvImportExport:
    """Test CSV import/export functionality."""

    def test_export_tasks_csv_success(self, client):
        """Test successful CSV export of tasks."""
        # Create some test tasks
        tasks_data = [
            {"title": "Task 1", "description": "Description 1", "priority": "high", "status": "todo"},
            {"title": "Task 2", "description": "Description 2", "priority": "low", "status": "in_progress"},
        ]
        
        for task_data in tasks_data:
            client.post("/tasks/", json=task_data)
        
        # Export tasks to CSV
        response = client.get("/tasks/export/csv")
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"
        assert "attachment; filename=tasks.csv" in response.headers["content-disposition"]
        
        # Parse CSV content
        csv_content = response.text
        lines = csv_content.strip().split('\n')
        
        # Check header (handle both Unix and Windows line endings)
        header_line = lines[0].replace('\r', '')
        assert header_line == "id,title,description,status,priority,created_at,updated_at,owner_id"
        
        # Check we have 2 data rows + 1 header row
        assert len(lines) == 3
        
        # Parse first data row
        import csv
        reader = csv.DictReader(io.StringIO(csv_content))
        rows = list(reader)
        
        assert len(rows) == 2
        assert rows[0]["title"] == "Task 1"
        assert rows[0]["description"] == "Description 1"
        assert rows[0]["status"] == "todo"
        assert rows[0]["priority"] == "high"
        assert "id" in rows[0]
        assert "created_at" in rows[0]
        assert "updated_at" in rows[0]

    def test_export_tasks_csv_filtered(self, client):
        """Test CSV export with filters."""
        # Create tasks with different statuses
        client.post("/tasks/", json={"title": "Todo Task", "description": "Todo", "priority": "high", "status": "todo"})
        client.post("/tasks/", json={"title": "Done Task", "description": "Done", "priority": "high", "status": "done"})
        
        # Export only todo tasks
        response = client.get("/tasks/export/csv?status=todo")
        
        assert response.status_code == 200
        
        # Parse CSV and check only todo task is exported
        import csv
        reader = csv.DictReader(io.StringIO(response.text))
        rows = list(reader)
        
        assert len(rows) == 1
        assert rows[0]["title"] == "Todo Task"
        assert rows[0]["status"] == "todo"

    def test_import_tasks_csv_success(self, client):
        """Test successful CSV import."""
        # Create CSV content
        csv_content = """title,description,status,priority
Task from CSV,Description from CSV,in_progress,high
Another Task,,todo,medium"""
        
        # Create CSV file
        csv_file = io.BytesIO(csv_content.encode('utf-8'))
        csv_file.name = "test.csv"
        
        # Mock the file upload
        files = {"file": ("test.csv", csv_file, "text/csv")}
        
        response = client.post("/tasks/import/csv", files=files)
        
        assert response.status_code == 202
        data = response.json()
        
        # Verify response matches TaskImportResponse schema
        assert "message" in data
        assert "status" in data
        assert "filename" in data
        assert data["message"] == "CSV import started"
        assert data["status"] == "processing"
        assert data["filename"] == "test.csv"

    def test_import_tasks_csv_invalid_file_type(self, client):
        """Test CSV import with invalid file type."""
        # Create non-CSV file content
        file_content = b"This is not a CSV file"
        
        files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
        
        response = client.post("/tasks/import/csv", files=files)
        
        assert response.status_code == 400
        # Verify error message from TaskFileUpload validation
        assert "File must be a CSV file" in response.json()["detail"]

    def test_export_tasks_csv_empty_result(self, client):
        """Test CSV export when no tasks exist."""
        response = client.get("/tasks/export/csv")
        
        assert response.status_code == 200
        
        # Should only have header row
        lines = response.text.strip().split('\n')
        assert len(lines) == 1  # Only header
        header_line = lines[0].replace('\r', '')
        assert header_line == "id,title,description,status,priority,created_at,updated_at,owner_id"