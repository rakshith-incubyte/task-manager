# Task Export/Import Feature

## Overview
The Task Export/Import feature allows users to backup their tasks and share them across different instances or users. Tasks can be exported in JSON or CSV format and imported back into the system.

## Architecture

### Design Principles
This feature follows **SOLID principles**, **DRY principles**, and **Clean Code** practices:

1. **Single Responsibility Principle (SRP)**
   - `TaskExporter`: Handles only task export operations
   - `TaskImporter`: Handles only task import operations
   - `FileDownloader`: Handles only file download operations
   - `TaskValidator`: Handles only task validation

2. **Open/Closed Principle (OCP)**
   - Export/Import strategies are extensible via interfaces
   - New formats can be added without modifying existing code

3. **Dependency Inversion Principle (DIP)**
   - Components depend on abstractions (`ExportStrategy`, `ImportStrategy`)
   - Not on concrete implementations

4. **DRY (Don't Repeat Yourself)**
   - Common validation logic is centralized in `TaskValidator`
   - CSV parsing logic is reusable
   - File reading logic is abstracted

5. **Clean Code**
   - Descriptive function and variable names
   - Small, focused functions
   - Comprehensive error handling
   - Type safety with TypeScript

### Component Structure

```
lib/
├── task-exporter.ts          # Export functionality
├── task-importer.ts          # Import functionality
└── __tests__/
    └── task-export-import.test.ts

hooks/
├── use-task-export-import.ts # Export/Import hook
└── __tests__/
    └── use-task-export-import.test.ts

components/tasks/
├── task-toolbar.tsx          # UI with export/import buttons
├── task-list.tsx             # Integration point
└── __tests__/
    └── task-toolbar.test.tsx
```

## Features

### Export
- **JSON Format**: Exports tasks as structured JSON with proper formatting
- **CSV Format**: Exports tasks as comma-separated values
  - Handles special characters (commas, quotes, newlines)
  - Escapes values properly
- **Automatic Download**: Files are automatically downloaded with timestamp
- **Filename Format**: `tasks-YYYY-MM-DD.{json|csv}`

### Import
- **JSON Import**: Validates and imports tasks from JSON files
- **CSV Import**: Parses and validates tasks from CSV files
  - Handles quoted fields
  - Supports escaped quotes
- **Validation**: Ensures all required fields are present and valid
- **Duplicate Prevention**: Filters out tasks that already exist (by ID)
- **Error Handling**: Provides clear error messages for invalid data

## Usage

### Exporting Tasks

1. Click the **Export** button in the task toolbar
2. Select format:
   - **Export as JSON**: For structured data backup
   - **Export as CSV**: For spreadsheet compatibility
3. **System fetches ALL tasks from backend API** (not just visible tasks)
4. File downloads automatically with task count in filename
5. Success notification shows total number of tasks exported

**Note**: Export fetches all tasks from the database via API, ensuring complete data backup regardless of pagination or filters.

### Importing Tasks

1. Click the **Import** button in the task toolbar
2. Select a `.json` or `.csv` file
3. System validates the file format and task data
4. **Tasks are created via API** (saved to backend database)
5. Success/error notification appears with count
6. New tasks appear in the list
7. Duplicates are skipped (based on task title)

**Note**: Import creates tasks one by one via the API. Large imports may take a few seconds.

## File Formats

### JSON Format
```json
[
  {
    "id": "task-123",
    "title": "Complete project",
    "description": "Finish the task manager feature",
    "status": "in_progress",
    "priority": "high",
    "owner_id": "user-456",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-02T00:00:00Z"
  }
]
```

### CSV Format
```csv
id,title,description,status,priority,created_at,updated_at
task-123,Complete project,Finish the task manager feature,in_progress,high,2025-01-01T00:00:00Z,2025-01-02T00:00:00Z
task-456,"Task with, comma","Description with ""quotes""",todo,medium,2025-01-01T00:00:00Z,2025-01-01T00:00:00Z
```

## Validation Rules

### Required Fields
- `id`: String (unique identifier)
- `title`: String (non-empty)
- `status`: One of `todo`, `in_progress`, `done`
- `priority`: One of `low`, `medium`, `high`

### Optional Fields
- `description`: String or null
- `owner_id`: String
- `created_at`: ISO 8601 timestamp
- `updated_at`: ISO 8601 timestamp

## Error Handling

### Export Errors
- File creation failure
- Browser download restrictions
- Empty task list (warning, not error)

### Import Errors
- **Invalid JSON**: "Invalid JSON format"
- **Invalid CSV**: "Invalid CSV format: missing required column 'X'"
- **Invalid Task Data**: "Invalid task data: task validation failed"
- **Invalid Status**: Task status must be `todo`, `in_progress`, or `done`
- **Invalid Priority**: Task priority must be `low`, `medium`, or `high`
- **Missing Required Fields**: "Invalid task data: task validation failed"

## Testing

### Test Coverage
- ✅ Export to JSON
- ✅ Export to CSV
- ✅ CSV special character escaping
- ✅ Import from JSON
- ✅ Import from CSV
- ✅ CSV quoted field parsing
- ✅ Validation of required fields
- ✅ Validation of enum values
- ✅ Error handling
- ✅ Duplicate prevention
- ✅ UI interactions

### Running Tests
```bash
# Run all tests
npm test

# Run export/import tests only
npm test task-export-import

# Run with coverage
npm test -- --coverage
```

## Future Enhancements

1. **Additional Formats**
   - Excel (.xlsx) export/import
   - XML format support

2. **Batch Operations**
   - Bulk update imported tasks
   - Merge strategies (replace vs. append)

3. **Advanced Filtering**
   - Export only selected tasks
   - Export by status/priority

4. **Cloud Sync**
   - Auto-backup to cloud storage
   - Cross-device synchronization

## API Reference

### TaskExporter

```typescript
class TaskExporter {
  exportToJSON(tasks: Task[]): string
  exportToCSV(tasks: Task[]): string
  downloadFile(content: string, filename: string, mimeType: string): void
  exportAndDownloadJSON(tasks: Task[], filename?: string): void
  exportAndDownloadCSV(tasks: Task[], filename?: string): void
}
```

### TaskImporter

```typescript
class TaskImporter {
  importFromJSON(data: string): Task[]
  importFromCSV(data: string): Task[]
  importFromFile(file: File): Promise<Task[]>
}
```

### useTaskExportImport Hook

```typescript
type UseTaskExportImportReturn = {
  isExporting: boolean
  isImporting: boolean
  exportTasks: (tasks: Task[], format: 'json' | 'csv') => void
  importTasks: (file: File) => Promise<Task[]>
  error: string | null
  clearError: () => void
}
```

## Troubleshooting

### Export not downloading
- Check browser download permissions
- Ensure pop-up blocker is disabled
- Try a different browser

### Import failing
- Verify file format matches extension
- Check file encoding (UTF-8 recommended)
- Validate JSON/CSV structure
- Ensure all required fields are present

### Duplicate tasks after import
- System automatically prevents duplicates by ID
- If seeing duplicates, tasks may have different IDs
- Check source file for duplicate IDs
