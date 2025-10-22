const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export type LoginResponse = {
  user_id: string
  access_token: string
  refresh_token: string
}

export type UserResponse = {
  id: string
  username: string
  email: string
  created_at: string
  updated_at: string
}

export type RegisterRequest = {
  username: string
  email: string
  password: string
}

/**
 * Authenticates user and returns JWT tokens
 */
export const loginUser = async (
  username: string,
  password: string
): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/users/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Login failed' }))
    throw new Error(error.detail || 'Login failed')
  }

  return response.json()
}

/**
 * Registers a new user
 */
export const registerUser = async (data: RegisterRequest): Promise<UserResponse> => {
  const response = await fetch(`${API_BASE_URL}/users/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Registration failed' }))
    throw new Error(error.detail || 'Registration failed')
  }

  return response.json()
}

/**
 * Gets current user profile using access token
 */
export const getCurrentUser = async (accessToken: string): Promise<UserResponse> => {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to get user profile')
  }

  return response.json()
}

// Task types
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export type Task = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  owner_id: string
  created_at: string
  updated_at: string
}

export type TaskPaginationResponse = {
  data: Task[]
  next_cursor: string | null
  has_more: boolean
}

/**
 * Gets paginated tasks for the authenticated user
 */
export const getTasks = async (
  accessToken: string,
  params?: {
    cursor?: string
    limit?: number
    status?: TaskStatus
    priority?: TaskPriority
  }
): Promise<TaskPaginationResponse> => {
  const queryParams = new URLSearchParams()
  if (params?.cursor) queryParams.append('cursor', params.cursor)
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.status) queryParams.append('status', params.status)
  if (params?.priority) queryParams.append('priority', params.priority)

  const response = await fetch(
    `${API_BASE_URL}/tasks/?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch tasks')
  }

  return response.json()
}

export type UpdateTaskRequest = {
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
}

/**
 * Updates a task
 */
export const updateTask = async (
  accessToken: string,
  taskId: string,
  data: UpdateTaskRequest
): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to update task' }))
    throw new Error(error.detail || 'Failed to update task')
  }

  return response.json()
}
