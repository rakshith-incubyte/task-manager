"use client"

import { type ReactElement } from 'react'
import { motion } from 'motion/react'
import { KanbanSquare, Table as TableIcon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'

type ViewMode = 'grid' | 'table'

type TaskToolbarProps = {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onCreateTask: () => void
}

const VIEW_MODES: Array<{ id: ViewMode; label: string; icon: ReactElement }> = [
  { id: 'grid', label: 'Grid view', icon: <KanbanSquare className="size-4" aria-hidden /> },
  { id: 'table', label: 'Table view', icon: <TableIcon className="size-4" aria-hidden /> },
]

/**
 * Toolbar component for task list actions and view mode switching
 * Follows Single Responsibility Principle - handles only toolbar UI
 */
export const TaskToolbar: React.FC<TaskToolbarProps> = ({
  viewMode,
  onViewModeChange,
  onCreateTask,
}) => {
  return (
    <div className="flex items-center justify-between">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button onClick={onCreateTask} className="gap-2" size="default">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </motion.div>
      <ButtonGroup aria-label="Task view mode">
        {VIEW_MODES.map((mode) => (
          <Button
            key={mode.id}
            type="button"
            variant={viewMode === mode.id ? 'default' : 'outline'}
            aria-pressed={viewMode === mode.id}
            onClick={() => onViewModeChange(mode.id)}
          >
            {mode.icon}
            <span className="sr-only">{mode.label}</span>
          </Button>
        ))}
      </ButtonGroup>
    </div>
  )
}
