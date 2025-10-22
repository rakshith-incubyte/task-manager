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
      className={`transition-all duration-200 ${
        isOver ? 'ring-2 ring-primary ring-offset-2 bg-accent/50' : ''
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle role="heading" aria-level={2}>
          {label}
        </CardTitle>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <Badge variant="outline">{tasks.length}</Badge>
        </motion.div>
      </CardHeader>
      <CardContent
        ref={setNodeRef}
        className="space-y-3 min-h-[200px] transition-colors"
      >
        {tasks.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground text-center py-8"
          >
            {isOver ? 'Drop here' : 'No tasks yet.'}
          </motion.p>
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
