"""
Task-specific background job handlers.

This module contains task-specific background operations that use
the core BackgroundProcessor for execution.
"""

from app.core.background_processor import BackgroundProcessor
from app.modules.tasks.interfaces import TaskServiceProtocol
from app.modules.tasks.schemas import TaskImportResult


class TaskBackgroundTasks:
    """Task-specific background operations."""

    @staticmethod
    @BackgroundProcessor.with_error_handling
    def process_csv_import(
        csv_content: bytes, 
        owner_id: str, 
        task_service: TaskServiceProtocol
    ) -> TaskImportResult:
        """
        Process CSV import in background.
        
        Args:
            csv_content: Raw CSV file content as bytes
            owner_id: ID of the user importing tasks
            task_service: Task service instance
            
        Returns:
            TaskImportResult with success/error counts
        """
        # Process CSV using service method
        result = task_service.import_tasks_csv(csv_content, owner_id)
        
        # Log completion details
        print(f"CSV import completed: {result.success_count} success, {result.error_count} errors")
        
        return result


