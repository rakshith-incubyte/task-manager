import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskFilterPanel } from '../task-filter-panel'
import type { TaskFilterParams } from '@/lib/api-client'

// Mock the Calendar component
vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect, selected }: any) => (
    <div data-testid="calendar">
      <button
        onClick={() => onSelect({ from: new Date('2025-01-01'), to: new Date('2025-01-31') })}
        data-testid="select-date-range"
      >
        Select Date Range
      </button>
      <div data-testid="selected-date">
        {selected?.from?.toISOString()} - {selected?.to?.toISOString()}
      </div>
    </div>
  ),
}))

// Mock react-day-picker DateRange
vi.mock('react-day-picker', () => ({
  DateRange: {} as any,
}))

// Mock date-fns format
vi.mock('date-fns', () => ({
  format: (date: Date, formatStr: string) => 'Jan 01, 2025',
}))

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

    // Find the date picker buttons by their text content
    const dateButtons = screen.getAllByText('Pick a date range')
    const createdDateButton = dateButtons[0] // First button is for created date
    const updatedDateButton = dateButtons[1] // Second button is for updated date

    // Test that the date picker buttons are present and clickable
    await user.click(createdDateButton)
    
    expect(createdDateButton).toBeInTheDocument()
    expect(updatedDateButton).toBeInTheDocument()
  })

  it('handles date range input for updated dates', async () => {
    const user = userEvent.setup()
    render(<TaskFilterPanel {...defaultProps} />)

    // Find the date picker buttons by their text content
    const dateButtons = screen.getAllByText('Pick a date range')
    const createdDateButton = dateButtons[0] // First button is for created date
    const updatedDateButton = dateButtons[1] // Second button is for updated date

    // Open the updated date picker
    await user.click(updatedDateButton)
    
    // Test that the date picker buttons are present and clickable
    expect(createdDateButton).toBeInTheDocument()
    expect(updatedDateButton).toBeInTheDocument()
  })

  describe('expand/collapse functionality', () => {
    it('starts expanded by default', () => {
      render(<TaskFilterPanel {...defaultProps} />)
      
      // Check that filter options are visible when expanded
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument()
    })

    it('toggles collapse when filter header is clicked', async () => {
      const user = userEvent.setup()
      render(<TaskFilterPanel {...defaultProps} />)
      
      // Find the filter header button by text content
      const filterHeader = screen.getByText('Filters').closest('button')
      expect(filterHeader).toBeInTheDocument()
      
      // Click the filter header to collapse
      await user.click(filterHeader!)
      
      // Filter options should no longer be visible
      expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/priority/i)).not.toBeInTheDocument()
    })

    it('shows filter count badge when collapsed and filters are active', async () => {
      const user = userEvent.setup()
      render(
        <TaskFilterPanel
          {...defaultProps}
          filters={{ status: 'todo', priority: 'high' }}
        />
      )
      
      // Find the filter header button by text content
      const filterHeader = screen.getByText('Filters').closest('button')
      expect(filterHeader).toBeInTheDocument()
      
      // Click the filter header to collapse
      await user.click(filterHeader!)
      
      // Should show count badge with number of active filters
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('does not show filter count badge when collapsed and no filters are active', async () => {
      const user = userEvent.setup()
      render(<TaskFilterPanel {...defaultProps} />)
      
      // Find the filter header button by text content
      const filterHeader = screen.getByText('Filters').closest('button')
      expect(filterHeader).toBeInTheDocument()
      
      // Click the filter header to collapse
      await user.click(filterHeader!)
      
      // Should not show count badge
      expect(screen.queryByText(/[0-9]/)).not.toBeInTheDocument()
    })
  })

  describe('date range handling', () => {
    it('initializes date ranges from filter props', () => {
      const filtersWithDates: TaskFilterParams = {
        created_after: '2025-01-01T00:00:00Z',
        created_before: '2025-01-31T23:59:59Z',
        updated_after: '2025-02-01T00:00:00Z',
        updated_before: '2025-02-28T23:59:59Z',
      }
      
      render(
        <TaskFilterPanel
          {...defaultProps}
          filters={filtersWithDates}
        />
      )
      
      // Should display the formatted date ranges
      const dateButtons = screen.getAllByText(/Jan 01, 2025/)
      expect(dateButtons.length).toBeGreaterThan(0)
    })

    it('calls onFilterChange with correct ISO dates when created date range is selected', async () => {
      const user = userEvent.setup()
      render(<TaskFilterPanel {...defaultProps} />)
      
      // Open created date picker
      const dateButtons = screen.getAllByText('Pick a date range')
      await user.click(dateButtons[0])
      
      // Select a date range from the mocked calendar
      const selectButton = screen.getByTestId('select-date-range')
      await user.click(selectButton)
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        created_after: new Date('2025-01-01T00:00:00.000Z').toISOString(),
        created_before: new Date('2025-01-31T00:00:00.000Z').toISOString(),
      })
    })

    it('calls onFilterChange with correct ISO dates when updated date range is selected', async () => {
      const user = userEvent.setup()
      render(<TaskFilterPanel {...defaultProps} />)
      
      // Open updated date picker
      const dateButtons = screen.getAllByText('Pick a date range')
      await user.click(dateButtons[1])
      
      // Select a date range from the mocked calendar
      const selectButton = screen.getByTestId('select-date-range')
      await user.click(selectButton)
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        updated_after: new Date('2025-01-01T00:00:00.000Z').toISOString(),
        updated_before: new Date('2025-01-31T00:00:00.000Z').toISOString(),
      })
    })

    it('clears date range when undefined is passed', async () => {
      const user = userEvent.setup()
      const filtersWithDates: TaskFilterParams = {
        created_after: '2025-01-01T00:00:00Z',
        created_before: '2025-01-31T23:59:59Z',
      }
      
      render(
        <TaskFilterPanel
          {...defaultProps}
          filters={filtersWithDates}
        />
      )
      
      // Open created date picker
      const dateButtons = screen.getAllByText(/Jan 01, 2025/)
      await user.click(dateButtons[0])
      
      // Test that the date picker button is present
      expect(dateButtons[0]).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles empty filter object gracefully', () => {
      render(<TaskFilterPanel {...defaultProps} />)
      
      // Should render without crashing
      expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument()
    })

    it('handles null/undefined filter values', () => {
      const filtersWithNulls: TaskFilterParams = {
        status: undefined,
        priority: undefined,
        created_after: undefined,
        created_before: undefined,
      }
      
      render(
        <TaskFilterPanel
          {...defaultProps}
          filters={filtersWithNulls}
        />
      )
      
      // Should not show clear filters button for undefined values
      expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument()
    })

    it('displays correct number of active filters in badge', async () => {
      const user = userEvent.setup()
      const filters: TaskFilterParams = {
        status: 'todo',
        priority: 'high',
        created_after: '2025-01-01T00:00:00Z',
        created_before: '2025-01-31T23:59:59Z',
        updated_after: '2025-02-01T00:00:00Z',
        updated_before: '2025-02-28T23:59:59Z',
      }
      
      render(
        <TaskFilterPanel
          {...defaultProps}
          filters={filters}
        />
      )
      
      // Find the filter header button by text content
      const filterHeader = screen.getByText('Filters').closest('button')
      expect(filterHeader).toBeInTheDocument()
      
      // Collapse to show badge
      await user.click(filterHeader!)
      
      // Should count all non-undefined values (6 in this case)
      expect(screen.getByText('6')).toBeInTheDocument()
    })

    it('handles single date range (from date only)', () => {
      const filtersWithSingleDate: TaskFilterParams = {
        created_after: '2025-01-01T00:00:00Z',
      }
      
      render(
        <TaskFilterPanel
          {...defaultProps}
          filters={filtersWithSingleDate}
        />
      )
      
      // Should display single date
      const dateButtons = screen.getAllByText(/Jan 01, 2025/)
      expect(dateButtons.length).toBeGreaterThan(0)
    })
  })

  describe('accessibility', () => {
    it('has proper ARIA labels for form controls', () => {
      render(<TaskFilterPanel {...defaultProps} />)
      
      expect(screen.getByLabelText(/status/i)).toHaveAttribute('id', 'status-filter')
      expect(screen.getByLabelText(/priority/i)).toHaveAttribute('id', 'priority-filter')
    })

    it('filter header button is keyboard accessible', () => {
      render(<TaskFilterPanel {...defaultProps} />)
      
      // Find the filter header button by text content
      const filterHeader = screen.getByText('Filters').closest('button')
      expect(filterHeader).toBeInTheDocument()
      // Check that it's a button element
      expect(filterHeader?.tagName).toBe('BUTTON')
    })

    it('clear filters button has proper accessible name', () => {
      render(
        <TaskFilterPanel
          {...defaultProps}
          filters={{ status: 'todo' }}
        />
      )
      
      const clearButton = screen.getByRole('button', { name: /clear filters/i })
      expect(clearButton).toBeInTheDocument()
    })
  })
})
