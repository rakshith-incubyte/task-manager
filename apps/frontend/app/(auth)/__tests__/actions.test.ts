import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

// Mock API client
vi.mock('@/lib/api-client', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  getCurrentUser: vi.fn(),
}))

// Mock auth utilities
vi.mock('@/lib/auth', () => ({
  createSession: vi.fn(),
  verifySession: vi.fn(),
}))

describe('Authentication Actions', () => {
  let mockCookieStore: any
  let mockCookies: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    mockCookieStore = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    }
    
    mockCookies = vi.fn().mockResolvedValue(mockCookieStore)
    
    const { cookies } = await import('next/headers')
    vi.mocked(cookies).mockImplementation(mockCookies)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('loginAction', () => {
    it('should successfully login with valid credentials', async () => {
      const { loginAction } = await import('../actions')
      const { loginUser } = await import('@/lib/api-client')
      const { createSession } = await import('@/lib/auth')
      
      const mockFormData = new FormData()
      mockFormData.set('username', 'testuser')
      mockFormData.set('password', 'testpass')

      const mockLoginResponse = {
        user_id: 'user123',
        access_token: 'access123',
        refresh_token: 'refresh123',
      }

      vi.mocked(loginUser).mockResolvedValue(mockLoginResponse)
      vi.mocked(createSession).mockResolvedValue('session123')

      const result = await loginAction(mockFormData)

      expect(result).toEqual({ success: true })
      expect(loginUser).toHaveBeenCalledWith('testuser', 'testpass')
      expect(createSession).toHaveBeenCalledWith({
        userId: 'user123',
        accessToken: 'access123',
      })
      expect(mockCookieStore.set).toHaveBeenCalledWith('session', 'session123', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 3600,
      })
      expect(mockCookieStore.set).toHaveBeenCalledWith('refresh_token', 'refresh123', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 604800,
      })
    })

    it('should return error when username is missing', async () => {
      const { loginAction } = await import('../actions')
      
      const mockFormData = new FormData()
      mockFormData.set('password', 'testpass')

      const result = await loginAction(mockFormData)

      expect(result).toEqual({
        success: false,
        error: 'Username is required',
      })
    })

    it('should return error when password is missing', async () => {
      const { loginAction } = await import('../actions')
      
      const mockFormData = new FormData()
      mockFormData.set('username', 'testuser')

      const result = await loginAction(mockFormData)

      expect(result).toEqual({
        success: false,
        error: 'Password is required',
      })
    })

    it('should handle login API errors', async () => {
      const { loginAction } = await import('../actions')
      const { loginUser } = await import('@/lib/api-client')
      
      const mockFormData = new FormData()
      mockFormData.set('username', 'testuser')
      mockFormData.set('password', 'wrongpass')

      const loginError = new Error('Invalid credentials')
      vi.mocked(loginUser).mockRejectedValue(loginError)

      const result = await loginAction(mockFormData)

      expect(result).toEqual({
        success: false,
        error: 'Invalid credentials',
      })
    })

    it('should handle non-Error objects in catch block', async () => {
      const { loginAction } = await import('../actions')
      const { loginUser } = await import('@/lib/api-client')
      
      const mockFormData = new FormData()
      mockFormData.set('username', 'testuser')
      mockFormData.set('password', 'testpass')

      vi.mocked(loginUser).mockRejectedValue('String error')

      const result = await loginAction(mockFormData)

      expect(result).toEqual({
        success: false,
        error: 'Login failed',
      })
    })
  })

  describe('registerAction', () => {
    it('should successfully register and login with valid data', async () => {
      const { registerAction } = await import('../actions')
      const { registerUser, loginUser } = await import('@/lib/api-client')
      const { createSession } = await import('@/lib/auth')
      
      const mockFormData = new FormData()
      mockFormData.set('username', 'newuser')
      mockFormData.set('email', 'newuser@example.com')
      mockFormData.set('password', 'newpass')

      const mockLoginResponse = {
        user_id: 'user456',
        access_token: 'access456',
        refresh_token: 'refresh456',
      }

      vi.mocked(registerUser).mockResolvedValue(undefined)
      vi.mocked(loginUser).mockResolvedValue(mockLoginResponse)
      vi.mocked(createSession).mockResolvedValue('session456')

      const result = await registerAction(mockFormData)

      expect(result).toEqual({ success: true })
      expect(registerUser).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'newpass',
      })
      expect(loginUser).toHaveBeenCalledWith('newuser', 'newpass')
      expect(createSession).toHaveBeenCalledWith({
        userId: 'user456',
        accessToken: 'access456',
      })
      expect(mockCookieStore.set).toHaveBeenCalledWith('session', 'session456', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 3600,
      })
      expect(mockCookieStore.set).toHaveBeenCalledWith('refresh_token', 'refresh456', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 604800,
      })
    })

    it('should return error when username is missing', async () => {
      const { registerAction } = await import('../actions')
      
      const mockFormData = new FormData()
      mockFormData.set('email', 'test@example.com')
      mockFormData.set('password', 'testpass')

      const result = await registerAction(mockFormData)

      expect(result).toEqual({
        success: false,
        error: 'Username is required',
      })
    })

    it('should return error when email is missing', async () => {
      const { registerAction } = await import('../actions')
      
      const mockFormData = new FormData()
      mockFormData.set('username', 'testuser')
      mockFormData.set('password', 'testpass')

      const result = await registerAction(mockFormData)

      expect(result).toEqual({
        success: false,
        error: 'Email is required',
      })
    })

    it('should return error for invalid email format', async () => {
      const { registerAction } = await import('../actions')
      
      const mockFormData = new FormData()
      mockFormData.set('username', 'testuser')
      mockFormData.set('email', 'invalid-email')
      mockFormData.set('password', 'testpass')

      const result = await registerAction(mockFormData)

      expect(result).toEqual({
        success: false,
        error: 'Invalid email format',
      })
    })

    it('should return error when password is missing', async () => {
      const { registerAction } = await import('../actions')
      
      const mockFormData = new FormData()
      mockFormData.set('username', 'testuser')
      mockFormData.set('email', 'test@example.com')

      const result = await registerAction(mockFormData)

      expect(result).toEqual({
        success: false,
        error: 'Password is required',
      })
    })

    it('should handle registration API errors', async () => {
      const { registerAction } = await import('../actions')
      const { registerUser } = await import('@/lib/api-client')
      
      const mockFormData = new FormData()
      mockFormData.set('username', 'existinguser')
      mockFormData.set('email', 'existing@example.com')
      mockFormData.set('password', 'testpass')

      const registerError = new Error('Username already exists')
      vi.mocked(registerUser).mockRejectedValue(registerError)

      const result = await registerAction(mockFormData)

      expect(result).toEqual({
        success: false,
        error: 'Username already exists',
      })
    })
  })

  describe('logoutAction', () => {
    it('should clear session and refresh token cookies', async () => {
      const { logoutAction } = await import('../actions')
      
      await logoutAction()

      expect(mockCookieStore.delete).toHaveBeenCalledWith('session')
      expect(mockCookieStore.delete).toHaveBeenCalledWith('refresh_token')
    })
  })

  describe('getUserProfileAction', () => {
    it('should successfully get user profile with valid session', async () => {
      const { getUserProfileAction } = await import('../actions')
      const { verifySession } = await import('@/lib/auth')
      const { getCurrentUser } = await import('@/lib/api-client')
      
      const mockSession = {
        userId: 'user123',
        accessToken: 'access123',
      }

      const mockUserProfile = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      mockCookieStore.get.mockReturnValue({ value: 'valid-session-token' })
      vi.mocked(verifySession).mockResolvedValue(mockSession)
      vi.mocked(getCurrentUser).mockResolvedValue(mockUserProfile)

      const result = await getUserProfileAction()

      expect(result).toEqual({
        success: true,
        data: mockUserProfile,
      })
      expect(mockCookieStore.get).toHaveBeenCalledWith('session')
      expect(verifySession).toHaveBeenCalledWith('valid-session-token')
      expect(getCurrentUser).toHaveBeenCalledWith('access123')
    })

    it('should return error when session cookie is missing', async () => {
      const { getUserProfileAction } = await import('../actions')
      
      mockCookieStore.get.mockReturnValue(undefined)

      const result = await getUserProfileAction()

      expect(result).toEqual({
        success: false,
        error: 'Not authenticated',
      })
      expect(mockCookieStore.get).toHaveBeenCalledWith('session')
    })

    it('should return error when session is invalid', async () => {
      const { getUserProfileAction } = await import('../actions')
      const { verifySession } = await import('@/lib/auth')
      
      mockCookieStore.get.mockReturnValue({ value: 'invalid-session-token' })
      vi.mocked(verifySession).mockResolvedValue(null)

      const result = await getUserProfileAction()

      expect(result).toEqual({
        success: false,
        error: 'Invalid session',
      })
      expect(verifySession).toHaveBeenCalledWith('invalid-session-token')
    })

    it('should handle API errors when getting current user', async () => {
      const { getUserProfileAction } = await import('../actions')
      const { verifySession } = await import('@/lib/auth')
      const { getCurrentUser } = await import('@/lib/api-client')
      
      const mockSession = {
        userId: 'user123',
        accessToken: 'access123',
      }

      const apiError = new Error('API request failed')
      
      mockCookieStore.get.mockReturnValue({ value: 'valid-session-token' })
      vi.mocked(verifySession).mockResolvedValue(mockSession)
      vi.mocked(getCurrentUser).mockRejectedValue(apiError)

      const result = await getUserProfileAction()

      expect(result).toEqual({
        success: false,
        error: 'API request failed',
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle FormData with empty string values', async () => {
      const { loginAction } = await import('../actions')
      
      const mockFormData = new FormData()
      mockFormData.set('username', '')
      mockFormData.set('password', '')

      const result = await loginAction(mockFormData)

      expect(result).toEqual({
        success: false,
        error: 'Username is required',
      })
    })

    it('should handle FormData with null values', async () => {
      const { loginAction } = await import('../actions')
      
      const mockFormData = new FormData()
      mockFormData.set('username', null as any)
      mockFormData.set('password', 'testpass')

      const result = await loginAction(mockFormData)

      // When FormData contains null, it gets converted to string "null"
      // So the validation passes but the API call fails
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})
