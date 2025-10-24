import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTaskFilters } from '../use-task-filters'
import type { TaskStatus, TaskPriority } from '@/lib/api-client'

describe('useTaskFilters', () => {
  it('initializes with empty filters', () => {
    const { result } = renderHook(() => useTaskFilters())

    expect(result.current.filters).toEqual({})
    expect(result.current.hasActiveFilters).toBe(false)
  })

  it('sets status filter', () => {
    const { result } = renderHook(() => useTaskFilters())

    act(() => {
      result.current.setStatusFilter('todo')
    })

    expect(result.current.filters.status).toBe('todo')
    expect(result.current.hasActiveFilters).toBe(true)
  })

  it('sets priority filter', () => {
    const { result } = renderHook(() => useTaskFilters())

    act(() => {
      result.current.setPriorityFilter('high')
    })

    expect(result.current.filters.priority).toBe('high')
    expect(result.current.hasActiveFilters).toBe(true)
  })

  it('sets date range filter', () => {
    const { result } = renderHook(() => useTaskFilters())
    const startDate = '2024-01-01T00:00:00Z'
    const endDate = '2024-12-31T23:59:59Z'

    act(() => {
      result.current.setDateRangeFilter(startDate, endDate)
    })

    expect(result.current.filters.created_after).toBe(startDate)
    expect(result.current.filters.created_before).toBe(endDate)
    expect(result.current.hasActiveFilters).toBe(true)
  })

  it('sets updated date range filter', () => {
    const { result } = renderHook(() => useTaskFilters())
    const startDate = '2024-01-01T00:00:00Z'
    const endDate = '2024-12-31T23:59:59Z'

    act(() => {
      result.current.setUpdatedDateRangeFilter(startDate, endDate)
    })

    expect(result.current.filters.updated_after).toBe(startDate)
    expect(result.current.filters.updated_before).toBe(endDate)
    expect(result.current.hasActiveFilters).toBe(true)
  })

  it('clears all filters', () => {
    const { result } = renderHook(() => useTaskFilters())

    act(() => {
      result.current.setStatusFilter('todo')
      result.current.setPriorityFilter('high')
      result.current.setDateRangeFilter('2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z')
    })

    expect(result.current.hasActiveFilters).toBe(true)

    act(() => {
      result.current.clearFilters()
    })

    expect(result.current.filters).toEqual({})
    expect(result.current.hasActiveFilters).toBe(false)
  })

  it('clears specific filter', () => {
    const { result } = renderHook(() => useTaskFilters())

    act(() => {
      result.current.setStatusFilter('todo')
      result.current.setPriorityFilter('high')
    })

    expect(result.current.filters.status).toBe('todo')
    expect(result.current.filters.priority).toBe('high')

    act(() => {
      result.current.setStatusFilter(undefined)
    })

    expect(result.current.filters.status).toBeUndefined()
    expect(result.current.filters.priority).toBe('high')
    expect(result.current.hasActiveFilters).toBe(true)
  })

  it('handles multiple filters simultaneously', () => {
    const { result } = renderHook(() => useTaskFilters())

    act(() => {
      result.current.setStatusFilter('in_progress')
      result.current.setPriorityFilter('medium')
      result.current.setDateRangeFilter('2024-01-01T00:00:00Z', '2024-06-30T23:59:59Z')
    })

    expect(result.current.filters).toEqual({
      status: 'in_progress',
      priority: 'medium',
      created_after: '2024-01-01T00:00:00Z',
      created_before: '2024-06-30T23:59:59Z',
    })
    expect(result.current.hasActiveFilters).toBe(true)
  })

  it('detects active filters correctly', () => {
    const { result } = renderHook(() => useTaskFilters())

    expect(result.current.hasActiveFilters).toBe(false)

    act(() => {
      result.current.setStatusFilter('todo')
    })

    expect(result.current.hasActiveFilters).toBe(true)

    act(() => {
      result.current.setStatusFilter(undefined)
    })

    expect(result.current.hasActiveFilters).toBe(false)
  })
})
