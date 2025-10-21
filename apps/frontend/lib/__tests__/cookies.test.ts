/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import { createSessionCookie, clearSessionCookie, SESSION_COOKIE_NAME } from '../cookies'

describe('Cookie Utilities', () => {
  describe('createSessionCookie', () => {
    it('should create secure cookie with httpOnly flag', () => {
      const cookie = createSessionCookie('test-session-value')
      
      expect(cookie).toContain(`${SESSION_COOKIE_NAME}=test-session-value`)
      expect(cookie).toContain('HttpOnly')
      expect(cookie).toContain('Path=/')
      expect(cookie).toContain('SameSite=Lax')
    })

    it('should always set Secure flag', () => {
      const cookie = createSessionCookie('test-value')
      
      // Secure flag should always be set for security
      expect(cookie).toContain('Secure')
    })

    it('should set Max-Age for session duration', () => {
      const cookie = createSessionCookie('test-value')
      
      expect(cookie).toContain('Max-Age=')
    })
  })

  describe('clearSessionCookie', () => {
    it('should create cookie with empty value and past expiry', () => {
      const cookie = clearSessionCookie()
      
      expect(cookie).toContain(`${SESSION_COOKIE_NAME}=`)
      expect(cookie).toContain('Max-Age=0')
    })
  })

  describe('SESSION_COOKIE_NAME', () => {
    it('should export session cookie name constant', () => {
      expect(SESSION_COOKIE_NAME).toBeDefined()
      expect(typeof SESSION_COOKIE_NAME).toBe('string')
    })
  })
})
