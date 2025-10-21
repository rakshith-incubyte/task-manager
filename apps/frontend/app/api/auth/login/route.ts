import { NextRequest, NextResponse } from 'next/server'
import { loginUser } from '@/lib/api-client'
import { createSession } from '@/lib/auth'
import { createSessionCookie } from '@/lib/cookies'

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Authenticate with backend
    const tokenResponse = await loginUser(username, password)

    // Create encrypted session
    const session = await createSession({
      userId: tokenResponse.user_id,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
    })

    // Create secure cookie
    const cookie = createSessionCookie(session)

    // Return success response with cookie
    const response = NextResponse.json(
      { success: true, userId: tokenResponse.user_id },
      { status: 200 }
    )

    response.headers.set('Set-Cookie', cookie)

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
