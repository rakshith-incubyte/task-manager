'use server'

import { cookies } from 'next/headers'
import { loginUser, registerUser, getCurrentUser } from '@/lib/api-client'
import { createSession, verifySession } from '@/lib/auth'

type LoginResult = {
  success: boolean
  error?: string
}

type RegisterResult = {
  success: boolean
  error?: string
}

export const loginAction = async (formData: FormData): Promise<LoginResult> => {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  // Validation
  if (!username) {
    return { success: false, error: 'Username is required' }
  }
  if (!password) {
    return { success: false, error: 'Password is required' }
  }

  try {
    // Call backend API
    const response = await loginUser(username, password)
    
    // Create session with only access token
    const sessionToken = await createSession({
      userId: response.user_id,
      accessToken: response.access_token,
    })

    // Set cookies in browser
    const cookieStore = await cookies()
    
    // 1. Set session cookie (contains encrypted access token)
    const SESSION_COOKIE_NAME = 'session'
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour (matches access token lifetime)
    })
    
    // 2. Set refresh token cookie (forward from backend response)
    cookieStore.set('refresh_token', response.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Login failed' 
    }
  }
}

export const registerAction = async (formData: FormData): Promise<RegisterResult> => {
  const username = formData.get('username') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validation
  if (!username) {
    return { success: false, error: 'Username is required' }
  }
  if (!email) {
    return { success: false, error: 'Email is required' }
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Invalid email format' }
  }
  
  if (!password) {
    return { success: false, error: 'Password is required' }
  }

  try {
    // Call backend API to register user
    await registerUser({ username, email, password })
    
    // After successful registration, log the user in
    const loginResponse = await loginUser(username, password)
    
    // Create session with only access token
    const sessionToken = await createSession({
      userId: loginResponse.user_id,
      accessToken: loginResponse.access_token,
    })

    // Set cookies in browser
    const cookieStore = await cookies()
    
    // 1. Set session cookie (contains encrypted access token)
    const SESSION_COOKIE_NAME = 'session'
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour (matches access token lifetime)
    })
    
    // 2. Set refresh token cookie (forward from backend response)
    cookieStore.set('refresh_token', loginResponse.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Registration failed' 
    }
  }
}

export const logoutAction = async (): Promise<void> => {
  const cookieStore = await cookies()
  
  // Clear session cookie
  cookieStore.delete('session')
  
  // Clear refresh token cookie
  cookieStore.delete('refresh_token')
}

export const getUserProfileAction = async (): Promise<{
  success: boolean
  data?: {
    id: string
    username: string
    email: string
    created_at: string
    updated_at: string
  }
  error?: string
}> => {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie) {
      return { success: false, error: 'Not authenticated' }
    }
    
    const session = await verifySession(sessionCookie.value)
    
    if (!session) {
      return { success: false, error: 'Invalid session' }
    }
    
    // Call /users/me API using api-client
    const data = await getCurrentUser(session.accessToken)
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
