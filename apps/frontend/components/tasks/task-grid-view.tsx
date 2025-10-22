"use client"

import { useState } from 'react'
import { DndContext, DragOverlay, closestCorners, DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { Task, TaskStatus, TaskPriority } from '@/lib/api-client'
import { DroppableColumn } from '@/components/dnd/droppable-column'
import { TaskCardContent } from '@/components/tasks/task-card-content'
import { STATUS_ORDER, STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS } from '@/lib/task-constants'

type TaskGridViewProps = {
  tasksByStatus: Record<TaskStatus, Task[]>
  tasks: Task[]
  onDragEnd: (event: DragEndEvent) => Promise<void>
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
}

/**
 * Grid view component for displaying tasks in Kanban board layout
 * Follows Single Responsibility Principle - handles only grid view rendering
 */
export const TaskGridView: React.FC<TaskGridViewProps> = ({
  tasksByStatus,
  tasks,
  onDragEnd,
  onEditTask,
  onDeleteTask,
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const handleDragStart = (event: DragStartEvent): void => {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    await onDragEnd(event)
    setTimeout(() => setActiveTask(null), 50)
  }

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCorners}
    >
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        {STATUS_ORDER.map((status) => (
          <DroppableColumn
            key={status}
            status={status}
            label={STATUS_LABELS[status]}
            tasks={tasksByStatus[status]}
            statusColors={STATUS_COLORS}
            priorityColors={PRIORITY_COLORS}
            statusLabels={STATUS_LABELS}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="rounded-xl border-2 border-primary/20 bg-card p-3 sm:p-4 shadow-2xl cursor-grabbing rotate-2 scale-105">
            <TaskCardContent
              task={activeTask}
              statusColors={STATUS_COLORS}
              priorityColors={PRIORITY_COLORS}
              statusLabels={STATUS_LABELS}
              showGrip={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
