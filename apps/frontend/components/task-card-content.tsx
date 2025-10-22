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
    <div className="space-y-3">
      {/* Header with title and priority badge */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold break-words line-clamp-2 flex-1 min-w-0">
          {task.title}
        </h3>
        <Badge 
          variant="secondary"
          className={`${priorityColors[task.priority]} text-white flex-shrink-0 text-xs`}
        >
          {task.priority}
        </Badge>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground break-words line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer with status and dates */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t">
        <Badge 
          variant="outline"
          className={`${statusColors[task.status]} text-white border-0 text-xs`}
        >
          {statusLabels[task.status]}
        </Badge>
        <div className="text-[10px] text-muted-foreground/70 text-right">
          <div>{new Date(task.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        </div>
      </div>
    </div>
  )
}
