import { axiosInstance } from './http-client'

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
 * Note: Login doesn't use interceptor as there's no token yet
 */
export const loginUser = async (
  username: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await axiosInstance.post<LoginResponse>(
      '/users/auth/token',
      { username, password }
    )
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Login failed')
  }
}

/**
 * Registers a new user
 */
export const registerUser = async (data: RegisterRequest): Promise<UserResponse> => {
  try {
    const response = await axiosInstance.post<UserResponse>('/users/', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Registration failed')
  }
}

/**
 * Gets current user profile
 * Uses http-client with automatic token refresh
 */
export const getCurrentUser = async (accessToken: string): Promise<UserResponse> => {
  try {
    // Set access token in http-client
    const { httpClient } = await import('./http-client')
    httpClient.setAccessToken(accessToken)
    
    const response = await axiosInstance.get<UserResponse>('/users/me')
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to get user profile')
  }
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
 * Uses http-client with automatic token refresh
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
  try {
    const { httpClient } = await import('./http-client')
    httpClient.setAccessToken(accessToken)
    
    const response = await axiosInstance.get<TaskPaginationResponse>('/tasks/', {
      params: {
        cursor: params?.cursor,
        limit: params?.limit,
        status: params?.status,
        priority: params?.priority,
      },
    })
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch tasks')
  }
}

export type CreateTaskRequest = {
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
}

export type UpdateTaskRequest = {
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
}

/**
 * Creates a new task
 * Uses http-client with automatic token refresh
 */
export const createTask = async (
  accessToken: string,
  data: CreateTaskRequest
): Promise<Task> => {
  try {
    const { httpClient } = await import('./http-client')
    httpClient.setAccessToken(accessToken)
    
    const response = await axiosInstance.post<Task>('/tasks/', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to create task')
  }
}

/**
 * Updates a task
 * Uses http-client with automatic token refresh
 */
export const updateTask = async (
  accessToken: string,
  taskId: string,
  data: UpdateTaskRequest
): Promise<Task> => {
  try {
    const { httpClient } = await import('./http-client')
    httpClient.setAccessToken(accessToken)
    
    const response = await axiosInstance.patch<Task>(`/tasks/${taskId}`, data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to update task')
  }
}

/**
 * Deletes a task
 * Uses http-client with automatic token refresh
 */
export const deleteTask = async (
  accessToken: string,
  taskId: string
): Promise<void> => {
  try {
    const { httpClient } = await import('./http-client')
    httpClient.setAccessToken(accessToken)
    
    await axiosInstance.delete(`/tasks/${taskId}`)
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to delete task')
  }
}
