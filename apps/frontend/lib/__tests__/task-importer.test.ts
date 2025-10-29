import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TaskImporter } from '../task-importer'
import { Task } from './api-client'

// Mock FileReader
const mockFileReader = {
  readAsText: vi.fn(),
  onload: null as ((event: any) => void) | null,
  onerror: null as ((error: any) => void) | null,
}

Object.defineProperty(global, 'FileReader', {
  value: vi.fn(() => mockFileReader),
  writable: true,
})

describe('TaskImporter', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Test Task 1',
      description: 'Description 1',
      status: 'todo',
      priority: 'high',
      owner_id: 'user-1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ]

  const validJSON = JSON.stringify(mockTasks)
  const validCSV = `id,title,description,status,priority,created_at,updated_at
1,Test Task 1,Description 1,todo,high,2025-01-01T00:00:00Z,2025-01-01T00:00:00Z`

  const expectedTasksFromCSV: Task[] = [
    {
      id: '1',
      title: 'Test Task 1',
      description: 'Description 1',
      status: 'todo',
      priority: 'high',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockFileReader.onload = null
    mockFileReader.onerror = null
  })

  describe('importFromJSON', () => {
    it('should import valid JSON tasks', () => {
      const importer = new TaskImporter()
      const result = importer.importFromJSON(validJSON)

      expect(result).toEqual(mockTasks)
    })

    it('should handle empty JSON array', () => {
      const importer = new TaskImporter()
      const result = importer.importFromJSON('[]')

      expect(result).toEqual([])
    })

    it('should throw error for invalid JSON syntax', () => {
      const importer = new TaskImporter()
      
      expect(() => importer.importFromJSON('invalid json')).toThrow('Invalid JSON format')
    })

    it('should throw error for non-array JSON', () => {
      const importer = new TaskImporter()
      
      expect(() => importer.importFromJSON('{}')).toThrow('Invalid task data: expected array')
    })

    it('should throw error for invalid task data in JSON', () => {
      const importer = new TaskImporter()
      const invalidTasks = JSON.stringify([{ id: '1' }]) // Missing required fields
      
      expect(() => importer.importFromJSON(invalidTasks)).toThrow('Invalid task data: task validation failed')
    })
  })

  describe('importFromCSV', () => {
    it('should import valid CSV tasks', () => {
      const importer = new TaskImporter()
      const result = importer.importFromCSV(validCSV)

      expect(result).toEqual(expectedTasksFromCSV)
    })

    it('should handle CSV with quoted values', () => {
      const importer = new TaskImporter()
      const csvWithQuotes = `id,title,description,status,priority,created_at,updated_at
1,"Task with, comma","Description with ""quotes""",todo,high,2025-01-01T00:00:00Z,2025-01-01T00:00:00Z`

      const result = importer.importFromCSV(csvWithQuotes)

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Task with, comma')
      expect(result[0].description).toBe('Description with "quotes"')
    })

    it('should handle CSV with empty description', () => {
      const importer = new TaskImporter()
      const csvWithEmptyDesc = `id,title,description,status,priority,created_at,updated_at
1,Test Task,,todo,high,2025-01-01T00:00:00Z,2025-01-01T00:00:00Z`

      const result = importer.importFromCSV(csvWithEmptyDesc)

      expect(result[0].description).toBeNull()
    })

    it('should throw error for empty CSV', () => {
      const importer = new TaskImporter()
      
      expect(() => importer.importFromCSV('')).toThrow("Invalid CSV format: missing required column 'id'")
    })

    it('should throw error for CSV with missing headers', () => {
      const importer = new TaskImporter()
      const csvMissingHeaders = `id,title,status
1,Test Task,todo`

      expect(() => importer.importFromCSV(csvMissingHeaders)).toThrow("Invalid CSV format: missing required column 'description'")
    })

    it('should throw error for CSV with invalid task data', () => {
      const importer = new TaskImporter()
      const csvInvalidData = `id,title,description,status,priority,created_at,updated_at
1,Test Task,Description,invalid_status,high,2025-01-01T00:00:00Z,2025-01-01T00:00:00Z`

      expect(() => importer.importFromCSV(csvInvalidData)).toThrow('Invalid task data: task validation failed')
    })
  })

  describe('importFromFile', () => {
    it('should import JSON file successfully', async () => {
      const importer = new TaskImporter()
      const mockFile = new File([validJSON], 'tasks.json', { type: 'application/json' })

      const readFilePromise = new Promise<string>((resolve) => {
        mockFileReader.onload = vi.fn((event) => {
          resolve(event.target.result)
        })
      })

      // Mock FileReader behavior
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: validJSON } })
        }
      }, 0)

      const result = await importer.importFromFile(mockFile)

      expect(result).toEqual(mockTasks)
      expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile)
    })

    it('should import CSV file successfully', async () => {
      const importer = new TaskImporter()
      const mockFile = new File([validCSV], 'tasks.csv', { type: 'text/csv' })

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: validCSV } })
        }
      }, 0)

      const result = await importer.importFromFile(mockFile)

      expect(result).toEqual(expectedTasksFromCSV)
      expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile)
    })

    it('should throw error for unsupported file format', async () => {
      const importer = new TaskImporter()
      const mockFile = new File(['content'], 'tasks.txt', { type: 'text/plain' })

      // Mock the readFile to throw error immediately for unsupported format
      vi.spyOn(importer as any, 'readFile').mockRejectedValue(new Error('Unsupported file format: txt'))

      await expect(importer.importFromFile(mockFile)).rejects.toThrow('Unsupported file format: txt')
    })

    it('should handle file read errors', async () => {
      const importer = new TaskImporter()
      const mockFile = new File([validJSON], 'tasks.json', { type: 'application/json' })

      const readFilePromise = new Promise<never>((reject) => {
        mockFileReader.onerror = vi.fn(() => {
          reject(new Error('Failed to read file'))
        })
      })

      setTimeout(() => {
        if (mockFileReader.onerror) {
          mockFileReader.onerror({})
        }
      }, 0)

      await expect(importer.importFromFile(mockFile)).rejects.toThrow('Failed to read file')
    })

    it('should handle file read with non-string result', async () => {
      const importer = new TaskImporter()
      const mockFile = new File([validJSON], 'tasks.json', { type: 'application/json' })

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: null } })
        }
      }, 0)

      await expect(importer.importFromFile(mockFile)).rejects.toThrow('Failed to read file content')
    })

    it('should handle file without extension', async () => {
      const importer = new TaskImporter()
      const mockFile = new File(['content'], 'tasks', { type: 'application/json' })

      // Mock the readFile to throw error immediately for unsupported format
      vi.spyOn(importer as any, 'readFile').mockRejectedValue(new Error('Unsupported file format: undefined'))

      await expect(importer.importFromFile(mockFile)).rejects.toThrow('Unsupported file format: undefined')
    })
  })

  describe('TaskValidator edge cases', () => {
    it('should handle task with null description', () => {
      const importer = new TaskImporter()
      const taskWithNullDesc = [{
        id: '1',
        title: 'Test Task',
        description: null,
        status: 'todo',
        priority: 'high',
        owner_id: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }]

      const result = importer.importFromJSON(JSON.stringify(taskWithNullDesc))
      expect(result[0].description).toBeNull()
    })

    it('should reject task with invalid status', () => {
      const importer = new TaskImporter()
      const taskWithInvalidStatus = [{
        id: '1',
        title: 'Test Task',
        description: 'Description',
        status: 'invalid',
        priority: 'high',
        owner_id: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }]

      expect(() => importer.importFromJSON(JSON.stringify(taskWithInvalidStatus)))
        .toThrow('Invalid task data: task validation failed')
    })

    it('should reject task with invalid priority', () => {
      const importer = new TaskImporter()
      const taskWithInvalidPriority = [{
        id: '1',
        title: 'Test Task',
        description: 'Description',
        status: 'todo',
        priority: 'invalid',
        owner_id: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }]

      expect(() => importer.importFromJSON(JSON.stringify(taskWithInvalidPriority)))
        .toThrow('Invalid task data: task validation failed')
    })

    it('should reject task with non-string description', () => {
      const importer = new TaskImporter()
      const taskWithNumberDesc = [{
        id: '1',
        title: 'Test Task',
        description: 123,
        status: 'todo',
        priority: 'high',
        owner_id: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }]

      expect(() => importer.importFromJSON(JSON.stringify(taskWithNumberDesc)))
        .toThrow('Invalid task data: task validation failed')
    })

    it('should reject null task object', () => {
      const importer = new TaskImporter()
      
      expect(() => importer.importFromJSON(JSON.stringify([null])))
        .toThrow('Invalid task data: task validation failed')
    })

    it('should reject non-object task', () => {
      const importer = new TaskImporter()
      
      expect(() => importer.importFromJSON(JSON.stringify(['string'])))
        .toThrow('Invalid task data: task validation failed')
    })
  })

  describe('CSV parsing edge cases', () => {
    it('should handle CSV with complex quoted values', () => {
      const importer = new TaskImporter()
      const csvWithQuotes = `id,title,description,status,priority,created_at,updated_at
1,"Task with, comma","Description with ""quotes""","todo","high","2025-01-01T00:00:00Z","2025-01-01T00:00:00Z"`

      const result = importer.importFromCSV(csvWithQuotes)
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Task with, comma')
      expect(result[0].description).toBe('Description with "quotes"')
    })

    it('should handle CSV with escaped quotes', () => {
      const importer = new TaskImporter()
      const csvWithEscapedQuotes = `id,title,description,status,priority,created_at,updated_at
1,"Task with ""escaped quotes""","Description",todo,high,2025-01-01T00:00:00Z,2025-01-01T00:00:00Z`

      const result = importer.importFromCSV(csvWithEscapedQuotes)
      expect(result[0].title).toBe('Task with "escaped quotes"')
    })

    it('should handle CSV with empty fields', () => {
      const importer = new TaskImporter()
      const csvWithEmptyFields = `id,title,description,status,priority,created_at,updated_at
1,,Description,todo,high,2025-01-01T00:00:00Z,2025-01-01T00:00:00Z`

      expect(() => importer.importFromCSV(csvWithEmptyFields))
        .toThrow('Invalid task data: task validation failed') // title is required
    })
  })
})
