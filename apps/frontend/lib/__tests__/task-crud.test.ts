import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTask, deleteTask, type CreateTaskRequest } from '../api-client'

describe('Task CRUD API Client', () => {
  const mockAccessToken = 'mock-access-token'
  const mockApiUrl = 'http://localhost:8000'

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const mockTaskData: CreateTaskRequest = {
        title: 'New Task',
        description: 'Task description',
        status: 'todo',
        priority: 'medium',
      }

      const mockResponse = {
        id: '123',
        ...mockTaskData,
        owner_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await createTask(mockAccessToken, mockTaskData)

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/tasks/`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify(mockTaskData),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle validation errors when creating task', async () => {
      const invalidTaskData: CreateTaskRequest = {
        title: '',
        description: null,
        status: 'todo',
        priority: 'medium',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Title is required' }),
      })

      await expect(createTask(mockAccessToken, invalidTaskData)).rejects.toThrow(
        'Title is required'
      )
    })

    it('should handle network errors when creating task', async () => {
      const mockTaskData: CreateTaskRequest = {
        title: 'New Task',
        description: null,
        status: 'todo',
        priority: 'medium',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error('Network error')
        },
      })

      await expect(createTask(mockAccessToken, mockTaskData)).rejects.toThrow(
        'Failed to create task'
      )
    })
  })

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      const taskId = '123'

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      await deleteTask(mockAccessToken, taskId)

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockApiUrl}/tasks/${taskId}`,
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        })
      )
    })

    it('should handle not found error when deleting task', async () => {
      const taskId = 'non-existent'

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Task not found' }),
      })

      await expect(deleteTask(mockAccessToken, taskId)).rejects.toThrow(
        'Task not found'
      )
    })

    it('should handle unauthorized error when deleting task', async () => {
      const taskId = '123'

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Not authorized to delete this task' }),
      })

      await expect(deleteTask(mockAccessToken, taskId)).rejects.toThrow(
        'Not authorized to delete this task'
      )
    })
  })
})
