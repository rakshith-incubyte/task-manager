import { useState, useCallback } from 'react'
import { Task, TaskStatus } from '@/lib/api-client'
import { useTaskApi } from '@/hooks/use-task-api'
import { type TaskFormData } from '@/lib/task-form-validation'

type UseTaskManagerProps = {
  accessToken: string
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}

type UseTaskManagerReturn = {
  isDeleting: boolean
  handleCreateTask: (data: TaskFormData) => Promise<void>
  handleUpdateTask: (taskId: string, data: TaskFormData) => Promise<void>
  handleDeleteTask: (taskId: string) => Promise<void>
}

/**
 * Custom hook for managing task operations with state updates and notifications
 * Orchestrates API calls, local state updates, and user feedback
 */
export const useTaskManager = ({
  accessToken,
  setTasks,
  showToast,
}: UseTaskManagerProps): UseTaskManagerReturn => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSuccess = useCallback(
    (task?: Task, action?: 'create' | 'update' | 'delete', taskId?: string): void => {
      if (action === 'create' && task) {
        setTasks((prevTasks) => [...prevTasks, task])
        showToast('Task created successfully!', 'success')
      } else if (action === 'update' && task) {
        setTasks((prevTasks) => prevTasks.map((t) => (t.id === task.id ? task : t)))
        showToast('Task updated successfully!', 'success')
      } else if (action === 'delete' && taskId) {
        setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId))
        showToast('Task deleted successfully!', 'success')
      }
    },
    [setTasks, showToast]
  )

  const handleError = useCallback(
    (error: Error): void => {
      console.error('Task operation failed:', error)
      showToast(error.message, 'error')
    },
    [showToast]
  )

  const { createTask, updateTask, deleteTask } = useTaskApi(
    accessToken,
    handleSuccess,
    handleError
  )

  const handleCreateTask = useCallback(
    async (data: TaskFormData): Promise<void> => {
      await createTask(data)
    },
    [createTask]
  )

  const handleUpdateTask = useCallback(
    async (taskId: string, data: TaskFormData): Promise<void> => {
      await updateTask(taskId, data)
    },
    [updateTask]
  )

  const handleDeleteTask = useCallback(
    async (taskId: string): Promise<void> => {
      setIsDeleting(true)
      try {
        await deleteTask(taskId)
      } catch (error) {
        console.error('Delete failed:', error)
      } finally {
        setIsDeleting(false)
      }
    },
    [deleteTask]
  )

  return {
    isDeleting,
    handleCreateTask,
    handleUpdateTask,
    handleDeleteTask,
  }
}
