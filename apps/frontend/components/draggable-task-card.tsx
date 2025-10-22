"use client"

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'motion/react'
import { Task, TaskStatus, TaskPriority } from '@/lib/api-client'
import { TaskCardContent } from '@/components/task-card-content'

type DraggableTaskCardProps = {
  task: Task
  statusColors: Record<TaskStatus, string>
  priorityColors: Record<TaskPriority, string>
  statusLabels: Record<TaskStatus, string>
}

export const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({
  task,
  statusColors,
  priorityColors,
  statusLabels,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      status: task.status,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: isDragging ? 1 : 1.02 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl border bg-card p-3 sm:p-4 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'invisible' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <TaskCardContent
        task={task}
        statusColors={statusColors}
        priorityColors={priorityColors}
        statusLabels={statusLabels}
        showGrip={false}
      />
    </motion.div>
  )
}
