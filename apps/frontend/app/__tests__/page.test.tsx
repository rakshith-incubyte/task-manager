import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => undefined),
  })),
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
  verifySession: vi.fn(() => null),
}))

describe('Home Page', () => {
  it('should render the welcome heading', async () => {
    render(await Home())
    
    const heading = screen.getByRole('heading', { name: /welcome to task manager/i })
    expect(heading).toBeInTheDocument()
  })

  it('should render the subtitle', async () => {
    render(await Home())
    
    const subtitle = screen.getByText(/organize your work and life/i)
    expect(subtitle).toBeInTheDocument()
  })

  it('should render login and signup buttons in header', async () => {
    render(await Home())
    
    const loginButtons = screen.getAllByText(/login/i)
    const signupButtons = screen.getAllByText(/sign up/i)
    
    expect(loginButtons.length).toBeGreaterThan(0)
    expect(signupButtons.length).toBeGreaterThan(0)
  })

  it('should render CTA buttons', async () => {
    render(await Home())
    
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })
})
