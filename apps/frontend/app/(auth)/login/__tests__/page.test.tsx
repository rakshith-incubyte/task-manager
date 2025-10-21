import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import LoginPage from '@/app/(auth)/login/page'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock server action
vi.mock('../../actions', () => ({
  loginAction: vi.fn(),
}))

describe('Login Page', () => {
  const mockPush = vi.fn()
  const mockRefresh = vi.fn()
  const mockRouter = { push: mockPush, refresh: mockRefresh }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter)
  })

  it('should render login form', () => {
    render(<LoginPage />)
    
    expect(screen.getByText('Enter your credentials to access your account')).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('should render link to register page', () => {
    render(<LoginPage />)
    
    const registerLink = screen.getByText(/sign up/i)
    expect(registerLink).toBeInTheDocument()
  })

  it('should show validation errors for empty fields', async () => {
    const { loginAction } = await import('../../actions')
    ;(loginAction as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: false,
      error: 'Username is required',
    })

    render(<LoginPage />)
    
    const submitButton = screen.getByRole('button', { name: /login/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument()
    })
  })

  it('should submit form with valid credentials', async () => {
    const { loginAction } = await import('../../actions')
    ;(loginAction as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
    })

    render(<LoginPage />)
    
    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /login/i })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(loginAction).toHaveBeenCalled()
    })
  })

  it('should redirect to app on successful login', async () => {
    const { loginAction } = await import('../../actions')
    ;(loginAction as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
    })

    render(<LoginPage />)
    
    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /login/i })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/app')
    })
  })

  it('should display error message on failed login', async () => {
    const { loginAction } = await import('../../actions')
    ;(loginAction as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: false,
      error: 'Invalid credentials',
    })

    render(<LoginPage />)
    
    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /login/i })

    fireEvent.change(usernameInput, { target: { value: 'wrong' } })
    fireEvent.change(passwordInput, { target: { value: 'wrong' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('should disable submit button while loading', async () => {
    const { loginAction } = await import('../../actions')
    ;(loginAction as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    )

    render(<LoginPage />)
    
    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /login/i })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    expect(submitButton).toBeDisabled()
  })
})
