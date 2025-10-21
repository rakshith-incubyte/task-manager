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
  refreshToken: string
  expiresAt?: string
}

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Encrypts session data using JWT
 */
export const encrypt = async (payload: Record<string, unknown>): Promise<string> => {
  const key = getSecretKey()
  const jwt = new SignJWT(payload)
  jwt.setProtectedHeader({ alg: 'HS256' })
  jwt.setIssuedAt()
  jwt.setExpirationTime('7d')
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
 * Creates a new session with tokens
 */
export const createSession = async (data: {
  userId: string
  accessToken: string
  refreshToken: string
}): Promise<string> => {
  const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString()
  
  const sessionData: SessionPayload = {
    ...data,
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
