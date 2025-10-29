import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const isServer = typeof window === 'undefined'
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL

// Resolve a safe base URL that always uses the public API URL
const resolveBaseURL = (): string => {
  // If an absolute public URL is provided, always use it
  if (PUBLIC_API_URL && /^https?:\/\//.test(PUBLIC_API_URL)) return PUBLIC_API_URL

  if (isServer) {
    // On the server, relative URLs are invalid. In production, require absolute public URL.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'NEXT_PUBLIC_API_URL must be an absolute URL in production for SSR (e.g., https://your-domain/api)'
      )
    }
    // In development, fallback to localhost origin for convenience
    const rel = PUBLIC_API_URL || '/api'
    return `http://localhost:3000${rel.startsWith('/') ? rel : `/${rel}`}`
  }

  // In the browser, a relative public path is fine
  return PUBLIC_API_URL || '/api'
}

const API_BASE_URL = resolveBaseURL()

/**
 * HTTP client with automatic token refresh interceptor
 * Security best practices:
 * - Access token stored in memory (not localStorage)
 * - Refresh token stored in httpOnly cookie (backend sets it)
 * - Follows the Interceptor pattern for cross-cutting concerns
 */
class HttpClient {
  private client: AxiosInstance
  private accessToken: string | null = null // Store in memory only
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (value?: unknown) => void
    reject: (reason?: unknown) => void
  }> = []

  constructor() {
    console.log('HttpClient initialized with baseURL:', API_BASE_URL)
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Send cookies with requests
    })

    this.setupInterceptors()
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - attach access token from memory
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.accessToken}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean
        }

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for the token refresh to complete
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            })
              .then(() => {
                return this.client(originalRequest)
              })
              .catch((err) => {
                return Promise.reject(err)
              })
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            // Call refresh endpoint (refresh token sent via httpOnly cookie)
            console.log('Attempting token refresh...')
            const response = await this.client.post(
              '/users/auth/refresh',
              {},
              { withCredentials: true }
            )

            console.log('Token refresh successful')
            const { access_token } = response.data
            // Backend sets new refresh token as httpOnly cookie

            // Store new access token in memory only
            this.setAccessToken(access_token)

            // Retry all failed requests
            this.processQueue(null)

            // Retry original request
            return this.client(originalRequest)
          } catch (refreshError: any) {
            // Refresh failed - clear tokens and redirect to login
            console.error('Token refresh failed:', {
              status: refreshError.response?.status,
              data: refreshError.response?.data,
              message: refreshError.message
            })
            this.processQueue(refreshError)
            this.clearTokens()
            
            // Redirect to login page
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
            
            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }

        return Promise.reject(error)
      }
    )
  }

  /**
   * Process queued requests after token refresh
   */
  private processQueue(error: unknown): void {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error)
      } else {
        promise.resolve()
      }
    })

    this.failedQueue = []
  }

  /**
   * Set access token in memory (not localStorage for security)
   */
  public setAccessToken(token: string): void {
    this.accessToken = token
  }

  /**
   * Get access token from memory
   */
  public getAccessToken(): string | null {
    return this.accessToken
  }

  /**
   * Clear access token from memory
   * Note: Refresh token is cleared by backend (httpOnly cookie)
   */
  public clearTokens(): void {
    this.accessToken = null
    // Call logout endpoint to clear httpOnly cookie
    this.client.post('/users/auth/logout', {}, { withCredentials: true }).catch(() => {
      // Ignore errors on logout
    })
  }

  /**
   * Get the axios instance
   */
  public getInstance(): AxiosInstance {
    return this.client
  }
}

// Export class and singleton instance
export { HttpClient }
export const httpClient = new HttpClient()
export const axiosInstance = httpClient.getInstance()
