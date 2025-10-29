import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  loginUser, 
  registerUser, 
  getCurrentUser, 
  getTasks, 
  getAllTasks, 
  createTask, 
  updateTask, 
  deleteTask 
} from '@/lib/api-client'
import { httpClient, axiosInstance } from '@/lib/http-client'

// Mock the http-client module
vi.mock('@/lib/http-client', () => ({
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

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loginUser', () => {
    it('should call backend auth token endpoint', async () => {
      const mockResponse = {
        data: {
          user_id: '123',
          access_token: 'access-token',
          refresh_token: 'refresh-token',
        }
      }

      mockedAxiosInstance.post.mockResolvedValueOnce(mockResponse)

      const result = await loginUser('testuser', 'password123')

      expect(mockedAxiosInstance.post).toHaveBeenCalledWith(
        '/users/auth/token',
        { username: 'testuser', password: 'password123' }
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw error on failed login', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { detail: 'Invalid credentials' }
        }
      }

      mockedAxiosInstance.post.mockRejectedValueOnce(mockError)

      await expect(loginUser('wrong', 'wrong')).rejects.toThrow('Invalid credentials')
    })
  })

  describe('registerUser', () => {
    it('should call backend user creation endpoint', async () => {
      const mockUser = {
        id: '123',
        username: 'newuser',
        email: 'new@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const mockResponse = { data: mockUser }
      mockedAxiosInstance.post.mockResolvedValueOnce(mockResponse)

      const result = await registerUser({
        username: 'newuser',
        email: 'new@example.com',
        password: 'Pass@123',
      })

      expect(mockedAxiosInstance.post).toHaveBeenCalledWith(
        '/users/',
        {
          username: 'newuser',
          email: 'new@example.com',
          password: 'Pass@123',
        }
      )
      expect(result).toEqual(mockUser)
    })

    it('should throw error on registration failure', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { detail: 'Username already exists' }
        }
      }

      mockedAxiosInstance.post.mockRejectedValueOnce(mockError)

      await expect(
        registerUser({
          username: 'existing',
          email: 'test@example.com',
          password: 'Pass@123',
        })
      ).rejects.toThrow('Username already exists')
    })
  })

  describe('getCurrentUser', () => {
    it('should call backend me endpoint with token', async () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const mockResponse = { data: mockUser }
      mockedAxiosInstance.get.mockResolvedValueOnce(mockResponse)

      const result = await getCurrentUser('access-token')

      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/users/me')
      expect(result).toEqual(mockUser)
    })

    it('should throw error on unauthorized request', async () => {
      const mockError = {
        response: {
          status: 401,
        }
      }

      mockedAxiosInstance.get.mockRejectedValueOnce(mockError)

      await expect(getCurrentUser('invalid-token')).rejects.toThrow('Failed to get user profile')
    })
  })

  describe('getTasks', () => {
    it('should fetch tasks with parameters', async () => {
      const mockTasks = {
        data: [
          {
            id: '1',
            title: 'Test Task',
            description: 'Description',
            status: 'todo',
            priority: 'high',
            owner_id: 'user-1',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          }
        ],
        total: 1,
        cursor: 'cursor-1',
        has_more: false,
        next_cursor: null,
      }

      const mockResponse = { data: mockTasks }
      mockedAxiosInstance.get.mockResolvedValueOnce(mockResponse)

      const params = {
        status: 'todo',
        priority: 'high',
        limit: 10,
        cursor: 'cursor-1',
      }

      const result = await getTasks('access-token', params)

      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/tasks/', {
        params: {
          status: 'todo',
          priority: 'high',
          limit: 10,
          cursor: 'cursor-1',
        },
      })
      expect(result).toEqual(mockTasks)
    })

    it('should handle fetch tasks error', async () => {
      const mockError = {
        response: {
          data: { detail: 'Failed to fetch tasks' }
        }
      }

      mockedAxiosInstance.get.mockRejectedValueOnce(mockError)

      await expect(getTasks('access-token')).rejects.toThrow('Failed to fetch tasks')
    })

    it('should handle fetch tasks with default error message', async () => {
      const mockError = {
        response: {
          data: {}
        }
      }

      mockedAxiosInstance.get.mockRejectedValueOnce(mockError)

      await expect(getTasks('access-token')).rejects.toThrow('Failed to fetch tasks')
    })
  })

  describe('getAllTasks', () => {
    it('should fetch all tasks recursively', async () => {
      const mockPage1 = {
        data: [
          {
            id: '1',
            title: 'Task 1',
            description: 'Description 1',
            status: 'todo',
            priority: 'high',
            owner_id: 'user-1',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          }
        ],
        total: 2,
        cursor: 'cursor-1',
        has_more: true,
        next_cursor: 'cursor-2',
      }

      const mockPage2 = {
        data: [
          {
            id: '2',
            title: 'Task 2',
            description: 'Description 2',
            status: 'done',
            priority: 'low',
            owner_id: 'user-1',
            created_at: '2025-01-02T00:00:00Z',
            updated_at: '2025-01-02T00:00:00Z',
          }
        ],
        total: 2,
        cursor: 'cursor-2',
        has_more: false,
        next_cursor: null,
      }

      mockedAxiosInstance.get
        .mockResolvedValueOnce({ data: mockPage1 })
        .mockResolvedValueOnce({ data: mockPage2 })

      const result = await getAllTasks('access-token')

      expect(mockedAxiosInstance.get).toHaveBeenCalledTimes(2)
      expect(mockedAxiosInstance.get).toHaveBeenNthCalledWith(1, '/tasks/', {
        params: { cursor: undefined, limit: 100 }
      })
      expect(mockedAxiosInstance.get).toHaveBeenNthCalledWith(2, '/tasks/', {
        params: { cursor: 'cursor-2', limit: 100 }
      })
      expect(result).toEqual([...mockPage1.data, ...mockPage2.data])
    })

    it('should handle getAllTasks error', async () => {
      const mockError = {
        response: {
          data: { detail: 'Failed to fetch all tasks' }
        }
      }

      mockedAxiosInstance.get.mockRejectedValueOnce(mockError)

      await expect(getAllTasks('access-token')).rejects.toThrow('Failed to fetch all tasks')
    })
  })

  describe('createTask', () => {
    it('should create a new task', async () => {
      const newTask = {
        id: '1',
        title: 'New Task',
        description: 'New Description',
        status: 'todo',
        priority: 'high',
        owner_id: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      const taskData = {
        title: 'New Task',
        description: 'New Description',
        status: 'todo',
        priority: 'high',
      }

      const mockResponse = { data: newTask }
      mockedAxiosInstance.post.mockResolvedValueOnce(mockResponse)

      const result = await createTask('access-token', taskData)

      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/tasks/', taskData)
      expect(result).toEqual(newTask)
    })

    it('should handle create task error', async () => {
      const mockError = {
        response: {
          data: { detail: 'Failed to create task' }
        }
      }

      mockedAxiosInstance.post.mockRejectedValueOnce(mockError)

      await expect(createTask('access-token', {
        title: 'Test',
        description: 'Test',
        status: 'todo',
        priority: 'high'
      })).rejects.toThrow('Failed to create task')
    })
  })

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      const updatedTask = {
        id: '1',
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'in_progress',
        priority: 'medium',
        owner_id: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      }

      const updateData = {
        title: 'Updated Task',
        status: 'in_progress',
      }

      const mockResponse = { data: updatedTask }
      mockedAxiosInstance.patch.mockResolvedValueOnce(mockResponse)

      const result = await updateTask('access-token', '1', updateData)

      expect(mockedAxiosInstance.patch).toHaveBeenCalledWith('/tasks/1', updateData)
      expect(result).toEqual(updatedTask)
    })

    it('should handle update task error with response detail', async () => {
      const mockError = {
        response: {
          data: { detail: 'Task not found' }
        }
      }

      mockedAxiosInstance.patch.mockRejectedValueOnce(mockError)

      await expect(updateTask('access-token', 'invalid-id', {
        title: 'Updated'
      })).rejects.toThrow('Task not found')
    })

    it('should handle update task error with message', async () => {
      const mockError = {
        response: {
          data: {}
        },
        message: 'Network error'
      }

      mockedAxiosInstance.patch.mockRejectedValueOnce(mockError)

      await expect(updateTask('access-token', '1', {
        title: 'Updated'
      })).rejects.toThrow('Network error')
    })

    it('should handle update task error with default message', async () => {
      const mockError = {
        response: {
          data: {}
        }
      }

      mockedAxiosInstance.patch.mockRejectedValueOnce(mockError)

      await expect(updateTask('access-token', '1', {
        title: 'Updated'
      })).rejects.toThrow('Failed to update task')
    })
  })

  describe('deleteTask', () => {
    it('should delete an existing task', async () => {
      mockedAxiosInstance.delete.mockResolvedValueOnce({})

      await expect(deleteTask('access-token', '1')).resolves.toBeUndefined()

      expect(mockedAxiosInstance.delete).toHaveBeenCalledWith('/tasks/1')
    })

    it('should handle delete task error', async () => {
      const mockError = {
        response: {
          data: { detail: 'Task not found' }
        }
      }

      mockedAxiosInstance.delete.mockRejectedValueOnce(mockError)

      await expect(deleteTask('access-token', 'invalid-id')).rejects.toThrow('Task not found')
    })

    it('should handle delete task error with default message', async () => {
      const mockError = {
        response: {
          data: {}
        }
      }

      mockedAxiosInstance.delete.mockRejectedValueOnce(mockError)

      await expect(deleteTask('access-token', '1')).rejects.toThrow('Failed to delete task')
    })
  })
})
