'use client'

import { useState } from 'react'
import { Task, TaskPaginationResponse, TaskStatus, TaskPriority } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type TaskListProps = {
  initialTasks: TaskPaginationResponse
  accessToken: string
}

const statusColors: Record<TaskStatus, string> = {
  todo: 'bg-gray-500',
  in_progress: 'bg-blue-500',
  done: 'bg-green-500',
}

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-gray-400',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
}

export const TaskList: React.FC<TaskListProps> = ({ initialTasks }) => {
  const [tasks] = useState<Task[]>(initialTasks.data)

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No tasks yet. Create your first task to get started!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle>{task.title}</CardTitle>
                {task.description && (
                  <CardDescription>{task.description}</CardDescription>
                )}
              </div>
              <div className="flex gap-2">
                <Badge className={statusColors[task.status]}>
                  {task.status.replace('_', ' ')}
                </Badge>
                <Badge className={priorityColors[task.priority]}>
                  {task.priority}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
              <span>Updated: {new Date(task.updated_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
