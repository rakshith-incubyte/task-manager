import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskList } from '../task-list'
import type { TaskPaginationResponse, Task } from '@/lib/api-client'
import type { TaskFormData } from '@/lib/task-form-validation'

// Mock data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Test Task 1',
    description: 'Description 1',
    status: 'todo',
    priority: 'high',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Test Task 2',
    description: 'Description 2',
    status: 'in_progress',
    priority: 'medium',
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  },
  {
    id: '3',
    title: 'Test Task 3',
    description: 'Description 3',
    status: 'done',
    priority: 'low',
    created_at: '2025-01-03T00:00:00Z',
    updated_at: '2025-01-03T00:00:00Z',
  },
]

const mockInitialTasks: TaskPaginationResponse = {
  data: mockTasks,
  total: 3,
  page: 1,
  limit: 10,
  totalPages: 1,
}

// Mock all the hooks and components
vi.mock('@/hooks/use-task-dnd', () => ({
  useTaskDnd: vi.fn(() => ({
    tasks: mockTasks,
    tasksByStatus: {
      todo: mockTasks.filter(t => t.status === 'todo'),
      in_progress: mockTasks.filter(t => t.status === 'in_progress'),
      done: mockTasks.filter(t => t.status === 'done'),
    },
    handleDragEnd: vi.fn(),
    setTasks: vi.fn(),
  })),
}))

vi.mock('@/hooks/use-task-modals', () => ({
  useTaskModals: vi.fn(() => ({
    isCreateModalOpen: false,
    isEditModalOpen: false,
    isDeleteDialogOpen: false,
    selectedTask: null,
    openCreateModal: vi.fn(),
    closeCreateModal: vi.fn(),
    openEditModal: vi.fn(),
    closeEditModal: vi.fn(),
    openDeleteDialog: vi.fn(),
    closeDeleteDialog: vi.fn(),
  })),
}))

vi.mock('@/hooks/use-task-manager', () => ({
  useTaskManager: vi.fn(() => ({
    isDeleting: false,
    handleCreateTask: vi.fn(),
    handleUpdateTask: vi.fn(),
    handleDeleteTask: vi.fn(),
  })),
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toasts: [],
    removeToast: vi.fn(),
  })),
  showToast: vi.fn(),
}))

vi.mock('@/hooks/use-task-export-import', () => ({
  useTaskExportImport: vi.fn(() => ({
    isExporting: false,
    isImporting: false,
    exportTasks: vi.fn(),
    importTasks: vi.fn(),
    error: null,
  })),
}))

vi.mock('@/hooks/use-task-filters', () => ({
  useTaskFilters: vi.fn(() => ({
    filters: {},
    hasActiveFilters: false,
    setStatusFilter: vi.fn(),
    setPriorityFilter: vi.fn(),
    setDateRangeFilter: vi.fn(),
    setUpdatedDateRangeFilter: vi.fn(),
    clearFilters: vi.fn(),
  })),
}))

vi.mock('@/lib/api-client', () => ({
  TaskStatus: {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    DONE: 'done',
  },
  TaskPriority: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  },
  updateTask: vi.fn(),
  getTasks: vi.fn(),
  getAllTasks: vi.fn(),
}))

vi.mock('@/components/tasks/task-toolbar', () => ({
  TaskToolbar: vi.fn(({ onViewModeChange, onCreateTask, onExport, onImport, isExporting, isImporting }) => (
    <div data-testid="task-toolbar">
      <button onClick={() => onViewModeChange('table')}>Table View</button>
      <button onClick={() => onViewModeChange('grid')}>Grid View</button>
      <button onClick={onCreateTask}>Create Task</button>
      <button onClick={() => onExport('json')}>Export JSON</button>
      <button onClick={() => onExport('csv')}>Export CSV</button>
      <button onClick={() => onImport(new File(['test'], 'test.json', { type: 'application/json' }))}>
        Import
      </button>
      {isExporting && <span>Exporting...</span>}
      {isImporting && <span>Importing...</span>}
    </div>
  )),
}))

