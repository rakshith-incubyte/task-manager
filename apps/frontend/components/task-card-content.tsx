"use client"

import { Task, TaskStatus, TaskPriority } from '@/lib/api-client'
import { Badge } from '@/components/ui/badge'
import { GripVertical } from 'lucide-react'

type TaskCardContentProps = {
  task: Task
  statusColors: Record<TaskStatus, string>
  priorityColors: Record<TaskPriority, string>
  statusLabels: Record<TaskStatus, string>
  showGrip?: boolean
  gripListeners?: any
}

export const TaskCardContent: React.FC<TaskCardContentProps> = ({
  task,
  statusColors,
  priorityColors,
  statusLabels,
  showGrip = true,
  gripListeners,
}) => {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          {showGrip && (
            <div
              {...gripListeners}
              className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <GripVertical className="size-4" />
            </div>
          )}
          <div className="space-y-1 flex-1">
            <h3 className="text-base font-semibold">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-muted-foreground">{task.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Badge className={statusColors[task.status]}>
            {statusLabels[task.status]}
          </Badge>
          <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
        <span>Updated: {new Date(task.updated_at).toLocaleDateString()}</span>
      </div>
    </>
  )
}
