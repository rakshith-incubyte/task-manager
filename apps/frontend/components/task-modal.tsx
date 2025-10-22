"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Task } from '@/lib/api-client'
import { TaskForm } from '@/components/task-form'
import { type TaskFormData } from '@/lib/task-form-validation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type TaskModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TaskFormData) => Promise<void>
  initialTask?: Task
  mode: 'create' | 'edit'
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialTask,
  mode,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: TaskFormData): Promise<void> => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      onClose()
    } catch (error) {
      console.error('Failed to submit task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = (): void => {
    if (!isSubmitting) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Create New Task' : 'Edit Task'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Fill in the details below to create a new task.'
                : 'Update the task details below.'}
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            initialTask={initialTask}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            isSubmitting={isSubmitting}
          />
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
