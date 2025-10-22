'use server'

import { cookies } from 'next/headers'
import { loginUser, registerUser } from '@/lib/api-client'
import { createSession } from '@/lib/auth'

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
    
    // Create session
    const sessionToken = await createSession({
      userId: response.user_id,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
    })

    // Set cookie
    const cookieStore = await cookies()
    const SESSION_COOKIE_NAME = 'session'
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
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
    
    // Create session
    const sessionToken = await createSession({
      userId: loginResponse.user_id,
      accessToken: loginResponse.access_token,
      refreshToken: loginResponse.refresh_token,
    })

    // Set cookie
    const cookieStore = await cookies()
    const SESSION_COOKIE_NAME = 'session'
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
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
