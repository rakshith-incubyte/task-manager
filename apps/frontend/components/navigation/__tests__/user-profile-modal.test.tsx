import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

// SUT
import { UserProfileModal } from '../user-profile-modal'

// Mock dialog/ui primitives to simple elements
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, onOpenChange, children }: any) => (
    <div data-testid="dialog" data-open={open} onClick={() => onOpenChange?.(false)}>
      {children}
    </div>
  ),
  DialogContent: ({ children, className }: any) => (
    <div data-testid="dialog-content" className={className}>{children}</div>
  ),
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
}))

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => <div data-testid="avatar" className={className}>{children}</div>,
  AvatarFallback: ({ children, className }: any) => <div data-testid="avatar-fallback" className={className}>{children}</div>,
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => <div data-testid="skeleton" className={className} />,
}))

// Mock lucide-react icons with simple spans
vi.mock('lucide-react', () => ({
  Mail: (props: any) => <span data-testid="icon-mail" {...props} />,
  Calendar: (props: any) => <span data-testid="icon-calendar" {...props} />,
  Clock: (props: any) => <span data-testid="icon-clock" {...props} />,
  User: (props: any) => <span data-testid="icon-user" {...props} />,
}))

// Mock server action
vi.mock('@/app/(auth)/actions', () => ({
  getUserProfileAction: vi.fn(),
}))

describe('UserProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const baseProfile = {
    id: '1234567890abcdef',
    username: 'John Doe',
    email: 'john@example.com',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-02-01T00:00:00Z',
  }

  it('does not fetch when closed', async () => {
    const { getUserProfileAction } = await import('@/app/(auth)/actions')
    vi.mocked(getUserProfileAction).mockResolvedValue({ success: true, data: baseProfile })

    render(<UserProfileModal isOpen={false} onClose={() => {}} />)

    // Nothing rendered yet except shell
    expect(screen.getByTestId('dialog')).toBeInTheDocument()
    expect(getUserProfileAction).not.toHaveBeenCalled()
  })

  it('shows loading skeleton when opened and until data resolves', async () => {
    const { getUserProfileAction } = await import('@/app/(auth)/actions')
    let resolveFn: any
    vi.mocked(getUserProfileAction).mockImplementation(() => new Promise(res => { resolveFn = res }))

    render(<UserProfileModal isOpen={true} onClose={() => {}} />)

    // Loading skeleton visible
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)

    resolveFn({ success: true, data: baseProfile })
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
    })
  })

  it('renders profile data after successful fetch', async () => {
    const { getUserProfileAction } = await import('@/app/(auth)/actions')
    vi.mocked(getUserProfileAction).mockResolvedValue({ success: true, data: baseProfile })

    render(<UserProfileModal isOpen={true} onClose={() => {}} />)

    // Wait for username to appear
    await screen.findByText('John Doe')

    // Avatar initials from username (JD)
    expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('JD')

    // Email shown
    expect(screen.getByText('john@example.com')).toBeInTheDocument()

    // Member Since and Last Updated labels
    expect(screen.getByText('Member Since')).toBeInTheDocument()
    expect(screen.getByText('Last Updated')).toBeInTheDocument()

    // ID is sliced to first 8 characters + ...
    expect(screen.getByText(/User ID:/)).toHaveTextContent('User ID: 12345678...')
  })

  it('renders formatted dates', async () => {
    const { getUserProfileAction } = await import('@/app/(auth)/actions')
    vi.mocked(getUserProfileAction).mockResolvedValue({ success: true, data: baseProfile })

    render(<UserProfileModal isOpen={true} onClose={() => {}} />)

    // US locale long date format
    await screen.findByText('January 1, 2025')
    expect(screen.getByText('January 1, 2025')).toBeInTheDocument()
    expect(screen.getByText('February 1, 2025')).toBeInTheDocument()
  })

  it('shows error message when fetch fails', async () => {
    const { getUserProfileAction } = await import('@/app/(auth)/actions')
    vi.mocked(getUserProfileAction).mockResolvedValue({ success: false, error: 'Not authenticated' })

    render(<UserProfileModal isOpen={true} onClose={() => {}} />)

    await screen.findByText('Not authenticated')
    expect(screen.getByText('Not authenticated')).toBeInTheDocument()
  })

  it('calls onClose via Dialog onOpenChange', async () => {
    const { getUserProfileAction } = await import('@/app/(auth)/actions')
    vi.mocked(getUserProfileAction).mockResolvedValue({ success: true, data: baseProfile })

    const onClose = vi.fn()
    render(<UserProfileModal isOpen={true} onClose={onClose} />)

    // Our mocked Dialog triggers onOpenChange(false) on click
    screen.getByTestId('dialog').click()
    expect(onClose).toHaveBeenCalled()
  })
})
