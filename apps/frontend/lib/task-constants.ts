import { TaskStatus, TaskPriority } from '@/lib/api-client'

export const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'bg-gray-500',
  in_progress: 'bg-blue-500',
  done: 'bg-green-500',
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-gray-400',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

export const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'done']
