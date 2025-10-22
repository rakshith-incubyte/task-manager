"use client"

import { useState } from 'react'
import { TaskPaginationResponse, TaskStatus, updateTask } from '@/lib/api-client'
import { useTaskDnd } from '@/hooks/use-task-dnd'
import { useTaskModals } from '@/hooks/use-task-modals'
import { useTaskManager } from '@/hooks/use-task-manager'
import { useToast } from '@/hooks/use-toast'
import { type TaskFormData } from '@/lib/task-form-validation'
import { TaskToolbar } from '@/components/tasks/task-toolbar'
import { TaskGridView } from '@/components/tasks/task-grid-view'
import { TaskTableView } from '@/components/tasks/task-table-view'
import { TaskEmptyState } from '@/components/tasks/task-empty-state'
import { TaskModal } from '@/components/tasks/task-modal'
import { DeleteTaskDialog } from '@/components/tasks/delete-task-dialog'
import { ToastContainer } from '@/components/ui/toast-container'

type TaskListProps = {
  initialTasks: TaskPaginationResponse
  accessToken: string
}

type ViewMode = 'grid' | 'table'

/**
 * Main TaskList component - orchestrates task management UI
 * Follows SOLID principles by delegating responsibilities to specialized hooks and components
 */
export const TaskList: React.FC<TaskListProps> = ({ initialTasks, accessToken }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const { toasts, removeToast } = useToast()

  // Drag and drop functionality
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus): Promise<void> => {
    await updateTask(accessToken, taskId, { status: newStatus })
  }
  const { tasks, tasksByStatus, handleDragEnd, setTasks } = useTaskDnd(
    initialTasks.data,
    handleStatusChange
  )

  // Modal state management
  const {
    isCreateModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    selectedTask,
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    openDeleteDialog,
    closeDeleteDialog,
  } = useTaskModals()

  // Task management with state updates and notifications
  const { showToast } = useToast()
  const { isDeleting, handleCreateTask, handleUpdateTask, handleDeleteTask } = useTaskManager({
    accessToken,
    setTasks,
    showToast,
  })

  // Event handlers
  const onSubmitTask = async (data: TaskFormData): Promise<void> => {
    if (isEditModalOpen && selectedTask) {
      await handleUpdateTask(selectedTask.id, data)
      closeEditModal()
    } else {
      await handleCreateTask(data)
      closeCreateModal()
    }
  }

  const onConfirmDelete = async (): Promise<void> => {
    if (!selectedTask) return
    await handleDeleteTask(selectedTask.id)
    closeDeleteDialog()
  }

  // Determine modal state
  const isModalOpen = isCreateModalOpen || isEditModalOpen
  const modalMode = isEditModalOpen ? 'edit' : 'create'
  const closeModal = isEditModalOpen ? closeEditModal : closeCreateModal

  // Render view based on mode
  const renderTasksView = () => {
    if (tasks.length === 0) {
      return <TaskEmptyState onCreateTask={openCreateModal} />
    }

    return viewMode === 'grid' ? (
      <TaskGridView
        tasksByStatus={tasksByStatus}
        tasks={tasks}
        onDragEnd={handleDragEnd}
        onEditTask={openEditModal}
        onDeleteTask={openDeleteDialog}
      />
    ) : (
      <TaskTableView
        tasks={tasks}
        onEditTask={openEditModal}
        onDeleteTask={openDeleteDialog}
      />
    )
  }

  return (
    <div className="space-y-4">
      <TaskToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateTask={openCreateModal}
      />

      {renderTasksView()}

      <TaskModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={onSubmitTask}
        initialTask={selectedTask || undefined}
        mode={modalMode}
      />

      <DeleteTaskDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={onConfirmDelete}
        taskTitle={selectedTask?.title || ''}
        isDeleting={isDeleting}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

