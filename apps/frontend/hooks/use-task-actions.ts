import { useCallback } from 'react'
import {
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  type CreateTaskRequest,
  type UpdateTaskRequest,
  type Task,
} from '@/lib/api-client'

type UseTaskActionsReturn = {
  createTask: (data: CreateTaskRequest) => Promise<Task>
  updateTask: (taskId: string, data: UpdateTaskRequest) => Promise<Task>
  deleteTask: (taskId: string) => Promise<void>
}

/**
 * Hook for managing task CRUD operations
 * Follows Single Responsibility Principle - handles only task actions
 */
export const useTaskActions = (
  accessToken: string,
  onSuccess: (task?: Task, action?: 'create' | 'update' | 'delete', taskId?: string) => void,
  onError: (error: Error) => void
): UseTaskActionsReturn => {
  const createTask = useCallback(
    async (data: CreateTaskRequest): Promise<Task> => {
      try {
        const task = await apiCreateTask(accessToken, data)
        onSuccess(task, 'create')
        return task
      } catch (error) {
        onError(error as Error)
        throw error
      }
    },
    [accessToken, onSuccess, onError]
  )

  const updateTask = useCallback(
    async (taskId: string, data: UpdateTaskRequest): Promise<Task> => {
      try {
        const task = await apiUpdateTask(accessToken, taskId, data)
        onSuccess(task, 'update')
        return task
      } catch (error) {
        onError(error as Error)
        throw error
      }
    },
    [accessToken, onSuccess, onError]
  )

  const deleteTask = useCallback(
    async (taskId: string): Promise<void> => {
      try {
        await apiDeleteTask(accessToken, taskId)
        onSuccess(undefined, 'delete', taskId)
      } catch (error) {
        onError(error as Error)
        throw error
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
