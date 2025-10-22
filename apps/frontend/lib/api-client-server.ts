/**
 * Server-side API client for Next.js Server Components
 * Uses fetch directly with access tokens (no axios interceptor)
 * For client-side API calls, use api-client.ts instead
 */

import { cookies } from 'next/headers'
import type { UserResponse, Task, TaskPaginationResponse, TaskStatus, TaskPriority, LoginResponse } from './api-client'
import { createSession } from './auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Refreshes the access token using refresh token from cookie
 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refresh_token')?.value
    
    if (!refreshToken) {
      console.error('No refresh token found in cookies')
      return null
    }
    
    const response = await fetch(`${API_BASE_URL}/users/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    
    if (!response.ok) {
      console.error('Failed to refresh token:', response.status)
      return null
    }
    
    const data: LoginResponse = await response.json()
    
    // Update session cookie with new access token
    const sessionToken = await createSession({
      userId: data.user_id,
      accessToken: data.access_token,
    })
    
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    })
    
    // Update refresh token cookie if backend sent a new one
    if (data.refresh_token) {
      cookieStore.set('refresh_token', data.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }
    
    return data.access_token
  } catch (error) {
    console.error('Error refreshing token:', error)
    return null
  }
}

/**
 * Gets current user profile (server-side)
 * Automatically refreshes token on 401
 */
export const getCurrentUserServer = async (accessToken: string): Promise<UserResponse> => {
  let response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  })

  // If 401, try to refresh token and retry
  if (response.status === 401) {
    const newAccessToken = await refreshAccessToken()
    
    if (newAccessToken) {
      // Retry with new token
      response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
        },
        cache: 'no-store',
      })
    }
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get user profile: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * Gets paginated tasks (server-side)
 * Automatically refreshes token on 401
 */
export const getTasksServer = async (
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

  const url = `${API_BASE_URL}/tasks/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  
  let response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  })

  // If 401, try to refresh token and retry
  if (response.status === 401) {
    const newAccessToken = await refreshAccessToken()
    
    if (newAccessToken) {
      // Retry with new token
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
        },
        cache: 'no-store',
      })
    }
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch tasks: ${response.status} ${errorText}`)
  }

  return response.json()
}
