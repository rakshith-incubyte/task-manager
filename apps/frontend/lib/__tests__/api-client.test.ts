/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loginUser, registerUser, getCurrentUser } from '@/lib/api-client'

// Mock fetch
global.fetch = vi.fn()

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loginUser', () => {
    it('should call backend auth token endpoint', async () => {
      const mockResponse = {
        user_id: '123',
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await loginUser('testuser', 'password123')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/auth/token'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser', password: 'password123' }),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should throw error on failed login', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid credentials' }),
      })

      await expect(loginUser('wrong', 'wrong')).rejects.toThrow()
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

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      })

      const result = await registerUser({
        username: 'newuser',
        email: 'new@example.com',
        password: 'Pass@123',
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/'),
        expect.objectContaining({
          method: 'POST',
        })
      )
      expect(result).toEqual(mockUser)
    })

    it('should throw error on registration failure', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Username already exists' }),
      })

      await expect(
        registerUser({
          username: 'existing',
          email: 'test@example.com',
          password: 'Pass@123',
        })
      ).rejects.toThrow()
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

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      })

      const result = await getCurrentUser('access-token')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token',
          }),
        })
      )
      expect(result).toEqual(mockUser)
    })

    it('should throw error on unauthorized request', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      await expect(getCurrentUser('invalid-token')).rejects.toThrow()
    })
  })
})
