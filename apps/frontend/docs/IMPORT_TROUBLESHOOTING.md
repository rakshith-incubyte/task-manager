# Import Troubleshooting Guide

## Issue: Import Not Working

If the import functionality is not working, follow these debugging steps:

### Step 1: Check Browser Console

Open your browser's Developer Tools (F12) and check the Console tab. You should see detailed logging:

```
Import started: tasks-2025-10-23.json application/json 1234
Reading file: tasks-2025-10-23.json
FileReader.readAsText called
FileReader onload triggered
File read successfully, content length: 1234
TaskImporter.importFromFile called with: tasks-2025-10-23.json application/json
File content read, length: 1234
File extension: json
Importing as JSON
Tasks imported successfully: 5 [...]
New tasks after deduplication: 5
```

### Step 2: Common Issues and Solutions

#### Issue: No console logs appear
**Problem**: The import button click handler is not being called
**Solution**: 
- Check if `onImport` prop is passed to `TaskToolbar`
- Verify the file input is properly wired up
- Check browser console for JavaScript errors

#### Issue: "FileReader error" in console
**Problem**: Browser cannot read the file
**Solution**:
- Check file permissions
- Try a different file
- Ensure file is not corrupted
- Try a different browser

#### Issue: "Invalid JSON format" error
**Problem**: JSON file is malformed
**Solution**:
- Validate JSON at https://jsonlint.com/
- Ensure proper JSON structure:
```json
[
  {
    "id": "1",
    "title": "Task",
    "description": "Description",
    "status": "todo",
    "priority": "high",
    "owner_id": "user-1",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

#### Issue: "Invalid CSV format" error
**Problem**: CSV file is missing required columns
**Solution**:
- Ensure CSV has all required headers:
  ```csv
  id,title,description,status,priority,created_at,updated_at
  ```
- Check for typos in header names
- Ensure no extra spaces in headers

#### Issue: "Invalid task data" error
**Problem**: Task validation failed
**Solution**:
- Check that `status` is one of: `todo`, `in_progress`, `done`
- Check that `priority` is one of: `low`, `medium`, `high`
- Ensure `id` and `title` are non-empty strings
- Verify date format is ISO 8601: `YYYY-MM-DDTHH:mm:ss.sssZ`

#### Issue: "All tasks in the file already exist"
**Problem**: Tasks have duplicate IDs
**Solution**:
- This is expected behavior if you're importing the same file twice
- Tasks are deduplicated by ID
- If you want to re-import, change the task IDs in the file

#### Issue: Import button is disabled
**Problem**: `isImporting` state is stuck as `true`
**Solution**:
- Refresh the page
- Check for errors in previous import attempts
- Clear browser cache

### Step 3: Test with Sample Files

#### Sample JSON File (tasks-sample.json)
```json
[
  {
    "id": "test-1",
    "title": "Test Task 1",
    "description": "This is a test task",
    "status": "todo",
    "priority": "high",
    "owner_id": "user-123",
    "created_at": "2025-10-23T00:00:00Z",
    "updated_at": "2025-10-23T00:00:00Z"
  },
  {
    "id": "test-2",
    "title": "Test Task 2",
    "description": null,
    "status": "in_progress",
    "priority": "medium",
    "owner_id": "user-123",
    "created_at": "2025-10-23T00:00:00Z",
    "updated_at": "2025-10-23T00:00:00Z"
  }
]
```

#### Sample CSV File (tasks-sample.csv)
```csv
id,title,description,status,priority,created_at,updated_at
test-1,Test Task 1,This is a test task,todo,high,2025-10-23T00:00:00Z,2025-10-23T00:00:00Z
test-2,Test Task 2,,in_progress,medium,2025-10-23T00:00:00Z,2025-10-23T00:00:00Z
```

### Step 4: Verify File Input Element

Check that the hidden file input exists in the DOM:

```javascript
// In browser console
document.querySelector('input[type="file"][accept=".json,.csv"]')
// Should return: <input type="file" accept=".json,.csv" ...>
```

### Step 5: Manual Testing

Test the import functionality manually in the browser console:

```javascript
// Get the TaskImporter instance
import { TaskImporter } from '@/lib/task-importer'

const importer = new TaskImporter()

// Test JSON import
const jsonData = '[{"id":"1","title":"Test","description":null,"status":"todo","priority":"high","owner_id":"user-1","created_at":"2025-01-01T00:00:00Z","updated_at":"2025-01-01T00:00:00Z"}]'
const tasks = importer.importFromJSON(jsonData)
console.log('Imported tasks:', tasks)
```

### Step 6: Check Network Tab

If tasks are being imported but not saved:
1. Open Network tab in DevTools
2. Try importing a file
3. Look for API calls to save tasks
4. Check for errors in the API responses

### Step 7: React DevTools

Use React DevTools to inspect component state:
1. Install React DevTools extension
2. Open Components tab
3. Find `TaskList` component
4. Check `tasks` state before and after import
5. Verify `isImporting` state changes correctly

## Still Having Issues?

If none of the above solutions work:

1. **Clear browser cache and reload**
2. **Try incognito/private mode**
3. **Test in a different browser**
4. **Check browser version** (requires modern browser with FileReader API)
5. **Disable browser extensions** that might interfere
6. **Check for Content Security Policy** violations in console

## Reporting Bugs

When reporting import issues, please include:

1. Browser and version
2. Operating system
3. File format (JSON or CSV)
4. Sample file content (sanitized)
5. Full error message from console
6. Console logs from the debugging steps above
7. Screenshots if applicable

## Technical Details

### Browser Compatibility

The import feature requires:
- FileReader API (supported in all modern browsers)
- Blob API
- Promise support

Minimum browser versions:
- Chrome 76+
- Firefox 69+
- Safari 13+
- Edge 79+

### File Size Limits

- Maximum recommended file size: 10MB
- Large files may cause browser to freeze temporarily
- For very large imports, consider splitting into multiple files

### Security Considerations

- Files are processed entirely in the browser (client-side)
- No data is sent to external servers during import
- File content is validated before processing
- Malicious files cannot execute code (only data is parsed)
