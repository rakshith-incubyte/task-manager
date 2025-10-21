"""Unit tests for TaskFileHandler."""

import pytest
from datetime import datetime

from app.modules.tasks.file_handler import TaskFileHandler
from app.modules.tasks.schemas import TaskCreate, TaskResponse
from app.modules.tasks.models import TaskStatus, TaskPriority


class TestTaskFileHandler:
    """Test TaskFileHandler CSV operations."""

    def test_export_to_csv_success(self):
        """Test successful CSV export."""
        # Create sample tasks
        tasks = [
            TaskResponse(
                id="task-1",
                title="Task 1",
                description="Description 1",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                owner_id="user-1",
                created_at=datetime(2025, 1, 1, 12, 0, 0),
                updated_at=datetime(2025, 1, 1, 12, 0, 0)
            ),
            TaskResponse(
                id="task-2",
                title="Task 2",
                description="Description 2",
                status=TaskStatus.IN_PROGRESS,
                priority=TaskPriority.LOW,
                owner_id="user-1",
                created_at=datetime(2025, 1, 2, 12, 0, 0),
                updated_at=datetime(2025, 1, 2, 12, 0, 0)
            )
        ]
        
        # Export to CSV
        csv_content = TaskFileHandler.export_to_csv(tasks)
        
        # Verify CSV content
        lines = csv_content.strip().split('\n')
        assert len(lines) == 3  # Header + 2 tasks
        
        # Check header
        header = lines[0].replace('\r', '')
        assert header == "id,title,description,status,priority,created_at,updated_at,owner_id"
        
        # Check first task
        assert "task-1" in lines[1]
        assert "Task 1" in lines[1]
        assert "Description 1" in lines[1]

    def test_export_to_csv_empty_list(self):
        """Test CSV export with empty task list."""
        csv_content = TaskFileHandler.export_to_csv([])
        
        lines = csv_content.strip().split('\n')
        assert len(lines) == 1  # Only header
        
        header = lines[0].replace('\r', '')
        assert header == "id,title,description,status,priority,created_at,updated_at,owner_id"

    def test_parse_csv_success(self):
        """Test successful CSV parsing."""
        csv_content = b"""title,description,status,priority
Task 1,Description 1,todo,high
Task 2,Description 2,in_progress,low"""
        
        rows = list(TaskFileHandler.parse_csv(csv_content))
        
        assert len(rows) == 2
        assert rows[0]['title'] == 'Task 1'
        assert rows[0]['description'] == 'Description 1'
        assert rows[0]['status'] == 'todo'
        assert rows[0]['priority'] == 'high'

    def test_parse_csv_invalid_encoding(self):
        """Test CSV parsing with invalid encoding."""
        # Invalid UTF-8 bytes
        csv_content = b'\xff\xfe'
        
        with pytest.raises(ValueError, match="Invalid CSV encoding"):
            list(TaskFileHandler.parse_csv(csv_content))

    def test_validate_csv_row_valid(self):
        """Test validation of valid CSV row."""
        row = {'title': 'Valid Task', 'description': 'Description'}
        
        assert TaskFileHandler.validate_csv_row(row) is True

    def test_validate_csv_row_missing_title(self):
        """Test validation of row with missing title."""
        row = {'description': 'Description'}
        
        assert TaskFileHandler.validate_csv_row(row) is False

    def test_validate_csv_row_empty_title(self):
        """Test validation of row with empty title."""
        row = {'title': '   ', 'description': 'Description'}
        
        assert TaskFileHandler.validate_csv_row(row) is False

    def test_row_to_task_create_success(self):
        """Test converting CSV row to TaskCreate."""
        row = {
            'title': 'Task Title',
            'description': 'Task Description',
            'status': 'in_progress',
            'priority': 'high'
        }
        
        task = TaskFileHandler.row_to_task_create(row)
        
        assert isinstance(task, TaskCreate)
        assert task.title == 'Task Title'
        assert task.description == 'Task Description'
        assert task.status == 'in_progress'
        assert task.priority == 'high'

    def test_row_to_task_create_with_defaults(self):
        """Test converting CSV row with default values."""
        row = {'title': 'Task Title'}
        
        task = TaskFileHandler.row_to_task_create(row)
        
        assert task.title == 'Task Title'
        assert task.description is None
        assert task.status == 'todo'
        assert task.priority == 'medium'

    def test_row_to_task_create_empty_description(self):
        """Test converting CSV row with empty description."""
        row = {
            'title': 'Task Title',
            'description': '   ',
            'status': 'todo',
            'priority': 'low'
        }
        
        task = TaskFileHandler.row_to_task_create(row)
        
        assert task.title == 'Task Title'
        assert task.description is None  # Empty string converted to None

    def test_row_to_task_create_invalid_data(self):
        """Test converting invalid CSV row."""
        row = {
            'title': 'Task Title',
            'status': 'invalid_status',  # Invalid status
            'priority': 'high'
        }
        
        with pytest.raises(ValueError, match="Invalid task data"):
            TaskFileHandler.row_to_task_create(row)

    def test_export_to_csv_with_none_description(self):
        """Test CSV export with None description."""
        tasks = [
            TaskResponse(
                id="task-1",
                title="Task 1",
                description=None,  # None description
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                owner_id="user-1",
                created_at=datetime(2025, 1, 1, 12, 0, 0),
                updated_at=datetime(2025, 1, 1, 12, 0, 0)
            )
        ]
        
        csv_content = TaskFileHandler.export_to_csv(tasks)
        
        # Should have empty string for None description
        lines = csv_content.strip().split('\n')
        assert len(lines) == 2
        # Check that description field is empty (between two commas)
        assert ',,' in lines[1] or ',"",' in lines[1]
