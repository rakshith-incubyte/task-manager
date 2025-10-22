import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTaskDnd } from '@/hooks/use-task-dnd'
import { createTask } from '@/tests/utils/task-factory'
import { TaskStatus } from '@/lib/api-client'

describe('useTaskDnd', () => {
  it('should initialize with provided tasks', () => {
    const tasks = [
      createTask({ id: '1', status: 'todo' }),
      createTask({ id: '2', status: 'in_progress' }),
    ]

    const { result } = renderHook(() => useTaskDnd(tasks, vi.fn()))

    expect(result.current.tasks).toHaveLength(2)
    expect(result.current.tasksByStatus.todo).toHaveLength(1)
    expect(result.current.tasksByStatus.in_progress).toHaveLength(1)
    expect(result.current.tasksByStatus.done).toHaveLength(0)
  })

  it('should handle drag end and update task status', async () => {
    const onStatusChange = vi.fn()
    const tasks = [
      createTask({ id: '1', status: 'todo' }),
      createTask({ id: '2', status: 'in_progress' }),
    ]

    const { result } = renderHook(() => useTaskDnd(tasks, onStatusChange))

    await act(async () => {
      await result.current.handleDragEnd({
        active: { id: '1', data: { current: {} } },
        over: { id: 'in_progress', data: { current: {} } },
      } as any)
    })

    expect(onStatusChange).toHaveBeenCalledWith('1', 'in_progress')
  })

  it('should not update status if dropped in same column', async () => {
    const onStatusChange = vi.fn()
    const tasks = [createTask({ id: '1', status: 'todo' })]

    const { result } = renderHook(() => useTaskDnd(tasks, onStatusChange))

    await act(async () => {
      await result.current.handleDragEnd({
        active: { id: '1', data: { current: {} } },
        over: { id: 'todo', data: { current: {} } },
      } as any)
    })

    expect(onStatusChange).not.toHaveBeenCalled()
  })

  it('should not update if no drop target', async () => {
    const onStatusChange = vi.fn()
    const tasks = [createTask({ id: '1', status: 'todo' })]

    const { result } = renderHook(() => useTaskDnd(tasks, onStatusChange))

    await act(async () => {
      await result.current.handleDragEnd({
        active: { id: '1', data: { current: {} } },
        over: null,
      } as any)
    })

    expect(onStatusChange).not.toHaveBeenCalled()
  })

  it('should optimistically update UI before API call', async () => {
    const onStatusChange = vi.fn()
    const tasks = [createTask({ id: '1', status: 'todo', title: 'Task 1' })]

    const { result } = renderHook(() => useTaskDnd(tasks, onStatusChange))

    expect(result.current.tasksByStatus.todo).toHaveLength(1)
    expect(result.current.tasksByStatus.in_progress).toHaveLength(0)

    await act(async () => {
      await result.current.handleDragEnd({
        active: { id: '1', data: { current: {} } },
        over: { id: 'in_progress', data: { current: {} } },
      } as any)
    })

    // After drag, task should be in new column
    expect(result.current.tasksByStatus.todo).toHaveLength(0)
    expect(result.current.tasksByStatus.in_progress).toHaveLength(1)
    expect(result.current.tasksByStatus.in_progress[0].id).toBe('1')
  })

  it('should handle multiple consecutive drags', async () => {
    const onStatusChange = vi.fn()
    const tasks = [createTask({ id: '1', status: 'todo', title: 'Task 1' })]

    const { result } = renderHook(() => useTaskDnd(tasks, onStatusChange))

    // First drag: todo -> in_progress
    await act(async () => {
      await result.current.handleDragEnd({
        active: { id: '1', data: { current: {} } },
        over: { id: 'in_progress', data: { current: {} } },
      } as any)
    })

    expect(result.current.tasksByStatus.in_progress).toHaveLength(1)
    expect(result.current.tasksByStatus.todo).toHaveLength(0)

    // Second drag: in_progress -> done
    await act(async () => {
      await result.current.handleDragEnd({
        active: { id: '1', data: { current: {} } },
        over: { id: 'done', data: { current: {} } },
      } as any)
    })

    expect(result.current.tasksByStatus.done).toHaveLength(1)
    expect(result.current.tasksByStatus.in_progress).toHaveLength(0)

    // Third drag: done -> todo (back to start)
    await act(async () => {
      await result.current.handleDragEnd({
        active: { id: '1', data: { current: {} } },
        over: { id: 'todo', data: { current: {} } },
      } as any)
    })

    expect(result.current.tasksByStatus.todo).toHaveLength(1)
    expect(result.current.tasksByStatus.done).toHaveLength(0)
  })
})
