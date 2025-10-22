import { useCallback } from 'react'
import {
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  type CreateTaskRequest,
  type UpdateTaskRequest,
} from '@/lib/api-client'

type UseTaskActionsReturn = {
  createTask: (data: CreateTaskRequest) => Promise<void>
  updateTask: (taskId: string, data: UpdateTaskRequest) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
}

/**
 * Hook for managing task CRUD operations
 * Follows Single Responsibility Principle - handles only task actions
 */
export const useTaskActions = (
  accessToken: string,
  onSuccess: () => void,
  onError: (error: Error) => void
): UseTaskActionsReturn => {
  const createTask = useCallback(
    async (data: CreateTaskRequest): Promise<void> => {
      try {
        await apiCreateTask(accessToken, data)
        onSuccess()
      } catch (error) {
        onError(error as Error)
      }
    },
    [accessToken, onSuccess, onError]
  )

  const updateTask = useCallback(
    async (taskId: string, data: UpdateTaskRequest): Promise<void> => {
      try {
        await apiUpdateTask(accessToken, taskId, data)
        onSuccess()
      } catch (error) {
        onError(error as Error)
      }
    },
    [accessToken, onSuccess, onError]
  )

  const deleteTask = useCallback(
    async (taskId: string): Promise<void> => {
      try {
        await apiDeleteTask(accessToken, taskId)
        onSuccess()
      } catch (error) {
        onError(error as Error)
      }
    },
    [accessToken, onSuccess, onError]
  )

  return {
    createTask,
    updateTask,
    deleteTask,
  }
}
