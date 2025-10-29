import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TaskExporter } from '../task-exporter'
import { Task } from './api-client'

// Mock DOM methods
const mockBlob = vi.fn()
Object.defineProperty(global, 'Blob', {
  value: mockBlob,
  writable: true,
})

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
})

// Mock document methods
const mockLink = {
  href: '',
  download: '',
  click: vi.fn(),
  remove: vi.fn(),
}

const mockCreateElement = vi.fn(() => mockLink)
Object.defineProperty(global.document, 'createElement', {
  value: mockCreateElement,
  writable: true,
})

describe('TaskExporter', () => {
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
      description: 'Description with, comma and "quotes"',
      status: 'in_progress',
      priority: 'medium',
      owner_id: 'user-2',
      created_at: '2025-01-02T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockLink.href = ''
    mockLink.download = ''
    mockBlob.mockClear()
  })

  describe('exportToJSON', () => {
    it('should export tasks to JSON format', () => {
      const exporter = new TaskExporter()
      const result = exporter.exportToJSON(mockTasks)

      expect(result).toBe(JSON.stringify(mockTasks, null, 2))
    })

    it('should export empty tasks array to JSON', () => {
      const exporter = new TaskExporter()
      const result = exporter.exportToJSON([])

      expect(result).toBe('[]')
    })
  })

  describe('exportToCSV', () => {
    it('should export tasks to CSV format', () => {
      const exporter = new TaskExporter()
      const result = exporter.exportToCSV(mockTasks)

      const expectedHeader = 'id,title,description,status,priority,created_at,updated_at'
      expect(result).toContain(expectedHeader)
      expect(result).toContain('1,Test Task 1,Description 1,todo,high,2025-01-01T00:00:00Z,2025-01-01T00:00:00Z')
      expect(result).toContain('2,Test Task 2,"Description with, comma and ""quotes""",in_progress,medium,2025-01-02T00:00:00Z,2025-01-02T00:00:00Z')
    })

    it('should export empty tasks array to CSV with headers only', () => {
      const exporter = new TaskExporter()
      const result = exporter.exportToCSV([])

      const expectedHeader = 'id,title,description,status,priority,created_at,updated_at'
      expect(result).toBe(`${expectedHeader}\n`)
    })

    it('should handle tasks with null and undefined values', () => {
      const tasksWithNulls: Task[] = [
        {
          id: '1',
          title: 'Test Task',
          description: null,
          status: 'todo',
          priority: undefined,
          owner_id: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ]

      const exporter = new TaskExporter()
      const result = exporter.exportToCSV(tasksWithNulls)

      expect(result).toContain('1,Test Task,,todo,,2025-01-01T00:00:00Z,2025-01-01T00:00:00Z')
    })

    it('should handle tasks with newlines in values', () => {
      const tasksWithNewlines: Task[] = [
        {
          id: '1',
          title: 'Test\nTask',
          description: 'Description',
          status: 'todo',
          priority: 'high',
          owner_id: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ]

      const exporter = new TaskExporter()
      const result = exporter.exportToCSV(tasksWithNewlines)

      expect(result).toContain('"Test\nTask"')
    })
  })

  describe('downloadFile', () => {
    it('should create and download file', () => {
      const exporter = new TaskExporter()
      const content = 'test content'
      const filename = 'test.txt'
      const mimeType = 'text/plain'

      exporter.downloadFile(content, filename, mimeType)

      expect(mockBlob).toHaveBeenCalledWith([content], { type: mimeType })
      expect(global.URL.createObjectURL).toHaveBeenCalled()
      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockLink.href).toBe('mock-url')
      expect(mockLink.download).toBe(filename)
      expect(mockLink.click).toHaveBeenCalled()
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url')
      expect(mockLink.remove).toHaveBeenCalled()
    })
  })

  describe('exportAndDownloadJSON', () => {
    it('should export and download tasks as JSON with default filename', () => {
      const exporter = new TaskExporter()
      const downloadFileSpy = vi.spyOn(exporter, 'downloadFile')

      exporter.exportAndDownloadJSON(mockTasks)

      expect(downloadFileSpy).toHaveBeenCalledWith(
        JSON.stringify(mockTasks, null, 2),
        'tasks.json',
        'application/json'
      )
    })

    it('should export and download tasks as JSON with custom filename', () => {
      const exporter = new TaskExporter()
      const downloadFileSpy = vi.spyOn(exporter, 'downloadFile')
      const customFilename = 'custom-tasks.json'

      exporter.exportAndDownloadJSON(mockTasks, customFilename)

      expect(downloadFileSpy).toHaveBeenCalledWith(
        JSON.stringify(mockTasks, null, 2),
        customFilename,
        'application/json'
      )
    })

    it('should export and download empty tasks as JSON', () => {
      const exporter = new TaskExporter()
      const downloadFileSpy = vi.spyOn(exporter, 'downloadFile')

      exporter.exportAndDownloadJSON([])

      expect(downloadFileSpy).toHaveBeenCalledWith(
        '[]',
        'tasks.json',
        'application/json'
      )
    })
  })

  describe('exportAndDownloadCSV', () => {
    it('should export and download tasks as CSV with default filename', () => {
      const exporter = new TaskExporter()
      const downloadFileSpy = vi.spyOn(exporter, 'downloadFile')

      exporter.exportAndDownloadCSV(mockTasks)

      const expectedCSV = exporter.exportToCSV(mockTasks)
      expect(downloadFileSpy).toHaveBeenCalledWith(
        expectedCSV,
        'tasks.csv',
        'text/csv'
      )
    })

    it('should export and download tasks as CSV with custom filename', () => {
      const exporter = new TaskExporter()
      const downloadFileSpy = vi.spyOn(exporter, 'downloadFile')
      const customFilename = 'custom-tasks.csv'

      exporter.exportAndDownloadCSV(mockTasks, customFilename)

      const expectedCSV = exporter.exportToCSV(mockTasks)
      expect(downloadFileSpy).toHaveBeenCalledWith(
        expectedCSV,
        customFilename,
        'text/csv'
      )
    })

    it('should export and download empty tasks as CSV', () => {
      const exporter = new TaskExporter()
      const downloadFileSpy = vi.spyOn(exporter, 'downloadFile')

      exporter.exportAndDownloadCSV([])

      const expectedCSV = exporter.exportToCSV([])
      expect(downloadFileSpy).toHaveBeenCalledWith(
        expectedCSV,
        'tasks.csv',
        'text/csv'
      )
    })
  })
})
