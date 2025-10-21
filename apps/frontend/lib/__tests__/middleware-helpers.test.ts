import { describe, it, expect } from 'vitest'
import { isProtectedRoute, isAuthRoute } from '../middleware-helpers'

describe('Middleware Helpers', () => {
  describe('isProtectedRoute', () => {
    it('should return true for dashboard route', () => {
      expect(isProtectedRoute('/dashboard')).toBe(true)
    })

    it('should return true for tasks route', () => {
      expect(isProtectedRoute('/tasks')).toBe(true)
    })

    it('should return true for settings route', () => {
      expect(isProtectedRoute('/settings')).toBe(true)
    })

    it('should return false for home route', () => {
      expect(isProtectedRoute('/')).toBe(false)
    })

    it('should return false for login route', () => {
      expect(isProtectedRoute('/login')).toBe(false)
    })

    it('should return false for register route', () => {
      expect(isProtectedRoute('/register')).toBe(false)
    })
  })

  describe('isAuthRoute', () => {
    it('should return true for login route', () => {
      expect(isAuthRoute('/login')).toBe(true)
    })

    it('should return true for register route', () => {
      expect(isAuthRoute('/register')).toBe(true)
    })

    it('should return false for dashboard route', () => {
      expect(isAuthRoute('/dashboard')).toBe(false)
    })

    it('should return false for home route', () => {
      expect(isAuthRoute('/')).toBe(false)
    })
  })
})
