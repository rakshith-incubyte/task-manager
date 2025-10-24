import { useState, useMemo } from 'react'
import type { TaskFilterParams, TaskStatus, TaskPriority } from '@/lib/api-client'

type UseTaskFiltersReturn = {
  filters: TaskFilterParams
  hasActiveFilters: boolean
  setStatusFilter: (status: TaskStatus | undefined) => void
  setPriorityFilter: (priority: TaskPriority | undefined) => void
  setDateRangeFilter: (createdAfter: string | undefined, createdBefore: string | undefined) => void
  setUpdatedDateRangeFilter: (updatedAfter: string | undefined, updatedBefore: string | undefined) => void
  clearFilters: () => void
}

/**
 * Hook for managing task filter state
 * Follows Single Responsibility Principle - handles only filter state management
 */
export const useTaskFilters = (): UseTaskFiltersReturn => {
  const [filters, setFilters] = useState<TaskFilterParams>({})

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value !== undefined)
  }, [filters])

  const setStatusFilter = (status: TaskStatus | undefined): void => {
    setFilters(prev => {
      if (status === undefined) {
        const { status: _, ...rest } = prev
        return rest
      }
      return { ...prev, status }
    })
  }

  const setPriorityFilter = (priority: TaskPriority | undefined): void => {
    setFilters(prev => {
      if (priority === undefined) {
        const { priority: _, ...rest } = prev
        return rest
      }
      return { ...prev, priority }
    })
  }

  const setDateRangeFilter = (
    createdAfter: string | undefined,
    createdBefore: string | undefined
  ): void => {
    setFilters(prev => {
      const newFilters = { ...prev }
      
      if (createdAfter === undefined) {
        delete newFilters.created_after
      } else {
        newFilters.created_after = createdAfter
      }
      
      if (createdBefore === undefined) {
        delete newFilters.created_before
      } else {
        newFilters.created_before = createdBefore
      }
      
      return newFilters
    })
  }

  const setUpdatedDateRangeFilter = (
    updatedAfter: string | undefined,
    updatedBefore: string | undefined
  ): void => {
    setFilters(prev => {
      const newFilters = { ...prev }
      
      if (updatedAfter === undefined) {
        delete newFilters.updated_after
      } else {
        newFilters.updated_after = updatedAfter
      }
      
      if (updatedBefore === undefined) {
        delete newFilters.updated_before
      } else {
        newFilters.updated_before = updatedBefore
      }
      
      return newFilters
    })
  }

  const clearFilters = (): void => {
    setFilters({})
  }

  return {
    filters,
    hasActiveFilters,
    setStatusFilter,
    setPriorityFilter,
    setDateRangeFilter,
    setUpdatedDateRangeFilter,
    clearFilters,
  }
}
