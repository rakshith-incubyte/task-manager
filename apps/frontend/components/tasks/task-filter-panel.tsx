"use client"

import { useState, type ChangeEvent } from 'react'
import { Filter, X, ChevronDown, ChevronUp, Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { TaskFilterParams, TaskStatus, TaskPriority } from '@/lib/api-client'

type TaskFilterPanelProps = {
  filters: TaskFilterParams
  onFilterChange: (filters: Partial<TaskFilterParams>) => void
  onClearFilters: () => void
}

const STATUS_OPTIONS: Array<{ value: TaskStatus | ''; label: string }> = [
  { value: '', label: 'All Statuses' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

const PRIORITY_OPTIONS: Array<{ value: TaskPriority | ''; label: string }> = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

/**
 * TaskFilterPanel component - provides UI for filtering tasks
 * Follows Single Responsibility Principle - handles only filter UI
 */
export const TaskFilterPanel: React.FC<TaskFilterPanelProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasActiveFilters = Object.values(filters).some(value => value !== undefined)

  const [createdDateRange, setCreatedDateRange] = useState<DateRange | undefined>({
    from: filters.created_after ? new Date(filters.created_after) : undefined,
    to: filters.created_before ? new Date(filters.created_before) : undefined,
  })

  const [updatedDateRange, setUpdatedDateRange] = useState<DateRange | undefined>({
    from: filters.updated_after ? new Date(filters.updated_after) : undefined,
    to: filters.updated_before ? new Date(filters.updated_before) : undefined,
  })

  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const value = e.target.value as TaskStatus | ''
    onFilterChange({ status: value || undefined })
  }

  const handlePriorityChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const value = e.target.value as TaskPriority | ''
    onFilterChange({ priority: value || undefined })
  }

  const handleCreatedDateRangeChange = (range: DateRange | undefined): void => {
    setCreatedDateRange(range)
    onFilterChange({
      created_after: range?.from ? range.from.toISOString() : undefined,
      created_before: range?.to ? range.to.toISOString() : undefined,
    })
  }

  const handleUpdatedDateRangeChange = (range: DateRange | undefined): void => {
    setUpdatedDateRange(range)
    onFilterChange({
      updated_after: range?.from ? range.from.toISOString() : undefined,
      updated_before: range?.to ? range.to.toISOString() : undefined,
    })
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Filters</h3>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          {hasActiveFilters && !isExpanded && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {Object.values(filters).filter(v => v !== undefined).length}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {isExpanded && (
      <div className="grid gap-4 p-4 pt-0 sm:grid-cols-2 lg:grid-cols-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <label htmlFor="status-filter" className="text-sm font-medium">
            Status
          </label>
          <select
            id="status-filter"
            value={filters.status || ''}
            onChange={handleStatusChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="space-y-2">
          <label htmlFor="priority-filter" className="text-sm font-medium">
            Priority
          </label>
          <select
            id="priority-filter"
            value={filters.priority || ''}
            onChange={handlePriorityChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {PRIORITY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Created Date Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Created Date Range</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !createdDateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {createdDateRange?.from ? (
                  createdDateRange.to ? (
                    <>
                      {format(createdDateRange.from, "LLL dd, y")} -{" "}
                      {format(createdDateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(createdDateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={createdDateRange?.from}
                selected={createdDateRange}
                onSelect={handleCreatedDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Updated Date Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Updated Date Range</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !updatedDateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {updatedDateRange?.from ? (
                  updatedDateRange.to ? (
                    <>
                      {format(updatedDateRange.from, "LLL dd, y")} -{" "}
                      {format(updatedDateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(updatedDateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={updatedDateRange?.from}
                selected={updatedDateRange}
                onSelect={handleUpdatedDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      )}
    </div>
  )
}
