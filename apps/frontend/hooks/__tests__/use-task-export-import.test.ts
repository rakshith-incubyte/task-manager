import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { useTaskExportImport } from '../use-task-export-import'
import { Task } from '@/lib/api-client'

// Mock the exporter and importer
jest.mock('@/lib/task-exporter')
jest.mock('@/lib/task-importer')

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
    jest.clearAllMocks()
  })

  describe('exportTasks', () => {
    it('should export tasks as JSON', () => {
      const { result } = renderHook(() => useTaskExportImport())

      act(() => {
        result.current.exportTasks(mockTasks, 'json')
      })

      expect(result.current.isExporting).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should export tasks as CSV', () => {
      const { result } = renderHook(() => useTaskExportImport())

      act(() => {
        result.current.exportTasks(mockTasks, 'csv')
      })

      expect(result.current.isExporting).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle export errors', () => {
      const { TaskExporter } = require('@/lib/task-exporter')
      TaskExporter.prototype.exportAndDownloadJSON = jest.fn(() => {
        throw new Error('Export failed')
      })

      const { result } = renderHook(() => useTaskExportImport())

      act(() => {
        result.current.exportTasks(mockTasks, 'json')
      })

      expect(result.current.error).toBe('Export failed')
    })
  })

  describe('importTasks', () => {
    it('should import tasks from file', async () => {
      const { TaskImporter } = require('@/lib/task-importer')
      TaskImporter.prototype.importFromFile = jest.fn().mockResolvedValue(mockTasks)

      const { result } = renderHook(() => useTaskExportImport())
      const mockFile = new File(['content'], 'tasks.json', { type: 'application/json' })

      let importedTasks: Task[] = []
      await act(async () => {
        importedTasks = await result.current.importTasks(mockFile)
      })

      expect(importedTasks).toEqual(mockTasks)
      expect(result.current.error).toBeNull()
    })

    it('should handle import errors', async () => {
      const { TaskImporter } = require('@/lib/task-importer')
      TaskImporter.prototype.importFromFile = jest.fn().mockRejectedValue(new Error('Import failed'))

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
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      const { TaskExporter } = require('@/lib/task-exporter')
      TaskExporter.prototype.exportAndDownloadJSON = jest.fn(() => {
        throw new Error('Export failed')
      })

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