vi.mock('@/components/tasks/task-filter-panel', () => ({
  TaskFilterPanel: vi.fn(({ onFilterChange, onClearFilters }) => (
    <div data-testid="task-filter-panel">
      <button onClick={() => onFilterChange({ status: 'todo' })}>Filter by Todo</button>
      <button onClick={() => onFilterChange({ priority: 'high' })}>Filter by High Priority</button>
      <button onClick={onClearFilters}>Clear Filters</button>
    </div>
  )),
}))

vi.mock('@/components/tasks/task-grid-view', () => ({
  TaskGridView: vi.fn(({ onEditTask, onDeleteTask }) => (
    <div data-testid="task-grid-view">
      <button onClick={() => onEditTask(mockTasks[0])}>Edit Task 1</button>
      <button onClick={() => onDeleteTask(mockTasks[0])}>Delete Task 1</button>
    </div>
  )),
}))

vi.mock('@/components/tasks/task-table-view', () => ({
  TaskTableView: vi.fn(({ onEditTask, onDeleteTask }) => (
    <div data-testid="task-table-view">
      <button onClick={() => onEditTask(mockTasks[0])}>Edit Task 1</button>
      <button onClick={() => onDeleteTask(mockTasks[0])}>Delete Task 1</button>
    </div>
  )),
}))

vi.mock('@/components/tasks/task-empty-state', () => ({
  TaskEmptyState: vi.fn(({ onCreateTask }) => (
    <div data-testid="task-empty-state">
      <button onClick={onCreateTask}>Create First Task</button>
    </div>
  )),
}))

vi.mock('@/components/tasks/task-modal', () => ({
  TaskModal: vi.fn(() => <div data-testid="task-modal"></div>),
}))

vi.mock('@/components/tasks/delete-task-dialog', () => ({
  DeleteTaskDialog: vi.fn(() => <div data-testid="delete-task-dialog"></div>),
}))

vi.mock('@/components/ui/toast-container', () => ({
  ToastContainer: vi.fn(() => <div data-testid="toast-container"></div>),
}))

