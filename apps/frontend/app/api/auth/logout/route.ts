import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/cookies'

export const POST = async (): Promise<NextResponse> => {
  const cookie = clearSessionCookie()

  const response = NextResponse.json({ success: true }, { status: 200 })
  response.headers.set('Set-Cookie', cookie)

  return response
}
