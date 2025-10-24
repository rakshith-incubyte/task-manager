import { describe, it, expect, beforeEach } from '@jest/globals'
import { TaskExporter } from '../task-exporter'
import { TaskImporter } from '../task-importer'
import { Task } from '../api-client'

describe('TaskExporter', () => {
  let exporter: TaskExporter
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
    {
      id: '2',
      title: 'Test Task 2',
      description: null,
      status: 'in_progress',
      priority: 'medium',
      owner_id: 'user-1',
      created_at: '2025-01-02T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
    },
  ]

  beforeEach(() => {
    exporter = new TaskExporter()
  })

  describe('exportToJSON', () => {
    it('should export tasks to JSON format', () => {
      const result = exporter.exportToJSON(mockTasks)
      
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      
      const parsed = JSON.parse(result)
      expect(parsed).toHaveLength(2)
      expect(parsed[0].title).toBe('Test Task 1')
    })

    it('should handle empty task array', () => {
      const result = exporter.exportToJSON([])
      
      expect(result).toBe('[]')
    })

    it('should preserve all task properties', () => {
      const result = exporter.exportToJSON(mockTasks)
      const parsed = JSON.parse(result)
      
      expect(parsed[0]).toHaveProperty('id')
      expect(parsed[0]).toHaveProperty('title')
      expect(parsed[0]).toHaveProperty('description')
      expect(parsed[0]).toHaveProperty('status')
      expect(parsed[0]).toHaveProperty('priority')
    })
  })

  describe('exportToCSV', () => {
    it('should export tasks to CSV format', () => {
      const result = exporter.exportToCSV(mockTasks)
      
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result).toContain('id,title,description,status,priority')
      expect(result).toContain('Test Task 1')
      expect(result).toContain('Test Task 2')
    })

    it('should handle empty task array', () => {
      const result = exporter.exportToCSV([])
      
      expect(result).toBe('id,title,description,status,priority,created_at,updated_at\n')
    })

    it('should escape CSV special characters', () => {
      const tasksWithSpecialChars: Task[] = [{
        ...mockTasks[0],
        title: 'Task with "quotes"',
        description: 'Description with, comma',
      }]
      
      const result = exporter.exportToCSV(tasksWithSpecialChars)
      
      expect(result).toContain('"Task with ""quotes"""')
      expect(result).toContain('"Description with, comma"')
    })

    it('should handle null descriptions', () => {
      const result = exporter.exportToCSV(mockTasks)
      
      expect(result).toContain('Test Task 2,,in_progress')
    })
  })

  describe('downloadFile', () => {
    it('should create a download link with correct attributes', () => {
      const createElementSpy = jest.spyOn(document, 'createElement')
      const clickSpy = jest.fn()
      
      const mockLink = {
        href: '',
        download: '',
        click: clickSpy,
        remove: jest.fn(),
      } as any
      
      createElementSpy.mockReturnValue(mockLink)
      
      exporter.downloadFile('test content', 'test.json', 'application/json')
      
      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(mockLink.download).toBe('test.json')
      expect(clickSpy).toHaveBeenCalled()
      
      createElementSpy.mockRestore()
    })
  })
})

describe('TaskImporter', () => {
  let importer: TaskImporter

  beforeEach(() => {
    importer = new TaskImporter()
  })

  describe('importFromJSON', () => {
    it('should import tasks from valid JSON', () => {
      const jsonData = JSON.stringify([
        {
          id: '1',
          title: 'Imported Task',
          description: 'Test',
          status: 'todo',
          priority: 'high',
          owner_id: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ])
      
      const result = importer.importFromJSON(jsonData)
      
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Imported Task')
    })

    it('should throw error for invalid JSON', () => {
      expect(() => {
        importer.importFromJSON('invalid json')
      }).toThrow('Invalid JSON format')
    })

    it('should validate required task fields', () => {
      const invalidData = JSON.stringify([
        {
          id: '1',
          // missing title
          status: 'todo',
        },
      ])
      
      expect(() => {
        importer.importFromJSON(invalidData)
      }).toThrow('Invalid task data')
    })

    it('should validate task status values', () => {
      const invalidData = JSON.stringify([
        {
          id: '1',
          title: 'Test',
          description: null,
          status: 'invalid_status',
          priority: 'high',
          owner_id: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ])
      
      expect(() => {
        importer.importFromJSON(invalidData)
      }).toThrow('Invalid task data')
    })

    it('should validate task priority values', () => {
      const invalidData = JSON.stringify([
        {
          id: '1',
          title: 'Test',
          description: null,
          status: 'todo',
          priority: 'invalid_priority',
          owner_id: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ])
      
      expect(() => {
        importer.importFromJSON(invalidData)
      }).toThrow('Invalid task data')
    })
  })

  describe('importFromCSV', () => {
    it('should import tasks from valid CSV', () => {
      const csvData = `id,title,description,status,priority,created_at,updated_at
1,Test Task,Test Description,todo,high,2025-01-01T00:00:00Z,2025-01-01T00:00:00Z`
      
      const result = importer.importFromCSV(csvData)
      
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Test Task')
      expect(result[0].description).toBe('Test Description')
    })

    it('should handle CSV with quoted fields', () => {
      const csvData = `id,title,description,status,priority,created_at,updated_at
1,"Task with, comma","Description with ""quotes""",todo,high,2025-01-01T00:00:00Z,2025-01-01T00:00:00Z`
      
      const result = importer.importFromCSV(csvData)
      
      expect(result[0].title).toBe('Task with, comma')
      expect(result[0].description).toBe('Description with "quotes"')
    })

    it('should handle empty descriptions in CSV', () => {
      const csvData = `id,title,description,status,priority,created_at,updated_at
1,Test Task,,todo,high,2025-01-01T00:00:00Z,2025-01-01T00:00:00Z`
      
      const result = importer.importFromCSV(csvData)
      
      expect(result[0].description).toBeNull()
    })

    it('should throw error for CSV without headers', () => {
      const csvData = '1,Test Task,Description,todo,high'
      
      expect(() => {
        importer.importFromCSV(csvData)
      }).toThrow('Invalid CSV format')
    })

    it('should throw error for CSV with missing required columns', () => {
      const csvData = `id,title
1,Test Task`
      
      expect(() => {
        importer.importFromCSV(csvData)
      }).toThrow('Invalid CSV format')
    })
  })
})
