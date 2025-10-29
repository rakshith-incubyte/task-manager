import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTask, deleteTask, type CreateTaskRequest } from '../api-client'
import { axiosInstance } from '../http-client'

// Mock the http-client module
vi.mock('../http-client', () => ({
  httpClient: {
    setAccessToken: vi.fn(),
    getAccessToken: vi.fn(),
    clearTokens: vi.fn(),
  },
  axiosInstance: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }
}))

const mockedAxiosInstance = vi.mocked(axiosInstance, { deep: true })

describe('Task CRUD API Client', () => {
  const mockAccessToken = 'mock-access-token'
  const mockApiUrl = 'http://localhost:8000'

  beforeEach(() => {
    vi.clearAllMocks()
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

      mockedAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse })

      const result = await createTask(mockAccessToken, mockTaskData)

      expect(mockedAxiosInstance.post).toHaveBeenCalledWith(
        '/tasks/',
        mockTaskData
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

      const mockError = {
        response: {
          data: { detail: 'Title is required' }
        }
      }

      mockedAxiosInstance.post.mockRejectedValueOnce(mockError)

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

      const mockError = {
        response: {
          data: { detail: 'Network error' }
        }
      }

      mockedAxiosInstance.post.mockRejectedValueOnce(mockError)

      await expect(createTask(mockAccessToken, mockTaskData)).rejects.toThrow(
        'Network error'
      )
    })
  })

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      const taskId = '123'

      mockedAxiosInstance.delete.mockResolvedValueOnce({})

      await deleteTask(mockAccessToken, taskId)

      expect(mockedAxiosInstance.delete).toHaveBeenCalledWith(`/tasks/${taskId}`)
    })

    it('should handle not found error when deleting task', async () => {
      const taskId = 'non-existent'

      const mockError = {
        response: {
          data: { detail: 'Task not found' }
        }
      }

      mockedAxiosInstance.delete.mockRejectedValueOnce(mockError)

      await expect(deleteTask(mockAccessToken, taskId)).rejects.toThrow(
        'Task not found'
      )
    })

    it('should handle unauthorized error when deleting task', async () => {
      const taskId = '123'

      const mockError = {
        response: {
          data: { detail: 'Not authorized to delete this task' }
        }
      }

      mockedAxiosInstance.delete.mockRejectedValueOnce(mockError)

      await expect(deleteTask(mockAccessToken, taskId)).rejects.toThrow(
        'Not authorized to delete this task'
      )
    })
  })
})
