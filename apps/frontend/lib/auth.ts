import { SignJWT, jwtVerify } from 'jose'

const getSecretKey = (): Uint8Array => {
  const secret = process.env.SESSION_SECRET || 'your-secret-key-min-32-characters-long'
  const encoder = new TextEncoder()
  const key = encoder.encode(secret)
  return key
}

export type SessionPayload = {
  userId: string
  accessToken: string
  expiresAt?: string
}

// Session duration matches access token expiry (shorter than refresh token)
const SESSION_DURATION = 60 * 60 * 1000 // 1 hour (access token lifetime)

/**
 * Encrypts session data using JWT
 */
export const encrypt = async (payload: Record<string, unknown>): Promise<string> => {
  const key = getSecretKey()
  const jwt = new SignJWT(payload)
  jwt.setProtectedHeader({ alg: 'HS256' })
  jwt.setIssuedAt()
  jwt.setExpirationTime('1h') // Match access token lifetime
  return await jwt.sign(key)
}

/**
 * Decrypts session data from JWT
 */
export const decrypt = async (token: string): Promise<Record<string, unknown> | null> => {
  if (!token) return null
  
  try {
    const key = getSecretKey()
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    })
    return payload as Record<string, unknown>
  } catch (error) {
    return null
  }
}

/**
 * Creates a new session with access token only
 * Note: Refresh token is stored in httpOnly cookie by backend
 */
export const createSession = async (data: {
  userId: string
  accessToken: string
}): Promise<string> => {
  const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString()
  
  const sessionData: SessionPayload = {
    userId: data.userId,
    accessToken: data.accessToken,
    expiresAt,
  }
  
  return await encrypt(sessionData)
}

/**
 * Verifies and returns session data if valid
 */
export const verifySession = async (session: string): Promise<SessionPayload | null> => {
  const payload = await decrypt(session)
  
  if (!payload) return null
  
  // Check if session is expired
  if (payload.expiresAt && new Date(payload.expiresAt as string) < new Date()) {
    return null
  }
  
  return payload as SessionPayload
}

/**
 * Deletes session by returning empty string
 */
export const deleteSession = (): string => {
  return ''
}
