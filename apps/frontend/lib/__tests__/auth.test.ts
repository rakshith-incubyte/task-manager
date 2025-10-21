/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { encrypt, decrypt, createSession, verifySession, deleteSession } from '@/lib/auth'

describe('Auth Library', () => {
  const mockSessionData = {
    userId: '123',
    username: 'testuser',
    email: 'test@example.com',
  }

  describe('encrypt', () => {
    it('should encrypt session data', async () => {
      const encrypted = await encrypt(mockSessionData)
      
      expect(encrypted).toBeDefined()
      expect(typeof encrypted).toBe('string')
      expect(encrypted).not.toBe(JSON.stringify(mockSessionData))
    })

    it('should produce valid JWT format', async () => {
      const encrypted = await encrypt(mockSessionData)
      
      // JWT format: header.payload.signature
      const parts = encrypted.split('.')
      expect(parts).toHaveLength(3)
      expect(parts[0]).toBeDefined() // header
      expect(parts[1]).toBeDefined() // payload
      expect(parts[2]).toBeDefined() // signature
    })
  })

  describe('decrypt', () => {
    it('should decrypt encrypted session data', async () => {
      const encrypted = await encrypt(mockSessionData)
      const decrypted = await decrypt(encrypted)
      
      // JWT adds iat (issued at) and exp (expiration) fields
      expect(decrypted).toMatchObject(mockSessionData)
      expect(decrypted).toHaveProperty('iat')
      expect(decrypted).toHaveProperty('exp')
    })

    it('should return null for invalid encrypted data', async () => {
      const decrypted = await decrypt('invalid-encrypted-data')
      
      expect(decrypted).toBeNull()
    })

    it('should return null for empty string', async () => {
      const decrypted = await decrypt('')
      
      expect(decrypted).toBeNull()
    })
  })

  describe('createSession', () => {
    it('should create session with access and refresh tokens', async () => {
      const session = await createSession({
        userId: '123',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })
      
      expect(session).toBeDefined()
      expect(typeof session).toBe('string')
    })

    it('should include expiry time in session', async () => {
      const session = await createSession({
        userId: '123',
        accessToken: 'token',
        refreshToken: 'refresh',
      })
      
      const decrypted = await decrypt(session)
      expect(decrypted).toHaveProperty('expiresAt')
      expect(decrypted?.userId).toBe('123')
    })
  })

  describe('verifySession', () => {
    it('should verify valid session', async () => {
      const session = await createSession({
        userId: '123',
        accessToken: 'token',
        refreshToken: 'refresh',
      })
      
      const verified = await verifySession(session)
      
      expect(verified).not.toBeNull()
      expect(verified?.userId).toBe('123')
      expect(verified?.accessToken).toBe('token')
    })

    it('should return null for expired session', async () => {
      // Create session with past expiry
      const pastDate = new Date(Date.now() - 1000).toISOString()
      const expiredSession = await encrypt({
        userId: '123',
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: pastDate,
      })
      
      const verified = await verifySession(expiredSession)
      
      expect(verified).toBeNull()
    })

    it('should return null for invalid session', async () => {
      const verified = await verifySession('invalid-session')
      
      expect(verified).toBeNull()
    })
  })

  describe('deleteSession', () => {
    it('should return empty string to clear session', () => {
      const result = deleteSession()
      
      expect(result).toBe('')
    })
  })
})