describe('TaskList', () => {
  const mockAccessToken = 'test-token'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders task list with all components', () => {
    render(<TaskList initialTasks={mockInitialTasks} accessToken={mockAccessToken} />)

    expect(screen.getByTestId('task-toolbar')).toBeInTheDocument()
    expect(screen.getByTestId('task-filter-panel')).toBeInTheDocument()
    expect(screen.getByTestId('task-grid-view')).toBeInTheDocument()
    expect(screen.getByTestId('task-modal')).toBeInTheDocument()
    expect(screen.getByTestId('delete-task-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('toast-container')).toBeInTheDocument()
  })

  it('renders table view when view mode is changed to table', async () => {
    const user = userEvent.setup()
    render(<TaskList initialTasks={mockInitialTasks} accessToken={mockAccessToken} />)

    // Initially shows grid view
    expect(screen.getByTestId('task-grid-view')).toBeInTheDocument()
    expect(screen.queryByTestId('task-table-view')).not.toBeInTheDocument()

    // Change to table view
    await user.click(screen.getByText('Table View'))

    expect(screen.getByTestId('task-table-view')).toBeInTheDocument()
    expect(screen.queryByTestId('task-grid-view')).not.toBeInTheDocument()
  })

  it('renders empty state when there are no tasks', async () => {
    const { useTaskDnd } = await import('@/hooks/use-task-dnd')
    vi.mocked(useTaskDnd).mockReturnValue({
      tasks: [],
      tasksByStatus: {
        todo: [],
        in_progress: [],
        done: [],
      },
      handleDragEnd: vi.fn(),
      setTasks: vi.fn(),
    })

    const emptyInitialTasks: TaskPaginationResponse = {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    }

    render(<TaskList initialTasks={emptyInitialTasks} accessToken={mockAccessToken} />)

    expect(screen.getByTestId('task-empty-state')).toBeInTheDocument()
    expect(screen.queryByTestId('task-grid-view')).not.toBeInTheDocument()
    expect(screen.queryByTestId('task-table-view')).not.toBeInTheDocument()
  })

  it('handles filter changes', async () => {
    const user = userEvent.setup()
    const mockSetStatusFilter = vi.fn()
    const mockSetPriorityFilter = vi.fn()
    const mockClearFilters = vi.fn()
    
    const { useTaskFilters } = await import('@/hooks/use-task-filters')
    vi.mocked(useTaskFilters).mockReturnValue({
      filters: {},
      hasActiveFilters: false,
      setStatusFilter: mockSetStatusFilter,
      setPriorityFilter: mockSetPriorityFilter,
      setDateRangeFilter: vi.fn(),
      setUpdatedDateRangeFilter: vi.fn(),
      clearFilters: mockClearFilters,
    })
    
    render(<TaskList initialTasks={mockInitialTasks} accessToken={mockAccessToken} />)

    await user.click(screen.getByText('Filter by Todo'))
    expect(mockSetStatusFilter).toHaveBeenCalledWith('todo')

    await user.click(screen.getByText('Filter by High Priority'))
    expect(mockSetPriorityFilter).toHaveBeenCalledWith('high')

    await user.click(screen.getByText('Clear Filters'))
    expect(mockClearFilters).toHaveBeenCalled()
  })

  it('exports tasks as JSON', async () => {
    const user = userEvent.setup()
    const mockExportTasks = vi.fn()
    const mockShowToast = vi.fn()
    
    const { useTaskExportImport } = await import('@/hooks/use-task-export-import')
    vi.mocked(useTaskExportImport).mockReturnValue({
      isExporting: false,
      isImporting: false,
      exportTasks: mockExportTasks,
      importTasks: vi.fn(),
      error: null,
    })

    const { getAllTasks } = await import('@/lib/api-client')
    vi.mocked(getAllTasks).mockResolvedValue(mockTasks)

    // Mock the useToast hook to return our mock showToast
    const { useToast } = await import('@/hooks/use-toast')
    vi.mocked(useToast).mockReturnValue({
      toasts: [],
      removeToast: vi.fn(),
      showToast: mockShowToast,
    })

    render(<TaskList initialTasks={mockInitialTasks} accessToken={mockAccessToken} />)

    await user.click(screen.getByText('Export JSON'))

    expect(getAllTasks).toHaveBeenCalledWith(mockAccessToken)
    expect(mockExportTasks).toHaveBeenCalledWith(mockTasks, 'json')
    expect(mockShowToast).toHaveBeenCalledWith('3 task(s) exported as JSON', 'success')
  })

  it('opens create modal when create task is clicked', async () => {
    const user = userEvent.setup()
    const mockOpenCreateModal = vi.fn()
    
    const { useTaskModals } = await import('@/hooks/use-task-modals')
    vi.mocked(useTaskModals).mockReturnValue({
      isCreateModalOpen: false,
      isEditModalOpen: false,
      isDeleteDialogOpen: false,
      selectedTask: null,
      openCreateModal: mockOpenCreateModal,
      closeCreateModal: vi.fn(),
      openEditModal: vi.fn(),
      closeEditModal: vi.fn(),
      openDeleteDialog: vi.fn(),
      closeDeleteDialog: vi.fn(),
    })
    
    render(<TaskList initialTasks={mockInitialTasks} accessToken={mockAccessToken} />)

    await user.click(screen.getByText('Create Task'))

    expect(mockOpenCreateModal).toHaveBeenCalled()
  })

  it('handles edge cases gracefully', () => {
    expect(() => {
      render(<TaskList initialTasks={mockInitialTasks} accessToken="" />)
    }).not.toThrow()
  })
})
