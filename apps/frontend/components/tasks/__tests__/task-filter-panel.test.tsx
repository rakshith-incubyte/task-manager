import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskFilterPanel } from '../task-filter-panel'
import type { TaskFilterParams } from '@/lib/api-client'

describe('TaskFilterPanel', () => {
  const mockOnFilterChange = vi.fn()
  const mockOnClearFilters = vi.fn()

  const defaultProps = {
    filters: {} as TaskFilterParams,
    onFilterChange: mockOnFilterChange,
    onClearFilters: mockOnClearFilters,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders filter panel with all filter options', () => {
    render(<TaskFilterPanel {...defaultProps} />)

    expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument()
    expect(screen.getByText(/created date range/i)).toBeInTheDocument()
    expect(screen.getByText(/updated date range/i)).toBeInTheDocument()
  })

  it('displays clear filters button when filters are active', () => {
    render(
      <TaskFilterPanel
        {...defaultProps}
        filters={{ status: 'todo' }}
      />
    )

    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument()
  })

  it('does not display clear filters button when no filters are active', () => {
    render(<TaskFilterPanel {...defaultProps} />)

    expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument()
  })

  it('calls onFilterChange when status filter is changed', async () => {
    const user = userEvent.setup()
    render(<TaskFilterPanel {...defaultProps} />)

    const statusSelect = screen.getByLabelText(/status/i)
    await user.selectOptions(statusSelect, 'todo')

    expect(mockOnFilterChange).toHaveBeenCalledWith({ status: 'todo' })
  })

  it('calls onFilterChange when priority filter is changed', async () => {
    const user = userEvent.setup()
    render(<TaskFilterPanel {...defaultProps} />)

    const prioritySelect = screen.getByLabelText(/priority/i)
    await user.selectOptions(prioritySelect, 'high')

    expect(mockOnFilterChange).toHaveBeenCalledWith({ priority: 'high' })
  })

  it('calls onClearFilters when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <TaskFilterPanel
        {...defaultProps}
        filters={{ status: 'todo', priority: 'high' }}
      />
    )

    const clearButton = screen.getByRole('button', { name: /clear filters/i })
    await user.click(clearButton)

    expect(mockOnClearFilters).toHaveBeenCalled()
  })

  it('displays selected filter values', () => {
    render(
      <TaskFilterPanel
        {...defaultProps}
        filters={{ status: 'in_progress', priority: 'medium' }}
      />
    )

    const statusSelect = screen.getByLabelText(/status/i) as HTMLSelectElement
    const prioritySelect = screen.getByLabelText(/priority/i) as HTMLSelectElement

    expect(statusSelect.value).toBe('in_progress')
    expect(prioritySelect.value).toBe('medium')
  })

  it('allows resetting individual filters to "all"', async () => {
    const user = userEvent.setup()
    render(
      <TaskFilterPanel
        {...defaultProps}
        filters={{ status: 'todo' }}
      />
    )

    const statusSelect = screen.getByLabelText(/status/i)
    await user.selectOptions(statusSelect, '')

    expect(mockOnFilterChange).toHaveBeenCalledWith({ status: undefined })
  })

  it('handles date range input for created dates', async () => {
    const user = userEvent.setup()
    render(<TaskFilterPanel {...defaultProps} />)

    const createdAfterInput = screen.getByLabelText(/created after/i)
    const createdBeforeInput = screen.getByLabelText(/created before/i)

    await user.type(createdAfterInput, '2024-01-01')
    await user.type(createdBeforeInput, '2024-12-31')

    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        created_after: expect.stringContaining('2024-01-01'),
      })
    )
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        created_before: expect.stringContaining('2024-12-31'),
      })
    )
  })

  it('handles date range input for updated dates', async () => {
    const user = userEvent.setup()
    render(<TaskFilterPanel {...defaultProps} />)

    const updatedAfterInput = screen.getByLabelText(/updated after/i)
    const updatedBeforeInput = screen.getByLabelText(/updated before/i)

    await user.type(updatedAfterInput, '2024-01-01')
    await user.type(updatedBeforeInput, '2024-12-31')

    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        updated_after: expect.stringContaining('2024-01-01'),
      })
    )
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        updated_before: expect.stringContaining('2024-12-31'),
      })
    )
  })
})
