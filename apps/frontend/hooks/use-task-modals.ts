import { useState, useCallback } from 'react'
import { Task } from '@/lib/api-client'

type ModalState = {
  isCreateModalOpen: boolean
  isEditModalOpen: boolean
  isDeleteDialogOpen: boolean
  selectedTask: Task | null
}

type ModalActions = {
  openCreateModal: () => void
  closeCreateModal: () => void
  openEditModal: (task: Task) => void
  closeEditModal: () => void
  openDeleteDialog: (task: Task) => void
  closeDeleteDialog: () => void
}

/**
 * Custom hook for managing task modal states
 * Follows Single Responsibility Principle - handles only modal state management
 */
export const useTaskModals = (): ModalState & ModalActions => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const openCreateModal = useCallback(() => {
    setIsCreateModalOpen(true)
  }, [])

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false)
  }, [])

  const openEditModal = useCallback((task: Task) => {
    setSelectedTask(task)
    setIsEditModalOpen(true)
  }, [])

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false)
    setSelectedTask(null)
  }, [])

  const openDeleteDialog = useCallback((task: Task) => {
    setSelectedTask(task)
    setIsDeleteDialogOpen(true)
  }, [])

  const closeDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false)
    setSelectedTask(null)
  }, [])

  return {
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
  }
}
