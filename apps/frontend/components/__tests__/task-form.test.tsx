import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskForm } from '@/components/task-form'
import type { Task } from '@/lib/api-client'

describe('TaskForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    isSubmitting: false,
  }

  it('should render empty form for create mode', () => {
    render(<TaskForm {...defaultProps} />)

    expect(screen.getByLabelText(/title/i)).toHaveValue('')
    expect(screen.getByLabelText(/description/i)).toHaveValue('')
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument()
  })

  it('should render form with initial values for edit mode', () => {
    const task: Task = {
      id: '123',
      title: 'Existing Task',
      description: 'Existing description',
      status: 'in_progress',
      priority: 'high',
      owner_id: 'user-123',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    render(<TaskForm {...defaultProps} initialTask={task} />)

    expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Task')
    expect(screen.getByLabelText(/description/i)).toHaveValue('Existing description')
    expect(screen.getByRole('button', { name: /update task/i })).toBeInTheDocument()
  })

  it('should call onSubmit with form data when valid', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} />)

    await user.type(screen.getByLabelText(/title/i), 'New Task')
    await user.type(screen.getByLabelText(/description/i), 'Task description')
    await user.click(screen.getByRole('button', { name: /create task/i }))

    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: 'New Task',
      description: 'Task description',
      status: 'todo',
      priority: 'medium',
    })
  })

  it('should show validation error for empty title', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /create task/i }))

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should show validation error for short title', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} />)

    await user.type(screen.getByLabelText(/title/i), 'ab')
    await user.click(screen.getByRole('button', { name: /create task/i }))

    expect(await screen.findByText(/title must be at least 3 characters/i)).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should disable submit button when isSubmitting is true', () => {
    render(<TaskForm {...defaultProps} isSubmitting={true} />)

    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
  })
})
