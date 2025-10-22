"use client"

import { useDroppable } from '@dnd-kit/core'
import { motion, AnimatePresence } from 'motion/react'
import { Task, TaskStatus, TaskPriority } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DraggableTaskCard } from '@/components/draggable-task-card'

type DroppableColumnProps = {
  status: TaskStatus
  label: string
  tasks: Task[]
  statusColors: Record<TaskStatus, string>
  priorityColors: Record<TaskPriority, string>
  statusLabels: Record<TaskStatus, string>
}

export const DroppableColumn: React.FC<DroppableColumnProps> = ({
  status,
  label,
  tasks,
  statusColors,
  priorityColors,
  statusLabels,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <Card
      className={`transition-all duration-200 rounded-xl border-2 ${
        isOver ? 'ring-2 ring-primary/50 ring-offset-2 bg-accent/30 border-primary/50' : 'border-border'
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle role="heading" aria-level={2} className="text-base font-semibold">
          {label}
        </CardTitle>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <Badge variant="secondary" className="text-xs font-medium">{tasks.length}</Badge>
        </motion.div>
      </CardHeader>
      <CardContent
        ref={setNodeRef}
        className="space-y-2 min-h-[300px] sm:min-h-[400px] transition-colors"
      >
        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center h-full min-h-[200px]"
          >
            <p className="text-xs text-muted-foreground/60 text-center">
              {isOver ? '✨ Drop here' : 'No tasks yet'}
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              statusColors={statusColors}
              priorityColors={priorityColors}
              statusLabels={statusLabels}
            />
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
