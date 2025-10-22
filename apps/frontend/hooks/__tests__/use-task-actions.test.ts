import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTaskActions } from '../use-task-actions'
import * as apiClient from '@/lib/api-client'

vi.mock('@/lib/api-client')

describe('useTaskActions', () => {
  const mockAccessToken = 'mock-token'
  const mockOnSuccess = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createTask', () => {
    it('should create task successfully', async () => {
      const mockTask = {
        id: '123',
        title: 'New Task',
        description: 'Description',
        status: 'todo' as const,
        priority: 'medium' as const,
        owner_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      vi.mocked(apiClient.createTask).mockResolvedValue(mockTask)

      const { result } = renderHook(() =>
        useTaskActions(mockAccessToken, mockOnSuccess, mockOnError)
      )

      await act(async () => {
        await result.current.createTask({
          title: 'New Task',
          description: 'Description',
          status: 'todo',
          priority: 'medium',
        })
      })

      expect(apiClient.createTask).toHaveBeenCalledWith(mockAccessToken, {
        title: 'New Task',
        description: 'Description',
        status: 'todo',
        priority: 'medium',
      })
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockOnError).not.toHaveBeenCalled()
    })

    it('should handle create task error', async () => {
      const error = new Error('Failed to create task')
      vi.mocked(apiClient.createTask).mockRejectedValue(error)

      const { result } = renderHook(() =>
        useTaskActions(mockAccessToken, mockOnSuccess, mockOnError)
      )

      await act(async () => {
        await result.current.createTask({
          title: 'New Task',
          description: null,
          status: 'todo',
          priority: 'medium',
        })
      })

      expect(mockOnError).toHaveBeenCalledWith(error)
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })
  })

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      const mockTask = {
        id: '123',
        title: 'Updated Task',
        description: 'Updated description',
        status: 'in_progress' as const,
        priority: 'high' as const,
        owner_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      vi.mocked(apiClient.updateTask).mockResolvedValue(mockTask)

      const { result } = renderHook(() =>
        useTaskActions(mockAccessToken, mockOnSuccess, mockOnError)
      )

      await act(async () => {
        await result.current.updateTask('123', {
          title: 'Updated Task',
          description: 'Updated description',
          status: 'in_progress',
          priority: 'high',
        })
      })

      expect(apiClient.updateTask).toHaveBeenCalledWith(mockAccessToken, '123', {
        title: 'Updated Task',
        description: 'Updated description',
        status: 'in_progress',
        priority: 'high',
      })
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockOnError).not.toHaveBeenCalled()
    })
  })

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      vi.mocked(apiClient.deleteTask).mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useTaskActions(mockAccessToken, mockOnSuccess, mockOnError)
      )

      await act(async () => {
        await result.current.deleteTask('123')
      })

      expect(apiClient.deleteTask).toHaveBeenCalledWith(mockAccessToken, '123')
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockOnError).not.toHaveBeenCalled()
    })

    it('should handle delete task error', async () => {
      const error = new Error('Failed to delete task')
      vi.mocked(apiClient.deleteTask).mockRejectedValue(error)

      const { result } = renderHook(() =>
        useTaskActions(mockAccessToken, mockOnSuccess, mockOnError)
      )

      await act(async () => {
        await result.current.deleteTask('123')
      })

      expect(mockOnError).toHaveBeenCalledWith(error)
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })
  })
})
