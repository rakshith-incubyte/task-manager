"use client"

import { type ReactElement, useRef } from 'react'
import { motion } from 'motion/react'
import { KanbanSquare, Table as TableIcon, Plus, Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type ViewMode = 'grid' | 'table'
type ExportFormat = 'json' | 'csv'

type TaskToolbarProps = {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onCreateTask: () => void
  onExport?: (format: ExportFormat) => void
  onImport?: (file: File) => void
  isExporting?: boolean
  isImporting?: boolean
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
  onExport,
  onImport,
  isExporting = false,
  isImporting = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && onImport) {
      onImport(file)
      // Reset input to allow importing the same file again
      event.target.value = ''
    }
  }

  return (
    <div className="flex items-center justify-between">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="flex gap-2"
      >
        <Button onClick={onCreateTask} className="gap-2" size="default">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>

        {onExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={isExporting}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onExport('json')}>
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {onImport && (
          <>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleImportClick}
              disabled={isImporting}
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Import tasks file"
            />
          </>
        )}
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
