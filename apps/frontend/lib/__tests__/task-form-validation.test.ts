import { describe, it, expect } from 'vitest'
import { validateTaskForm, type TaskFormData } from '../task-form-validation'

describe('Task Form Validation', () => {
  describe('validateTaskForm', () => {
    it('should validate a complete task form successfully', () => {
      const formData: TaskFormData = {
        title: 'Valid Task Title',
        description: 'Valid description',
        status: 'todo',
        priority: 'medium',
      }

      const result = validateTaskForm(formData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should require title field', () => {
      const formData: TaskFormData = {
        title: '',
        description: 'Valid description',
        status: 'todo',
        priority: 'medium',
      }

      const result = validateTaskForm(formData)

      expect(result.isValid).toBe(false)
      expect(result.errors.title).toBe('Title is required')
    })

    it('should enforce minimum title length', () => {
      const formData: TaskFormData = {
        title: 'ab',
        description: 'Valid description',
        status: 'todo',
        priority: 'medium',
      }

      const result = validateTaskForm(formData)

      expect(result.isValid).toBe(false)
      expect(result.errors.title).toBe('Title must be at least 3 characters')
    })

    it('should enforce maximum title length', () => {
      const formData: TaskFormData = {
        title: 'a'.repeat(201),
        description: 'Valid description',
        status: 'todo',
        priority: 'medium',
      }

      const result = validateTaskForm(formData)

      expect(result.isValid).toBe(false)
      expect(result.errors.title).toBe('Title must not exceed 200 characters')
    })

    it('should allow empty description', () => {
      const formData: TaskFormData = {
        title: 'Valid Task Title',
        description: '',
        status: 'todo',
        priority: 'medium',
      }

      const result = validateTaskForm(formData)

      expect(result.isValid).toBe(true)
      expect(result.errors.description).toBeUndefined()
    })

    it('should enforce maximum description length', () => {
      const formData: TaskFormData = {
        title: 'Valid Task Title',
        description: 'a'.repeat(1001),
        status: 'todo',
        priority: 'medium',
      }

      const result = validateTaskForm(formData)

      expect(result.isValid).toBe(false)
      expect(result.errors.description).toBe('Description must not exceed 1000 characters')
    })

    it('should validate status field', () => {
      const formData: TaskFormData = {
        title: 'Valid Task Title',
        description: 'Valid description',
        status: 'invalid' as any,
        priority: 'medium',
      }

      const result = validateTaskForm(formData)

      expect(result.isValid).toBe(false)
      expect(result.errors.status).toBe('Invalid status')
    })

    it('should validate priority field', () => {
      const formData: TaskFormData = {
        title: 'Valid Task Title',
        description: 'Valid description',
        status: 'todo',
        priority: 'invalid' as any,
      }

      const result = validateTaskForm(formData)

      expect(result.isValid).toBe(false)
      expect(result.errors.priority).toBe('Invalid priority')
    })

    it('should return multiple errors when multiple fields are invalid', () => {
      const formData: TaskFormData = {
        title: '',
        description: 'a'.repeat(1001),
        status: 'invalid' as any,
        priority: 'invalid' as any,
      }

      const result = validateTaskForm(formData)

      expect(result.isValid).toBe(false)
      expect(result.errors.title).toBeDefined()
      expect(result.errors.description).toBeDefined()
      expect(result.errors.status).toBeDefined()
      expect(result.errors.priority).toBeDefined()
    })
  })
})
