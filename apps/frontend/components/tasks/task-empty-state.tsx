"use client"

import { Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type TaskEmptyStateProps = {
  onCreateTask: () => void
}

/**
 * Empty state component displayed when no tasks exist
 * Follows Single Responsibility Principle - handles only empty state UI
 */
export const TaskEmptyState: React.FC<TaskEmptyStateProps> = ({ onCreateTask }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            No tasks yet. Create your first task to get started!
          </p>
          <Button onClick={onCreateTask} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Task
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
