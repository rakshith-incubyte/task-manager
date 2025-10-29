import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loginUser, registerUser, getCurrentUser } from '@/lib/api-client'
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
})
