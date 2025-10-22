import { useMemo, useState } from 'react'
import { DragEndEvent } from '@dnd-kit/core'
import { Task, TaskStatus } from '@/lib/api-client'

type TasksByStatus = Record<TaskStatus, Task[]>

type UseTaskDndReturn = {
  tasks: Task[]
  tasksByStatus: TasksByStatus
  handleDragEnd: (event: DragEndEvent) => Promise<void>
}

export const useTaskDnd = (
  initialTasks: Task[],
  onStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>
): UseTaskDndReturn => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  const tasksByStatus = useMemo<TasksByStatus>(() => {
    return tasks.reduce<TasksByStatus>(
      (acc, task) => {
        acc[task.status].push(task)
        return acc
      },
      {
        todo: [],
        in_progress: [],
        done: [],
      }
    )
  }, [tasks])

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event

    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as TaskStatus
    
    // Find current task to get its actual current status
    const currentTask = tasks.find((t) => t.id === taskId)
    if (!currentTask) return
    
    const currentStatus = currentTask.status

    if (currentStatus === newStatus) return

    // Optimistic update
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    )

    try {
      await onStatusChange(taskId, newStatus)
    } catch (error) {
      // Rollback on error
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: currentStatus } : task
        )
      )
      throw error
    }
  }

  return {
    tasks,
    tasksByStatus,
    handleDragEnd,
  }
}
