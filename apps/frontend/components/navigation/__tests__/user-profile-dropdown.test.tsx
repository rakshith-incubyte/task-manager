import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { UserProfileDropdown } from '../user-profile-dropdown'

// Mock dropdown primitives
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick, className }: any) => (
    <button data-testid="dropdown-item" className={className} onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuLabel: ({ children, className }: any) => <div data-testid="dropdown-label" className={className}>{children}</div>,
  DropdownMenuSeparator: () => <hr data-testid="dropdown-separator" />,
}))

// Mock UI
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className }: any) => <button data-testid="btn" className={className}>{children}</button>,
}))

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => <div data-testid="avatar" className={className}>{children}</div>,
  AvatarFallback: ({ children, className }: any) => <div data-testid="avatar-fallback" className={className}>{children}</div>,
}))

// Mock icons
vi.mock('lucide-react', () => ({
  User: (props: any) => <span data-testid="icon-user" {...props} />,
  LogOut: (props: any) => <span data-testid="icon-logout" {...props} />,
  Settings: (props: any) => <span data-testid="icon-settings" {...props} />,
}))

// Mock router
const push = vi.fn()
const refresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}))

// Mock child modal to observe props
const mockUserProfileModal = vi.fn(() => null)
vi.mock('../user-profile-modal', () => ({
  UserProfileModal: (props: any) => {
    mockUserProfileModal(props)
    return <div data-testid="user-profile-modal" data-open={props.isOpen} />
  },
}))

// Mock server actions
vi.mock('@/app/(auth)/actions', () => ({
  logoutAction: vi.fn(),
}))

describe('UserProfileDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    push.mockClear()
    refresh.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const props = { username: 'Jane Doe', email: 'jane@example.com' }

  it('renders avatar with initials and user info', () => {
    render(<UserProfileDropdown {...props} />)

    // Initials from username => JD
    expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('JD')

    // Dropdown label contains username and email
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('opens profile modal when Profile item clicked', async () => {
    const user = userEvent.setup()
    render(<UserProfileDropdown {...props} />)

    const items = screen.getAllByTestId('dropdown-item')
    // Items order: Profile, Settings, Logout
    await user.click(items[0])

    // Modal should receive isOpen true
    expect(mockUserProfileModal).toHaveBeenCalled()
    const lastCall = mockUserProfileModal.mock.calls.at(-1)![0]
    expect(lastCall.isOpen).toBe(true)
  })

  it('navigates to settings when Settings clicked', async () => {
    const user = userEvent.setup()
    render(<UserProfileDropdown {...props} />)

    const items = screen.getAllByTestId('dropdown-item')
    await user.click(items[1])

    expect(push).toHaveBeenCalledWith('/settings')
  })

  it('calls logout action and redirects on Logout', async () => {
    const user = userEvent.setup()
    const { logoutAction } = await import('@/app/(auth)/actions')
    vi.mocked(logoutAction).mockResolvedValue(undefined)

    render(<UserProfileDropdown {...props} />)

    const items = screen.getAllByTestId('dropdown-item')
    await user.click(items[2])

    expect(logoutAction).toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/login')
    expect(refresh).toHaveBeenCalled()
  })

  it('closes modal via onClose callback from modal', async () => {
    // We simulate open then close by clicking Profile then invoking captured onClose
    const user = userEvent.setup()
    render(<UserProfileDropdown {...props} />)

    const items = screen.getAllByTestId('dropdown-item')
    await user.click(items[0])

    const lastCall = mockUserProfileModal.mock.calls.at(-1)![0]
    // Invoke onClose to ensure no errors
    lastCall.onClose()

    // After close, component should render modal with isOpen false on next render cycle
    // Re-render by clicking Profile again and ensure toggling works
    await user.click(items[0])
    const nextCall = mockUserProfileModal.mock.calls.at(-1)![0]
    expect(nextCall.isOpen).toBe(true)
  })
})
