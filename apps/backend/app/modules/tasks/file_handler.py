"""
File handler for task import/export operations.

This module handles CSV file operations for tasks, following SRP.
"""

import csv
import io
from typing import Generator

from app.modules.tasks.schemas import TaskCreate, TaskResponse


class TaskFileHandler:
    """Handle file operations for tasks (CSV import/export)."""

    @staticmethod
    def export_to_csv(tasks: list[TaskResponse]) -> str:
        """
        Export tasks to CSV format.
        
        Args:
            tasks: List of task responses to export
            
        Returns:
            CSV content as string
        """
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'id', 'title', 'description', 'status', 'priority', 
            'created_at', 'updated_at', 'owner_id'
        ])
        
        # Write task data
        for task in tasks:
            writer.writerow([
                task.id,
                task.title,
                task.description or '',
                task.status.value,
                task.priority.value,
                task.created_at.isoformat(),
                task.updated_at.isoformat(),
                task.owner_id
            ])
        
        return output.getvalue()

    @staticmethod
    def parse_csv(csv_content: bytes) -> Generator[dict, None, None]:
        """
        Parse CSV content and yield row dictionaries.
        
        Args:
            csv_content: Raw CSV file content as bytes
            
        Yields:
            Dictionary for each CSV row
            
        Raises:
            ValueError: If CSV content is invalid
        """
        try:
            # Decode CSV content
            csv_text = csv_content.decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(csv_text))
            
            for row in csv_reader:
                yield row
                
        except UnicodeDecodeError as e:
            raise ValueError(f"Invalid CSV encoding: {str(e)}")
        except Exception as e:
            raise ValueError(f"Failed to parse CSV: {str(e)}")

    @staticmethod
    def validate_csv_row(row: dict) -> bool:
        """
        Validate a CSV row has required fields.
        
        Args:
            row: Dictionary representing a CSV row
            
        Returns:
            True if row is valid, False otherwise
        """
        # Check required field
        if not row.get('title', '').strip():
            return False
        
        return True

    @staticmethod
    def row_to_task_create(row: dict) -> TaskCreate:
        """
        Convert CSV row to TaskCreate schema.
        
        Args:
            row: Dictionary representing a CSV row
            
        Returns:
            TaskCreate instance
            
        Raises:
            ValueError: If row data is invalid
        """
        try:
            return TaskCreate(
                title=row['title'].strip(),
                description=row.get('description', '').strip() or None,
                status=row.get('status', 'todo').strip(),
                priority=row.get('priority', 'medium').strip()
            )
        except Exception as e:
            raise ValueError(f"Invalid task data: {str(e)}")
