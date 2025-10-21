# Task Module Architecture

## Overview
This module follows SOLID principles, particularly Single Responsibility Principle (SRP), with clear separation of concerns.

## File Structure

### Core Components

#### `models.py`
- **Responsibility**: Database models and enums
- **Contains**: Task model, TaskStatus, TaskPriority enums

#### `schemas.py`
- **Responsibility**: Pydantic schemas for validation
- **Contains**: TaskCreate, TaskUpdate, TaskResponse, TaskPaginationRequest, TaskPaginationResponse, TaskFilter

#### `interfaces.py`
- **Responsibility**: Protocol definitions (contracts)
- **Contains**: TaskRepositoryProtocol, TaskServiceProtocol

#### `repository.py`
- **Responsibility**: Database operations (data access layer)
- **Contains**: TaskRepository class
- **Operations**: CRUD operations, filtering, pagination

#### `service.py`
- **Responsibility**: Business logic orchestration
- **Contains**: TaskService class
- **Operations**: Task management, validation, CSV import/export coordination

#### `router.py`
- **Responsibility**: HTTP request/response handling
- **Contains**: FastAPI route handlers
- **Operations**: Request validation, response formatting, dependency injection

### Specialized Components

#### `file_handler.py` ✨ NEW
- **Responsibility**: File operations (CSV import/export)
- **Contains**: TaskFileHandler class
- **Operations**:
  - `export_to_csv()`: Convert tasks to CSV format
  - `parse_csv()`: Parse CSV content
  - `validate_csv_row()`: Validate CSV row data
  - `row_to_task_create()`: Convert CSV row to TaskCreate schema

#### `background_tasks.py` ✨ NEW
- **Responsibility**: Task-specific background operations
- **Contains**: TaskBackgroundTasks class
- **Uses**: Core BackgroundProcessor for error handling
- **Operations**:
  - `process_csv_import()`: Handle CSV import in background

### Core Components (Reusable)

#### `app/core/background_processor.py` 🌟 CORE
- **Responsibility**: Generic background task execution framework
- **Contains**: BackgroundProcessor class
- **Reusable**: Used by all modules (tasks, users, etc.)
- **Features**:
  - Generic task execution with error handling
  - Decorator pattern for wrapping functions
  - Consistent logging across all modules

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Router Layer                         │
│  (HTTP handling, request/response, dependency injection)    │
│                      router.py                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                        Service Layer                         │
│         (Business logic, orchestration, validation)          │
│                      service.py                              │
└──────┬──────────────────────────────────────────────┬───────┘
       │                                               │
       ▼                                               ▼
┌──────────────────┐                          ┌──────────────────┐
│  File Handler    │                          │ Background Tasks │
│  (CSV ops)       │                          │ (Module-specific)│
│ file_handler.py  │                          │ background_tasks.py│
└──────────────────┘                          └────────┬─────────┘
       │                                               │
       │                                               │ Uses
       │                                               ▼
       │                                      ┌──────────────────┐
       │                                      │  Core: Background│
       │                                      │    Processor     │
       │                                      │ (Reusable across │
       │                                      │   all modules)   │
       │                                      └──────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Repository Layer                        │
│              (Database operations, data access)              │
│                     repository.py                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                       Database Layer                         │
│                  (SQLAlchemy models)                         │
│                       models.py                              │
└─────────────────────────────────────────────────────────────┘
```

## Responsibilities by Layer

### Router Layer (`router.py`)
✅ HTTP request/response handling
✅ Dependency injection
✅ Route definitions
✅ Authentication/authorization
❌ Business logic
❌ Database operations
❌ File operations

### Service Layer (`service.py`)
✅ Business logic orchestration
✅ Validation
✅ Coordinating between components
✅ Error handling
❌ HTTP concerns
❌ Direct database access
❌ File parsing logic

### Repository Layer (`repository.py`)
✅ Database CRUD operations
✅ Query building
✅ Data persistence
❌ Business logic
❌ HTTP concerns
❌ File operations

### File Handler (`file_handler.py`)
✅ CSV parsing
✅ CSV generation
✅ File format validation
✅ Data transformation (CSV ↔ Schema)
❌ Business logic
❌ Database operations
❌ HTTP concerns

### Background Tasks (`background_tasks.py`)
✅ Module-specific async operations
✅ Uses core BackgroundProcessor
✅ Task-specific business logic
❌ Generic error handling (delegated to core)
❌ HTTP concerns
❌ Direct database access

### Core Background Processor (`app/core/background_processor.py`)
✅ Generic task execution
✅ Error handling and logging
✅ Decorator pattern
✅ Reusable across all modules
❌ Module-specific logic
❌ Business logic

## Benefits of This Architecture

### 1. Single Responsibility Principle (SRP)
- Each module has one clear responsibility
- Easy to understand and maintain
- Changes are isolated to specific modules

### 2. Testability
- Each component can be tested independently
- Mock dependencies easily
- Clear unit test boundaries

### 3. Maintainability
- Easy to locate and fix bugs
- Clear separation of concerns
- Reduced coupling between components

### 4. Scalability
- Easy to add new features
- Can replace components without affecting others
- Clear extension points

### 5. Code Reusability
- File handler can be reused for other formats (JSON, XML)
- Background processor can handle other async tasks
- Service methods can be called from multiple places

## Usage Examples

### CSV Export
```python
# Router calls service
csv_content = task_service.export_tasks_csv(user_id, pagination)

# Service uses file handler
return TaskFileHandler.export_to_csv(tasks)
```

### CSV Import (Background)
```python
# Router schedules background task
background_tasks.add_task(
    TaskBackgroundProcessor.process_csv_import,
    csv_content, user_id, task_service
)

# Background processor calls service
result = task_service.import_tasks_csv(csv_content, owner_id)

# Service uses file handler
for row in TaskFileHandler.parse_csv(csv_content):
    task_data = TaskFileHandler.row_to_task_create(row)
    self.create_task(task_data, owner_id)
```

## Testing Strategy

### Unit Tests
- `test_file_handler.py`: Test CSV operations in isolation
- `test_tasks.py`: Test service and repository logic
- Each component tested independently

### Integration Tests
- Test full flow: Router → Service → Repository → Database
- Test CSV import/export end-to-end
- Test background task processing

## Future Enhancements

### Potential Additions
1. **Progress Tracking**: Add progress updates for long-running imports
2. **File Formats**: Support JSON, XML, Excel formats
3. **Validation Rules**: More sophisticated CSV validation
4. **Error Reporting**: Detailed error logs for failed imports
5. **Batch Processing**: Chunk large CSV files for better performance
6. **Webhooks**: Notify users when background tasks complete

### Extension Points
- Add new file handlers for different formats
- Add new background processors for other operations
- Add new service methods without changing existing code
