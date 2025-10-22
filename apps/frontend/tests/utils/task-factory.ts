import { Task, TaskStatus, TaskPriority } from '@/lib/api-client'

type TaskFactoryOptions = Partial<Task>

export const createTask = (options: TaskFactoryOptions = {}): Task => {
  const id = options.id || `task-${Math.random().toString(36).substr(2, 9)}`
  
  return {
    id,
    title: options.title || 'Test Task',
    description: options.description || 'Test Description',
    status: options.status || 'todo',
    priority: options.priority || 'medium',
    owner_id: options.owner_id || 'user-123',
    created_at: options.created_at || new Date().toISOString(),
    updated_at: options.updated_at || new Date().toISOString(),
  }
}

export const createTasks = (count: number, options: TaskFactoryOptions = {}): Task[] => {
  return Array.from({ length: count }, (_, index) => 
    createTask({ ...options, id: `task-${index}` })
  )
}
