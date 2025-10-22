"use client"

import { useState, type ReactElement } from 'react'
import { DndContext, DragOverlay, closestCorners, DragStartEvent } from '@dnd-kit/core'
import { KanbanSquare, Table as TableIcon, Plus, Pencil, Trash2 } from 'lucide-react'
import { Task, TaskPaginationResponse, TaskStatus, TaskPriority, updateTask } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { DroppableColumn } from '@/components/droppable-column'
import { useTaskDnd } from '@/hooks/use-task-dnd'
import { TaskCardContent } from '@/components/task-card-content'
import { TaskModal } from '@/components/task-modal'
import { DeleteTaskDialog } from '@/components/delete-task-dialog'
import { useTaskActions } from '@/hooks/use-task-actions'
import { type TaskFormData } from '@/lib/task-form-validation'
import { motion } from 'motion/react'

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus): Promise<void> => {
    await updateTask(accessToken, taskId, { status: newStatus })
  }

  const { tasks, tasksByStatus, handleDragEnd, setTasks } = useTaskDnd(initialTasks.data, handleStatusChange)

  const handleSuccess = (): void => {
    // Refresh tasks by fetching from API
    window.location.reload()
  }

  const handleError = (error: Error): void => {
    console.error('Task operation failed:', error)
    alert(error.message)
  }

  const { createTask, updateTask: updateTaskAction, deleteTask: deleteTaskAction } = useTaskActions(
    accessToken,
    handleSuccess,
    handleError
  )

  const handleCreateTask = async (data: TaskFormData): Promise<void> => {
    await createTask(data)
  }

  const handleUpdateTask = async (data: TaskFormData): Promise<void> => {
    if (!selectedTask) return
    await updateTaskAction(selectedTask.id, data)
  }

  const handleEditClick = (task: Task): void => {
    setSelectedTask(task)
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (task: Task): void => {
    setSelectedTask(task)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async (): Promise<void> => {
    if (!selectedTask) return
    setIsDeleting(true)
    try {
      await deleteTaskAction(selectedTask.id)
      setIsDeleteDialogOpen(false)
      setSelectedTask(null)
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setIsDeleting(false)
    }
  }

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
            onEditTask={handleEditClick}
            onDeleteTask={handleDeleteClick}
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
            <th className="px-4 py-3 text-sm font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <motion.tr
              key={task.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="border-t hover:bg-accent/50 transition-colors"
            >
              <td className="px-4 py-3 text-sm font-medium">{task.title}</td>
              <td className="px-4 py-3 text-sm">
                <Badge className={statusColors[task.status]}>{statusLabels[task.status]}</Badge>
              </td>
              <td className="px-4 py-3 text-sm">
                <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
              </td>
              <td className="px-4 py-3 text-sm">{new Date(task.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-sm">{new Date(task.updated_at).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-sm">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditClick(task)}
                    className="h-8 w-8 p-0"
                    aria-label="Edit task"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteClick(task)}
                    className="h-8 w-8 p-0 hover:text-destructive"
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2"
            size="default"
          >
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </motion.div>
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
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                No tasks yet. Create your first task to get started!
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Task
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        gridView
      ) : (
        tableView
      )}

      <TaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
        mode="create"
      />

      <TaskModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedTask(null)
        }}
        onSubmit={handleUpdateTask}
        initialTask={selectedTask || undefined}
        mode="edit"
      />

      <DeleteTaskDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setSelectedTask(null)
        }}
        onConfirm={handleConfirmDelete}
        taskTitle={selectedTask?.title || ''}
        isDeleting={isDeleting}
      />
    </div>
  )
}

