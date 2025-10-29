import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTaskExportImport } from '../use-task-export-import'
import { Task } from '@/lib/api-client'
import { TaskExporter } from '@/lib/task-exporter'
import { TaskImporter } from '@/lib/task-importer'

// Mock the exporter and importer classes
vi.mock('@/lib/task-exporter', () => ({
  TaskExporter: vi.fn().mockImplementation(() => ({
    jsonStrategy: {},
    csvStrategy: {},
    fileDownloader: {},
    exportToJSON: vi.fn(),
    exportToCSV: vi.fn(),
    downloadFile: vi.fn(),
    exportAndDownloadJSON: vi.fn(),
    exportAndDownloadCSV: vi.fn(),
  })),
}))

vi.mock('@/lib/task-importer', () => ({
  TaskImporter: vi.fn().mockImplementation(() => ({
    importFromFile: vi.fn(),
  })),
}))

describe('useTaskExportImport', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Test Task',
      description: 'Test',
      status: 'todo',
      priority: 'high',
      owner_id: 'user-1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exportTasks', () => {
    it('should export tasks as JSON', () => {
      const mockExportJSON = vi.fn()
      const mockedExporter = vi.mocked(TaskExporter)
      mockedExporter.mockImplementation(() => ({
        jsonStrategy: {},
        csvStrategy: {},
        fileDownloader: {},
        exportToJSON: vi.fn(),
        exportToCSV: vi.fn(),
        downloadFile: vi.fn(),
        exportAndDownloadJSON: mockExportJSON,
        exportAndDownloadCSV: vi.fn(),
      }))

      const { result } = renderHook(() => useTaskExportImport())

      act(() => {
        result.current.exportTasks(mockTasks, 'json')
      })

      expect(mockExportJSON).toHaveBeenCalledWith(mockTasks, expect.stringContaining('.json'))
      expect(result.current.isExporting).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should export tasks as CSV', () => {
      const mockExportCSV = vi.fn()
      const mockedExporter = vi.mocked(TaskExporter)
      mockedExporter.mockImplementation(() => ({
        jsonStrategy: {},
        csvStrategy: {},
        fileDownloader: {},
        exportToJSON: vi.fn(),
        exportToCSV: vi.fn(),
        downloadFile: vi.fn(),
        exportAndDownloadJSON: vi.fn(),
        exportAndDownloadCSV: mockExportCSV,
      }))

      const { result } = renderHook(() => useTaskExportImport())

      act(() => {
        result.current.exportTasks(mockTasks, 'csv')
      })

      expect(mockExportCSV).toHaveBeenCalledWith(mockTasks, expect.stringContaining('.csv'))
      expect(result.current.isExporting).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle export errors', () => {
      const mockedExporter = vi.mocked(TaskExporter)
      mockedExporter.mockImplementation(() => ({
        jsonStrategy: {},
        csvStrategy: {},
        fileDownloader: {},
        exportToJSON: vi.fn(),
        exportToCSV: vi.fn(),
        downloadFile: vi.fn(),
        exportAndDownloadJSON: vi.fn(() => {
          throw new Error('Export failed')
        }),
        exportAndDownloadCSV: vi.fn(),
      }))

      const { result } = renderHook(() => useTaskExportImport())

      act(() => {
        result.current.exportTasks(mockTasks, 'json')
      })

      expect(result.current.error).toBe('Export failed')
      expect(result.current.isExporting).toBe(false)
    })
  })

  describe('importTasks', () => {
    it('should import tasks from file', async () => {
      const mockImportFromFile = vi.fn().mockResolvedValue(mockTasks)
      const mockedImporter = vi.mocked(TaskImporter)
      mockedImporter.mockImplementation(() => ({
        importFromFile: mockImportFromFile,
      }))

      const { result } = renderHook(() => useTaskExportImport())
      const mockFile = new File(['content'], 'tasks.json', { type: 'application/json' })

      let importedTasks: Task[] = []
      await act(async () => {
        importedTasks = await result.current.importTasks(mockFile)
      })

      expect(mockImportFromFile).toHaveBeenCalledWith(mockFile)
      expect(importedTasks).toEqual(mockTasks)
      expect(result.current.error).toBeNull()
      expect(result.current.isImporting).toBe(false)
    })

    it('should handle import errors', async () => {
      const mockImportFromFile = vi.fn().mockRejectedValue(new Error('Import failed'))
      const mockedImporter = vi.mocked(TaskImporter)
      mockedImporter.mockImplementation(() => ({
        importFromFile: mockImportFromFile,
      }))

      const { result } = renderHook(() => useTaskExportImport())
      const mockFile = new File(['content'], 'tasks.json', { type: 'application/json' })

      await act(async () => {
        try {
          await result.current.importTasks(mockFile)
        } catch (error) {
          // Expected error
        }
      })

      await waitFor(() => {
        expect(result.current.error).toBe('Import failed')
      })
      expect(result.current.isImporting).toBe(false)
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      const mockedExporter = vi.mocked(TaskExporter)
      mockedExporter.mockImplementation(() => ({
        jsonStrategy: {},
        csvStrategy: {},
        fileDownloader: {},
        exportToJSON: vi.fn(),
        exportToCSV: vi.fn(),
        downloadFile: vi.fn(),
        exportAndDownloadJSON: vi.fn(() => {
          throw new Error('Export failed')
        }),
        exportAndDownloadCSV: vi.fn(),
      }))

      const { result } = renderHook(() => useTaskExportImport())

      act(() => {
        result.current.exportTasks(mockTasks, 'json')
      })

      expect(result.current.error).toBe('Export failed')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })
})
