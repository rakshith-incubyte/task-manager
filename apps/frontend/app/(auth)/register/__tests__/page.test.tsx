import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import RegisterPage from '@/app/(auth)/register/page'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock server action
vi.mock('../../actions', () => ({
  registerAction: vi.fn(),
}))

describe('Register Page', () => {
  const mockPush = vi.fn()
  const mockRefresh = vi.fn()
  const mockRouter = { push: mockPush, refresh: mockRefresh }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter)
  })

  it('should render register form', () => {
    render(<RegisterPage />)
    
    expect(screen.getByText('Create a new account to get started')).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('should render link to login page', () => {
    render(<RegisterPage />)
    
    const loginLink = screen.getByText(/login/i)
    expect(loginLink).toBeInTheDocument()
  })

  it('should show validation errors for empty fields', async () => {
    const { registerAction } = await import('../../actions')
    ;(registerAction as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: false,
      error: 'Username is required',
    })

    render(<RegisterPage />)
    
    const submitButton = screen.getByRole('button', { name: /sign up/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument()
    })
  })

  it('should validate email format', async () => {
    const { registerAction } = await import('../../actions')
    ;(registerAction as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: false,
      error: 'Invalid email format',
    })

    render(<RegisterPage />)
    
    const usernameInput = screen.getByLabelText(/username/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    // Fill all fields with valid data except email
    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'Pass@123' } })
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)

    // Wait for validation error to appear
    const errorMessage = await screen.findByText('Invalid email format')
    expect(errorMessage).toBeInTheDocument()
  })

  it('should submit form with valid data', async () => {
    const { registerAction } = await import('../../actions')
    ;(registerAction as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
    })

    render(<RegisterPage />)
    
    const usernameInput = screen.getByLabelText(/username/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    fireEvent.change(usernameInput, { target: { value: 'newuser' } })
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'Pass@123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(registerAction).toHaveBeenCalled()
    })
  })

  it('should redirect to app on successful registration', async () => {
    const { registerAction } = await import('../../actions')
    ;(registerAction as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
    })

    render(<RegisterPage />)
    
    const usernameInput = screen.getByLabelText(/username/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    fireEvent.change(usernameInput, { target: { value: 'newuser' } })
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'Pass@123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/app')
    })
  })

  it('should display error message on failed registration', async () => {
    const { registerAction } = await import('../../actions')
    ;(registerAction as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: false,
      error: "Username 'rakshith3' is already taken",
    })

    render(<RegisterPage />)
    
    const usernameInput = screen.getByLabelText(/username/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    fireEvent.change(usernameInput, { target: { value: 'rakshith3' } })
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'Pass@123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/already taken/i)).toBeInTheDocument()
    })
  })

  it('should disable submit button while loading', async () => {
    const { registerAction } = await import('../../actions')
    ;(registerAction as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    )

    render(<RegisterPage />)
    
    const usernameInput = screen.getByLabelText(/username/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    fireEvent.change(usernameInput, { target: { value: 'newuser' } })
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'Pass@123' } })
    fireEvent.click(submitButton)

    expect(submitButton).toBeDisabled()
  })
})
