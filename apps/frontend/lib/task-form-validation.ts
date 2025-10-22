import { TaskStatus, TaskPriority } from './api-client'

export type TaskFormData = {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
}

export type ValidationErrors = {
  title?: string
  description?: string
  status?: string
  priority?: string
}

export type ValidationResult = {
  isValid: boolean
  errors: ValidationErrors
}

const VALID_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']
const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high']

const MIN_TITLE_LENGTH = 3
const MAX_TITLE_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 1000

/**
 * Validates task form data
 * @param formData - The form data to validate
 * @returns Validation result with errors if any
 */
export const validateTaskForm = (formData: TaskFormData): ValidationResult => {
  const errors: ValidationErrors = {}

  // Validate title
  if (!formData.title || formData.title.trim().length === 0) {
    errors.title = 'Title is required'
  } else if (formData.title.trim().length < MIN_TITLE_LENGTH) {
    errors.title = `Title must be at least ${MIN_TITLE_LENGTH} characters`
  } else if (formData.title.length > MAX_TITLE_LENGTH) {
    errors.title = `Title must not exceed ${MAX_TITLE_LENGTH} characters`
  }

  // Validate description (optional)
  if (formData.description && formData.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`
  }

  // Validate status
  if (!VALID_STATUSES.includes(formData.status)) {
    errors.status = 'Invalid status'
  }

  // Validate priority
  if (!VALID_PRIORITIES.includes(formData.priority)) {
    errors.priority = 'Invalid priority'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
