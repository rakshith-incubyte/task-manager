import { serialize, type SerializeOptions } from 'cookie'

export const SESSION_COOKIE_NAME = 'session'

const COOKIE_OPTIONS: SerializeOptions = {
  httpOnly: true,
  secure: true, // Always use secure cookies (HTTPS only)
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

/**
 * Creates a secure session cookie
 */
export const createSessionCookie = (sessionValue: string): string => {
  return serialize(SESSION_COOKIE_NAME, sessionValue, COOKIE_OPTIONS)
}

/**
 * Creates a cookie to clear the session
 */
export const clearSessionCookie = (): string => {
  return serialize(SESSION_COOKIE_NAME, '', {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  })
}
