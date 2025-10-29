import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HttpClient, httpClient, axiosInstance } from '../http-client'

// Mock window.location
const mockLocation = {
  href: '',
}

Object.defineProperty(global, 'window', {
  value: {
    location: mockLocation,
  },
  writable: true,
})

// Mock axios
vi.mock('axios', () => {
  const mockInstance = vi.fn((config) => Promise.resolve({ data: 'mock response', ...config }))
  mockInstance.interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  }
  mockInstance.post = vi.fn(() => Promise.resolve())
  mockInstance.get = vi.fn(() => Promise.resolve())
  mockInstance.patch = vi.fn(() => Promise.resolve())
  mockInstance.delete = vi.fn(() => Promise.resolve())

  return {
    default: {
      create: vi.fn(() => mockInstance),
      post: vi.fn(() => Promise.resolve()),
    },
    AxiosError: class extends Error {
      constructor(public response?: any, public config?: any) {
        super('AxiosError')
      }
    },
  }
})

const axios = (await import('axios')).default
const mockAxios = vi.mocked(axios)
const mockInstance = mockAxios.create.mock.results[0].value

describe('HttpClient', () => {
  let client: HttpClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = new HttpClient()
    mockLocation.href = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with correct baseURL', () => {
      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      })
    })

    it('should setup interceptors', () => {
      expect(mockInstance.interceptors.request.use).toHaveBeenCalledTimes(1)
      expect(mockInstance.interceptors.response.use).toHaveBeenCalledTimes(1)
    })
  })

  describe('token management', () => {
    it('should set access token', () => {
      const token = 'test-token'
      client.setAccessToken(token)
      expect(client.getAccessToken()).toBe(token)
    })

    it('should get access token', () => {
      client.setAccessToken('test-token')
      expect(client.getAccessToken()).toBe('test-token')
    })

    it('should return null when no access token is set', () => {
      expect(client.getAccessToken()).toBeNull()
    })

    it('should clear tokens and call logout endpoint', () => {
      client.setAccessToken('test-token')
      
      client.clearTokens()
      
      expect(client.getAccessToken()).toBeNull()
      expect(mockInstance.post).toHaveBeenCalledWith(
        '/users/auth/logout',
        {},
        { withCredentials: true }
      )
    })

    it('should handle logout endpoint errors gracefully', () => {
      mockInstance.post.mockRejectedValueOnce(new Error('Logout failed'))
      
      expect(() => client.clearTokens()).not.toThrow()
    })
  })

  describe('getInstance', () => {
    it('should return axios instance', () => {
      expect(client.getInstance()).toBe(mockInstance)
    })
  })

  describe('request interceptor', () => {
    it('should attach authorization header when token is present', () => {
      const requestHandler = mockInstance.interceptors.request.use.mock.calls[0][0]
      
      const config = { headers: {} }
      client.setAccessToken('test-token')
      
      const result = requestHandler(config)
      
      expect(result.headers.Authorization).toBe('Bearer test-token')
    })

    it('should not attach authorization header when token is absent', () => {
      const requestHandler = mockInstance.interceptors.request.use.mock.calls[0][0]
      
      const config = { headers: {} }
      
      const result = requestHandler(config)
      
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should handle request without headers', () => {
      const requestHandler = mockInstance.interceptors.request.use.mock.calls[0][0]
      
      const config = {}
      
      const result = requestHandler(config)
      
      expect(result).toEqual(config)
    })
  })

  describe('response interceptor - token refresh', () => {
    let responseHandler: any
    let errorHandler: any

    beforeEach(() => {
      responseHandler = mockInstance.interceptors.response.use.mock.calls[0][0]
      errorHandler = mockInstance.interceptors.response.use.mock.calls[0][1]
    })

    it('should handle successful responses', async () => {
      const response = { data: 'success' }
      const result = await responseHandler(response)
      expect(result).toBe(response)
    })

    it('should handle non-401 errors', async () => {
      const error = {
        response: { status: 500 },
        config: {},
      }
      
      await expect(errorHandler(error)).rejects.toBe(error)
    })

    it('should handle 401 error and retry after successful token refresh', async () => {
      const originalRequest = { _retry: false }
      const error = {
        response: { status: 401 },
        config: originalRequest,
      }
      
      const newToken = 'new-access-token'
      mockAxios.post.mockResolvedValueOnce({
        data: { access_token: newToken }
      })
      
      // Mock the client to return a promise for the retry
      mockInstance.get = vi.fn().mockResolvedValueOnce({ data: 'success' })
      
      const result = await errorHandler(error)
      
      expect(mockAxios.post).toHaveBeenCalledWith(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/users/auth/refresh`,
        {},
        { withCredentials: true }
      )
      expect(client.getAccessToken()).toBe(newToken)
      expect(originalRequest._retry).toBe(true)
    })

    it('should queue requests when token refresh is in progress', async () => {
      const originalRequest1 = { _retry: false }
      const originalRequest2 = { _retry: false }
      const error1 = {
        response: { status: 401 },
        config: originalRequest1,
      }
      const error2 = {
        response: { status: 401 },
        config: originalRequest2,
      }
      
      const newToken = 'new-access-token'
      mockAxios.post.mockResolvedValueOnce({
        data: { access_token: newToken }
      })
      
      // Mock the client to return promises for the retries
      // Reset the mock and set specific return values
      mockInstance.mockReset()
      mockInstance.mockImplementation((config) => {
        if (config === originalRequest1) {
          return Promise.resolve({ data: 'success1' })
        } else if (config === originalRequest2) {
          return Promise.resolve({ data: 'success2' })
        }
        return Promise.resolve({ data: 'mock response', ...config })
      })
      
      // Start first refresh
      const promise1 = errorHandler(error1)
      // Queue second request
      const promise2 = errorHandler(error2)
      
      const [result1, result2] = await Promise.all([promise1, promise2])
      
      expect(result1.data).toBe('success1')
      expect(result2.data).toBe('success2')
    })

    it('should handle token refresh failure and redirect to login', async () => {
      const originalRequest = { _retry: false }
      const error = {
        response: { status: 401 },
        config: originalRequest,
      }
      
      const refreshError = {
        response: { status: 401 },
        message: 'Refresh failed'
      }
      mockAxios.post.mockRejectedValueOnce(refreshError)
      
      // Mock the client post method to avoid undefined errors
      mockInstance.post = vi.fn().mockRejectedValue(refreshError)
      
      await expect(errorHandler(error)).rejects.toBe(refreshError)
      
      expect(client.getAccessToken()).toBeNull()
      expect(mockLocation.href).toBe('/login')
    })

    it('should handle already retried requests', async () => {
      const originalRequest = { _retry: true }
      const error = {
        response: { status: 401 },
        config: originalRequest,
      }
      
      await expect(errorHandler(error)).rejects.toBe(error)
    })

    it('should handle SSR environment (no window)', async () => {
      // Remove window temporarily
      const originalWindow = global.window
      delete (global as any).window
      
      const originalRequest = { _retry: false }
      const error = {
        response: { status: 401 },
        config: originalRequest,
      }
      
      const refreshError = {
        response: { status: 401 },
        message: 'Refresh failed'
      }
      mockAxios.post.mockRejectedValueOnce(refreshError)
      
      // Mock the client post method to avoid undefined errors
      mockInstance.post = vi.fn().mockRejectedValue(refreshError)
      
      await expect(errorHandler(error)).rejects.toBe(refreshError)
      
      // Restore window
      global.window = originalWindow
    })
  })

  describe('processQueue', () => {
    it('should resolve all queued requests when there is no error', () => {
      const resolve1 = vi.fn()
      const resolve2 = vi.fn()
      const reject1 = vi.fn()
      const reject2 = vi.fn()
      
      // Access private method for testing
      const clientAny = client as any
      clientAny.failedQueue = [
        { resolve: resolve1, reject: reject1 },
        { resolve: resolve2, reject: reject2 },
      ]
      
      clientAny.processQueue(null)
      
      expect(resolve1).toHaveBeenCalledWith()
      expect(resolve2).toHaveBeenCalledWith()
      expect(reject1).not.toHaveBeenCalled()
      expect(reject2).not.toHaveBeenCalled()
      expect(clientAny.failedQueue).toEqual([])
    })

    it('should reject all queued requests when there is an error', () => {
      const error = new Error('Test error')
      const resolve1 = vi.fn()
      const resolve2 = vi.fn()
      const reject1 = vi.fn()
      const reject2 = vi.fn()
      
      // Access private method for testing
      const clientAny = client as any
      clientAny.failedQueue = [
        { resolve: resolve1, reject: reject1 },
        { resolve: resolve2, reject: reject2 },
      ]
      
      clientAny.processQueue(error)
      
      expect(reject1).toHaveBeenCalledWith(error)
      expect(reject2).toHaveBeenCalledWith(error)
      expect(resolve1).not.toHaveBeenCalled()
      expect(resolve2).not.toHaveBeenCalled()
      expect(clientAny.failedQueue).toEqual([])
    })
  })

  describe('singleton exports', () => {
    it('should export httpClient singleton', () => {
      expect(httpClient).toBeInstanceOf(HttpClient)
    })

    it('should export axiosInstance', () => {
      expect(axiosInstance).toBeDefined()
    })
  })
})
