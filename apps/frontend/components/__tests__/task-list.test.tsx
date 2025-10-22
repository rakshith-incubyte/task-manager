import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskList } from '../task-list'
import type { Task, TaskPaginationResponse } from '@/lib/api-client'

const buildTask = (overrides: Partial<Task>): Task => ({
  id: overrides.id ?? crypto.randomUUID(),
  title: overrides.title ?? 'Task title',
  description: overrides.description ?? 'Task description',
  status: overrides.status ?? 'todo',
  priority: overrides.priority ?? 'medium',
  owner_id: overrides.owner_id ?? 'owner-id',
  created_at: overrides.created_at ?? new Date('2024-01-01').toISOString(),
  updated_at: overrides.updated_at ?? new Date('2024-01-02').toISOString(),
})

type BuildResponseInput = {
  tasks?: Task[]
}

const buildTaskResponse = ({ tasks = [] }: BuildResponseInput = {}): TaskPaginationResponse => ({
  data: tasks,
  next_cursor: null,
  has_more: false,
})

describe('TaskList', () => {
  const accessToken = 'token'
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
  })

  it('renders empty state when no tasks available', () => {
    render(<TaskList initialTasks={buildTaskResponse()} accessToken={accessToken} />)

    expect(screen.getByRole('group', { name: /task view mode/i })).toBeInTheDocument()
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /grid view/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /table view/i })).toBeInTheDocument()
  })

  it('renders grid view grouped by status by default', () => {
    const tasks = [
      buildTask({ id: '1', status: 'todo', title: 'Draft spec' }),
      buildTask({ id: '2', status: 'in_progress', title: 'Implement feature' }),
      buildTask({ id: '3', status: 'done', title: 'Deploy release' }),
    ]

    render(<TaskList initialTasks={buildTaskResponse({ tasks })} accessToken={accessToken} />)

    expect(screen.getByRole('group', { name: /task view mode/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /to do/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /in progress/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /done/i })).toBeInTheDocument()

    expect(screen.getByText('Draft spec')).toBeInTheDocument()
    expect(screen.getByText('Implement feature')).toBeInTheDocument()
    expect(screen.getByText('Deploy release')).toBeInTheDocument()
  })

  it('switches to table view when Table view toggle is clicked', async () => {
    const tasks = [
      buildTask({ id: '1', status: 'todo', title: 'Draft spec' }),
      buildTask({ id: '2', status: 'in_progress', title: 'Implement feature' }),
    ]

    render(<TaskList initialTasks={buildTaskResponse({ tasks })} accessToken={accessToken} />)

    expect(screen.getByRole('group', { name: /task view mode/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /table view/i }))

    const table = screen.getByRole('table', { name: /tasks table/i })

    expect(table).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /title/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /priority/i })).toBeInTheDocument()

    expect(screen.getByRole('cell', { name: /draft spec/i })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: /implement feature/i })).toBeInTheDocument()
  })
})
