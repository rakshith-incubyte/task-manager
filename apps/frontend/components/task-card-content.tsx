"use client"

import { Task, TaskStatus, TaskPriority } from '@/lib/api-client'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'

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
      {/* Title */}
      <h3 className="text-sm font-semibold break-words line-clamp-2 leading-snug pr-16">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground break-words line-clamp-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer with badges and date */}
      <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
        <Badge 
          variant="outline"
          className={`${statusColors[task.status]} text-white border-0 text-xs`}
        >
          {statusLabels[task.status]}
        </Badge>
        <Badge 
          variant="secondary"
          className={`${priorityColors[task.priority]} text-white text-xs`}
        >
          {task.priority}
        </Badge>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 ml-auto">
          <Clock className="h-3 w-3" />
          <span>{new Date(task.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  )
}
