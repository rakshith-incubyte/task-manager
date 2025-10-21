import { NextResponse, type NextRequest } from 'next/server'
import { verifySession } from './lib/auth'
import { SESSION_COOKIE_NAME } from './lib/cookies'
import { isProtectedRoute, isAuthRoute } from './lib/middleware-helpers'

export const middleware = async (request: NextRequest): Promise<NextResponse> => {
  const { pathname } = request.nextUrl
  
  // Get session from cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = sessionCookie ? await verifySession(sessionCookie) : null
  
  // Redirect to login if accessing protected route without session
  if (isProtectedRoute(pathname) && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Redirect to app if accessing auth routes with valid session
  if (isAuthRoute(pathname) && session) {
    return NextResponse.redirect(new URL('/app', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|$).*)'],
}
