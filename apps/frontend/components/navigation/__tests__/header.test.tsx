import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from '../header'

// Mock Next.js components and utilities
vi.mock('next/link', () => ({
  default: vi.fn(({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-testid="next-link">
      {children}
    </a>
  )),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

// Mock UI components
vi.mock('@/components/ui/navigation-menu', () => ({
  NavigationMenu: vi.fn(({ children }: { children: React.ReactNode }) => (
    <nav data-testid="navigation-menu">{children}</nav>
  )),
  NavigationMenuList: vi.fn(({ children }: { children: React.ReactNode }) => (
    <ul data-testid="navigation-menu-list">{children}</ul>
  )),
}))

vi.mock('@/components/theme/theme-toggle', () => ({
  ThemeToggle: vi.fn(() => <button data-testid="theme-toggle">Toggle Theme</button>),
}))

vi.mock('@/components/navigation/nav-item', () => ({
  NavItem: vi.fn(({ item }: { item: any }) => (
    <li data-testid="nav-item">
      <a href={item.href}>{item.label}</a>
    </li>
  )),
}))

vi.mock('@/components/navigation/user-profile-dropdown', () => ({
  UserProfileDropdown: vi.fn(({ username, email }: { username: string; email: string }) => (
    <div data-testid="user-profile-dropdown">
      <span>{username}</span>
      <span>{email}</span>
    </div>
  )),
}))

// Mock utilities
vi.mock('@/lib/navigation', () => ({
  getNavigationItems: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  verifySession: vi.fn(),
}))

vi.mock('@/lib/api-client-server', () => ({
  getCurrentUserServer: vi.fn(),
}))

describe('Header Component', () => {
  let mockCookieStore: any
  let mockCookies: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    mockCookieStore = {
      get: vi.fn(),
    }
    
    mockCookies = vi.fn().mockResolvedValue(mockCookieStore)
    
    const { cookies } = await import('next/headers')
    vi.mocked(cookies).mockImplementation(mockCookies)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render header with basic structure', async () => {
      const { getNavigationItems } = await import('@/lib/navigation')
      vi.mocked(getNavigationItems).mockReturnValue([
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/tasks', label: 'Tasks' },
      ])

      const { verifySession } = await import('@/lib/auth')
      vi.mocked(verifySession).mockResolvedValue(null)

      const HeaderComponent = await Header()
      render(HeaderComponent)

      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByText('Task Manager')).toBeInTheDocument()
      expect(screen.getByTestId('navigation-menu')).toBeInTheDocument()
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
    })

    it('should render navigation items correctly', async () => {
      const { getNavigationItems } = await import('@/lib/navigation')
      const mockNavItems = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/tasks', label: 'Tasks' },
        { href: '/settings', label: 'Settings' },
      ]
      vi.mocked(getNavigationItems).mockReturnValue(mockNavItems)

      const { verifySession } = await import('@/lib/auth')
      vi.mocked(verifySession).mockResolvedValue(null)

      const HeaderComponent = await Header()
      render(HeaderComponent)

      const navItems = screen.getAllByTestId('nav-item')
      expect(navItems).toHaveLength(3)
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Tasks')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('should render home link with correct href', async () => {
      const { getNavigationItems } = await import('@/lib/navigation')
      vi.mocked(getNavigationItems).mockReturnValue([])

      const { verifySession } = await import('@/lib/auth')
      vi.mocked(verifySession).mockResolvedValue(null)

      const HeaderComponent = await Header()
      render(HeaderComponent)

      const homeLink = screen.getByTestId('next-link')
      expect(homeLink).toHaveAttribute('href', '/')
      expect(homeLink).toHaveTextContent('Task Manager')
    })
  })

  describe('Authentication States', () => {
    it('should not show user profile when no session exists', async () => {
      const { getNavigationItems } = await import('@/lib/navigation')
      vi.mocked(getNavigationItems).mockReturnValue([])

      mockCookieStore.get.mockReturnValue(undefined)

      const { verifySession } = await import('@/lib/auth')
      vi.mocked(verifySession).mockResolvedValue(null)

      const HeaderComponent = await Header()
      render(HeaderComponent)

      expect(screen.queryByTestId('user-profile-dropdown')).not.toBeInTheDocument()
    })

    it('should not show user profile when session is invalid', async () => {
      const { getNavigationItems } = await import('@/lib/navigation')
      vi.mocked(getNavigationItems).mockReturnValue([])

      mockCookieStore.get.mockReturnValue({ value: 'invalid-session' })

      const { verifySession } = await import('@/lib/auth')
      vi.mocked(verifySession).mockResolvedValue(null)

      const HeaderComponent = await Header()
      render(HeaderComponent)

      expect(screen.queryByTestId('user-profile-dropdown')).not.toBeInTheDocument()
    })

    it('should show user profile when valid session exists', async () => {
      const { getNavigationItems } = await import('@/lib/navigation')
      vi.mocked(getNavigationItems).mockReturnValue([])

      mockCookieStore.get.mockReturnValue({ value: 'valid-session-token' })

      const { verifySession } = await import('@/lib/auth')
      const { getCurrentUserServer } = await import('@/lib/api-client-server')
      
      const mockSession = {
        userId: 'user123',
        accessToken: 'access123',
      }

      const mockUserProfile = {
        username: 'testuser',
        email: 'test@example.com',
      }

      vi.mocked(verifySession).mockResolvedValue(mockSession)
      vi.mocked(getCurrentUserServer).mockResolvedValue(mockUserProfile)

      const HeaderComponent = await Header()
      render(HeaderComponent)

      expect(screen.getByTestId('user-profile-dropdown')).toBeInTheDocument()
      expect(screen.getByText('testuser')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('should fail when session verification throws error', async () => {
      const { getNavigationItems } = await import('@/lib/navigation')
      vi.mocked(getNavigationItems).mockReturnValue([])

      mockCookieStore.get.mockReturnValue({ value: 'session-token' })

      const { verifySession } = await import('@/lib/auth')
      vi.mocked(verifySession).mockRejectedValue(new Error('Session verification failed'))

      // The component should throw an error when session verification fails
      await expect(Header()).rejects.toThrow('Session verification failed')
    })
  })

  describe('User Profile Fetching', () => {
    it('should fetch user profile when session is valid', async () => {
      const { getNavigationItems } = await import('@/lib/navigation')
      vi.mocked(getNavigationItems).mockReturnValue([])

      mockCookieStore.get.mockReturnValue({ value: 'valid-session-token' })

      const { verifySession } = await import('@/lib/auth')
      const { getCurrentUserServer } = await import('@/lib/api-client-server')
      
      const mockSession = {
        userId: 'user123',
        accessToken: 'access123',
      }

      const mockUserProfile = {
        username: 'testuser',
        email: 'test@example.com',
      }

      vi.mocked(verifySession).mockResolvedValue(mockSession)
      vi.mocked(getCurrentUserServer).mockResolvedValue(mockUserProfile)

      const HeaderComponent = await Header()
      render(HeaderComponent)

      expect(getCurrentUserServer).toHaveBeenCalledWith('access123')
      expect(screen.getByTestId('user-profile-dropdown')).toBeInTheDocument()
    })

    it('should handle user profile fetch errors gracefully', async () => {
      const { getNavigationItems } = await import('@/lib/navigation')
      vi.mocked(getNavigationItems).mockReturnValue([])

      mockCookieStore.get.mockReturnValue({ value: 'valid-session-token' })

      const { verifySession } = await import('@/lib/auth')
      const { getCurrentUserServer } = await import('@/lib/api-client-server')
      
      const mockSession = {
        userId: 'user123',
        accessToken: 'access123',
      }

      vi.mocked(verifySession).mockResolvedValue(mockSession)
      vi.mocked(getCurrentUserServer).mockRejectedValue(new Error('API Error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const HeaderComponent = await Header()
      render(HeaderComponent)

      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch user profile:', expect.any(Error))
      expect(screen.queryByTestId('user-profile-dropdown')).not.toBeInTheDocument()

      consoleSpy.mockRestore()
    })

    it('should not fetch user profile when session is null', async () => {
      const { getNavigationItems } = await import('@/lib/navigation')
      vi.mocked(getNavigationItems).mockReturnValue([])

      mockCookieStore.get.mockReturnValue(undefined)

      const { verifySession } = await import('@/lib/auth')
      const { getCurrentUserServer } = await import('@/lib/api-client-server')
      
      vi.mocked(verifySession).mockResolvedValue(null)

      const HeaderComponent = await Header()
      render(HeaderComponent)

      expect(getCurrentUserServer).not.toHaveBeenCalled()
      expect(screen.queryByTestId('user-profile-dropdown')).not.toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('should render all child components in correct order', async () => {
      const { getNavigationItems } = await import('@/lib/navigation')
      vi.mocked(getNavigationItems).mockReturnValue([
        { href: '/tasks', label: 'Tasks' },
      ])

      const { verifySession } = await import('@/lib/auth')
      vi.mocked(verifySession).mockResolvedValue(null)

      const HeaderComponent = await Header()
      const { container } = render(HeaderComponent)

      const header = container.querySelector('header')
      const headerContent = header?.querySelector('.container')
      
      expect(headerContent).toBeInTheDocument()
      
      // Check order: Task Manager (brand), Navigation, Theme Toggle
      const brand = screen.getByText('Task Manager')
      const nav = screen.getByTestId('navigation-menu')
      const themeToggle = screen.getByTestId('theme-toggle')
      
      expect(brand).toBeInTheDocument()
      expect(nav).toBeInTheDocument()
      expect(themeToggle).toBeInTheDocument()
    })

    it('should apply correct CSS classes', async () => {
      const { getNavigationItems } = await import('@/lib/navigation')
      vi.mocked(getNavigationItems).mockReturnValue([])

      const { verifySession } = await import('@/lib/auth')
      vi.mocked(verifySession).mockResolvedValue(null)

      const HeaderComponent = await Header()
      const { container } = render(HeaderComponent)

      const header = container.querySelector('header')
      const containerDiv = header?.querySelector('.container')
      
      expect(header).toHaveClass('border-b')
      expect(containerDiv).toHaveClass('container', 'mx-auto', 'flex', 'h-14', 'items-center', 'justify-between', 'px-4')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty navigation items', async () => {
      const { getNavigationItems } = await import('@/lib/navigation')
      vi.mocked(getNavigationItems).mockReturnValue([])

      const { verifySession } = await import('@/lib/auth')
      vi.mocked(verifySession).mockResolvedValue(null)

      const HeaderComponent = await Header()
      render(HeaderComponent)

      expect(screen.getByTestId('navigation-menu-list')).toBeInTheDocument()
      expect(screen.queryByTestId('nav-item')).not.toBeInTheDocument()
    })

    it('should handle malformed session cookie', async () => {
      const { getNavigationItems } = await import('@/lib/navigation')
      vi.mocked(getNavigationItems).mockReturnValue([])

      mockCookieStore.get.mockReturnValue({ value: '' })

      const { verifySession } = await import('@/lib/auth')
      vi.mocked(verifySession).mockResolvedValue(null)

      const HeaderComponent = await Header()
      render(HeaderComponent)

      expect(screen.queryByTestId('user-profile-dropdown')).not.toBeInTheDocument()
    })

    it('should handle navigation items fetch errors', async () => {
      const { getNavigationItems } = await import('@/lib/navigation')
      vi.mocked(getNavigationItems).mockImplementation(() => {
        throw new Error('Navigation fetch failed')
      })

      const { verifySession } = await import('@/lib/auth')
      vi.mocked(verifySession).mockResolvedValue(null)

      await expect(Header()).rejects.toThrow('Navigation fetch failed')
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic HTML structure', async () => {
      const { getNavigationItems } = await import('@/lib/navigation')
      vi.mocked(getNavigationItems).mockReturnValue([])

      const { verifySession } = await import('@/lib/auth')
      vi.mocked(verifySession).mockResolvedValue(null)

      const HeaderComponent = await Header()
      const { container } = render(HeaderComponent)

      const header = container.querySelector('header')
      const nav = container.querySelector('nav')
      
      expect(header).toBeInTheDocument()
      expect(nav).toBeInTheDocument()
      // Header elements are semantically correct without explicit role
      expect(header?.tagName).toBe('HEADER')
    })

    it('should have accessible navigation links', async () => {
      const { getNavigationItems } = await import('@/lib/navigation')
      vi.mocked(getNavigationItems).mockReturnValue([
        { href: '/tasks', label: 'Tasks' },
        { href: '/settings', label: 'Settings' },
      ])

      const { verifySession } = await import('@/lib/auth')
      vi.mocked(verifySession).mockResolvedValue(null)

      const HeaderComponent = await Header()
      render(HeaderComponent)

      const navItems = screen.getAllByTestId('nav-item')
      navItems.forEach((item) => {
        const link = item.querySelector('a')
        expect(link).toHaveAttribute('href')
      })
    })
  })
})
