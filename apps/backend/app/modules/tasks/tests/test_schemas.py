"""Unit tests for task schemas."""

import pytest
from unittest.mock import Mock
from fastapi import UploadFile

from app.modules.tasks.schemas import TaskFileUpload


class TestTaskFileUpload:
    """Test TaskFileUpload schema validation."""

    def test_validate_csv_file_success(self):
        """Test validation of valid CSV file."""
        # Create mock UploadFile
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "tasks.csv"
        mock_file.content_type = "text/csv"
        
        # Should not raise any exception
        TaskFileUpload.validate_csv_file(mock_file)

    def test_validate_csv_file_with_application_csv(self):
        """Test validation with application/csv content type."""
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "tasks.csv"
        mock_file.content_type = "application/csv"
        
        # Should not raise any exception
        TaskFileUpload.validate_csv_file(mock_file)

    def test_validate_csv_file_no_content_type(self):
        """Test validation when content_type is None."""
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "tasks.csv"
        mock_file.content_type = None
        
        # Should not raise any exception (only checks filename)
        TaskFileUpload.validate_csv_file(mock_file)

    def test_validate_csv_file_invalid_extension(self):
        """Test validation fails for non-CSV extension."""
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "tasks.txt"
        mock_file.content_type = "text/plain"
        
        with pytest.raises(ValueError, match="File must be a CSV file"):
            TaskFileUpload.validate_csv_file(mock_file)

    def test_validate_csv_file_invalid_content_type(self):
        """Test validation fails for invalid content type."""
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "tasks.csv"
        mock_file.content_type = "application/json"
        
        with pytest.raises(ValueError, match="Invalid content type"):
            TaskFileUpload.validate_csv_file(mock_file)

    def test_validate_csv_file_xlsx_extension(self):
        """Test validation fails for Excel files."""
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "tasks.xlsx"
        mock_file.content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        
        with pytest.raises(ValueError, match="File must be a CSV file"):
            TaskFileUpload.validate_csv_file(mock_file)

    def test_validate_csv_file_no_extension(self):
        """Test validation fails for files without extension."""
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "tasks"
        mock_file.content_type = "text/csv"
        
        with pytest.raises(ValueError, match="File must be a CSV file"):
            TaskFileUpload.validate_csv_file(mock_file)

    def test_validate_csv_file_case_sensitive(self):
        """Test validation is case-sensitive for extension."""
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "tasks.CSV"
        mock_file.content_type = "text/csv"
        
        # Should fail because .CSV != .csv
        with pytest.raises(ValueError, match="File must be a CSV file"):
            TaskFileUpload.validate_csv_file(mock_file)
