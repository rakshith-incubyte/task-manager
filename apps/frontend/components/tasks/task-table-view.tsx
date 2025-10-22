"use client"

import { motion } from 'motion/react'
import { Pencil, Trash2 } from 'lucide-react'
import { Task } from '@/lib/api-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { STATUS_COLORS, PRIORITY_COLORS, STATUS_LABELS } from '@/lib/task-constants'

type TaskTableViewProps = {
  tasks: Task[]
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
}

/**
 * Table view component for displaying tasks in tabular format
 * Follows Single Responsibility Principle - handles only table view rendering
 */
export const TaskTableView: React.FC<TaskTableViewProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
}) => {
  return (
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
                <Badge className={STATUS_COLORS[task.status]}>
                  {STATUS_LABELS[task.status]}
                </Badge>
              </td>
              <td className="px-4 py-3 text-sm">
                <Badge className={PRIORITY_COLORS[task.priority]}>
                  {task.priority}
                </Badge>
              </td>
              <td className="px-4 py-3 text-sm">
                {new Date(task.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-sm">
                {new Date(task.updated_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEditTask(task)}
                    className="h-8 w-8 p-0"
                    aria-label="Edit task"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteTask(task)}
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
}
