const PROTECTED_ROUTES = ['/app', '/dashboard', '/tasks', '/settings']
const AUTH_ROUTES = ['/login', '/register']

/**
 * Checks if a route requires authentication
 */
export const isProtectedRoute = (pathname: string): boolean => {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
}

/**
 * Checks if a route is an auth page (login/register)
 */
export const isAuthRoute = (pathname: string): boolean => {
  return AUTH_ROUTES.includes(pathname)
}
