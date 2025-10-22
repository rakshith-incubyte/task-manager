"use client"

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'motion/react'
import { Pencil, Trash2 } from 'lucide-react'
import { Task, TaskStatus, TaskPriority } from '@/lib/api-client'
import { TaskCardContent } from '@/components/tasks/task-card-content'
import { Button } from '@/components/ui/button'

type DraggableTaskCardProps = {
  task: Task
  statusColors: Record<TaskStatus, string>
  priorityColors: Record<TaskPriority, string>
  statusLabels: Record<TaskStatus, string>
  onEdit?: (task: Task) => void
  onDelete?: (task: Task) => void
}

export const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({
  task,
  statusColors,
  priorityColors,
  statusLabels,
  onEdit,
  onDelete,
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

  const handleEdit = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onEdit?.(task)
  }

  const handleDelete = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onDelete?.(task)
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
      className={`rounded-xl border bg-card shadow-sm hover:shadow-md transition-all group relative overflow-hidden ${
        isDragging ? 'invisible' : ''
      }`}
    >
      {/* Action buttons - top right corner */}
      <div className="absolute top-1.5 right-1.5 flex gap-1 z-10">
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEdit}
            className="h-6 w-6 p-0 rounded-md hover:bg-primary/20 bg-primary/10 text-primary shadow-sm"
            aria-label="Edit task"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            className="h-6 w-6 p-0 rounded-md hover:bg-destructive/20 bg-destructive/10 text-destructive shadow-sm"
            aria-label="Delete task"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </motion.div>
      </div>

      {/* Draggable content area */}
      <div className="p-3 sm:p-4 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <TaskCardContent
          task={task}
          statusColors={statusColors}
          priorityColors={priorityColors}
          statusLabels={statusLabels}
          showGrip={false}
        />
      </div>
    </motion.div>
  )
}
