"use client"

import { useState, type ReactElement } from 'react'
import { DndContext, DragOverlay, closestCorners, DragStartEvent } from '@dnd-kit/core'
import { KanbanSquare, Table as TableIcon } from 'lucide-react'
import { Task, TaskPaginationResponse, TaskStatus, TaskPriority, updateTask } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { DroppableColumn } from '@/components/droppable-column'
import { useTaskDnd } from '@/hooks/use-task-dnd'
import { TaskCardContent } from '@/components/task-card-content'

type TaskListProps = {
  initialTasks: TaskPaginationResponse
  accessToken: string
}

type ViewMode = 'grid' | 'table'

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

const statusLabels: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

const statusOrder: TaskStatus[] = ['todo', 'in_progress', 'done']

const viewModes: Array<{ id: ViewMode; label: string; icon: ReactElement }> = [
  { id: 'grid', label: 'Grid view', icon: <KanbanSquare className="size-4" aria-hidden /> },
  { id: 'table', label: 'Table view', icon: <TableIcon className="size-4" aria-hidden /> },
]

export const TaskList: React.FC<TaskListProps> = ({ initialTasks, accessToken }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus): Promise<void> => {
    await updateTask(accessToken, taskId, { status: newStatus })
  }

  const { tasks, tasksByStatus, handleDragEnd } = useTaskDnd(initialTasks.data, handleStatusChange)

  const handleDragStart = (event: DragStartEvent): void => {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEndWrapper = async (event: any): Promise<void> => {
    await handleDragEnd(event)
    // Small delay to ensure state update is rendered before clearing overlay
    setTimeout(() => setActiveTask(null),50)
  }

  const gridView = (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEndWrapper}
      collisionDetection={closestCorners}
    >
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        {statusOrder.map((status) => (
          <DroppableColumn
            key={status}
            status={status}
            label={statusLabels[status]}
            tasks={tasksByStatus[status]}
            statusColors={statusColors}
            priorityColors={priorityColors}
            statusLabels={statusLabels}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="rounded-xl border-2 border-primary/20 bg-card p-3 sm:p-4 shadow-2xl cursor-grabbing rotate-2 scale-105">
            <TaskCardContent
              task={activeTask}
              statusColors={statusColors}
              priorityColors={priorityColors}
              statusLabels={statusLabels}
              showGrip={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )

  const tableView = (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full table-fixed" aria-label="Tasks table" role="table">
        <thead className="bg-muted text-left">
          <tr>
            <th className="px-4 py-3 text-sm font-semibold">Title</th>
            <th className="px-4 py-3 text-sm font-semibold">Status</th>
            <th className="px-4 py-3 text-sm font-semibold">Priority</th>
            <th className="px-4 py-3 text-sm font-semibold">Created</th>
            <th className="px-4 py-3 text-sm font-semibold">Updated</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-t">
              <td className="px-4 py-3 text-sm font-medium">{task.title}</td>
              <td className="px-4 py-3 text-sm">
                <Badge className={statusColors[task.status]}>{statusLabels[task.status]}</Badge>
              </td>
              <td className="px-4 py-3 text-sm">
                <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
              </td>
              <td className="px-4 py-3 text-sm">{new Date(task.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-sm">{new Date(task.updated_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <ButtonGroup aria-label="Task view mode">
          {viewModes.map((mode) => (
            <Button
              key={mode.id}
              type="button"
              variant={viewMode === mode.id ? 'default' : 'outline'}
              aria-pressed={viewMode === mode.id}
              onClick={() => setViewMode(mode.id)}
            >
              {mode.icon}
              <span className="sr-only">{mode.label}</span>
            </Button>
          ))}
        </ButtonGroup>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No tasks yet. Create your first task to get started!
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        gridView
      ) : (
        tableView
      )}
    </div>
  )
}

