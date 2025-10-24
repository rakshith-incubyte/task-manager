"use client"

import { useState, useEffect } from 'react'
import { TaskPaginationResponse, TaskStatus, updateTask, Task, getAllTasks, getTasks } from '@/lib/api-client'
import { useTaskDnd } from '@/hooks/use-task-dnd'
import { useTaskModals } from '@/hooks/use-task-modals'
import { useTaskManager } from '@/hooks/use-task-manager'
import { useToast } from '@/hooks/use-toast'
import { useTaskExportImport } from '@/hooks/use-task-export-import'
import { useTaskFilters } from '@/hooks/use-task-filters'
import { type TaskFormData } from '@/lib/task-form-validation'
import { TaskToolbar } from '@/components/tasks/task-toolbar'
import { TaskFilterPanel } from '@/components/tasks/task-filter-panel'
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
  const [isLoadingFiltered, setIsLoadingFiltered] = useState(false)
  const { toasts, removeToast } = useToast()

  // Filter functionality
  const {
    filters,
    hasActiveFilters,
    setStatusFilter,
    setPriorityFilter,
    setDateRangeFilter,
    setUpdatedDateRangeFilter,
    clearFilters,
  } = useTaskFilters()

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

  // Export/Import functionality
  const { isExporting, isImporting, exportTasks, importTasks, error: exportImportError } = useTaskExportImport()

  // Fetch filtered tasks when filters change
  useEffect(() => {
    const fetchFilteredTasks = async (): Promise<void> => {
      if (!hasActiveFilters) {
        setTasks(initialTasks.data)
        return
      }

      setIsLoadingFiltered(true)
      try {
        const response = await getTasks(accessToken, filters)
        setTasks(response.data)
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to fetch filtered tasks', 'error')
      } finally {
        setIsLoadingFiltered(false)
      }
    }

    fetchFilteredTasks()
  }, [filters, hasActiveFilters, accessToken, initialTasks.data, setTasks, showToast])

  // Event handlers
  const handleFilterChange = (newFilters: Partial<typeof filters>): void => {
    // Handle status filter (including "All" which sets it to undefined)
    if ('status' in newFilters) {
      setStatusFilter(newFilters.status)
    }
    
    // Handle priority filter (including "All" which sets it to undefined)
    if ('priority' in newFilters) {
      setPriorityFilter(newFilters.priority)
    }
    
    // Handle created date range
    if ('created_after' in newFilters || 'created_before' in newFilters) {
      setDateRangeFilter(newFilters.created_after, newFilters.created_before)
    }
    
    // Handle updated date range
    if ('updated_after' in newFilters || 'updated_before' in newFilters) {
      setUpdatedDateRangeFilter(newFilters.updated_after, newFilters.updated_before)
    }
  }

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

  const handleExport = async (format: 'json' | 'csv'): Promise<void> => {
    try {
      console.log('Fetching all tasks from API for export...')
      
      // Fetch ALL tasks from backend API
      const allTasks = await getAllTasks(accessToken)
      console.log(`Fetched ${allTasks.length} tasks from API`)
      
      // Export the tasks
      exportTasks(allTasks, format)
      showToast(`${allTasks.length} task(s) exported as ${format.toUpperCase()}`, 'success')
    } catch (error) {
      console.error('Export error:', error)
      showToast(error instanceof Error ? error.message : 'Failed to export tasks', 'error')
    }
  }

  const handleImport = async (file: File): Promise<void> => {
    console.log('Import started:', file.name, file.type, file.size)
    
    try {
      const importedTasks = await importTasks(file)
      console.log('Tasks imported successfully:', importedTasks.length, importedTasks)
      
      // Filter out tasks that already exist (by title to avoid ID conflicts)
      const existingTitles = new Set(tasks.map(t => t.title.toLowerCase()))
      const newTasks = importedTasks.filter(t => !existingTitles.has(t.title.toLowerCase()))
      
      console.log('New tasks after deduplication:', newTasks.length)
      
      if (newTasks.length === 0) {
        showToast('All tasks in the file already exist', 'info')
        return
      }

      // Create tasks via API
      let successCount = 0
      let failCount = 0
      
      for (const task of newTasks) {
        try {
          const taskData = {
            title: task.title,
            description: task.description || '', // Convert null to empty string
            status: task.status,
            priority: task.priority,
          }
          
          await handleCreateTask(taskData)
          successCount++
        } catch (error) {
          console.error('Failed to create task:', task.title, error)
          failCount++
        }
      }
      
      if (successCount > 0) {
        showToast(`${successCount} task(s) imported successfully`, 'success')
      }
      
      if (failCount > 0) {
        showToast(`${failCount} task(s) failed to import`, 'error')
      }
    } catch (error) {
      console.error('Import error:', error)
      showToast(error instanceof Error ? error.message : 'Failed to import tasks', 'error')
    }
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
        onExport={handleExport}
        onImport={handleImport}
        isExporting={isExporting}
        isImporting={isImporting}
      />

      <TaskFilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      {isLoadingFiltered && (
        <div className="text-center text-muted-foreground">Loading filtered tasks...</div>
      )}

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

