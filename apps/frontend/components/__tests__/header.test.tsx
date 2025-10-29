import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@/components/theme/theme-provider'
import Link from 'next/link'
import {
  NavigationMenu,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { NavItem } from '@/components/navigation/nav-item'

// Mock Next.js server-side dependencies
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: () => null, // No session cookie
  }),
}))

vi.mock('@/lib/auth', () => ({
  verifySession: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/api-client-server', () => ({
  getCurrentUserServer: vi.fn().mockResolvedValue(null),
}))

const originalMatchMedia = window.matchMedia

const mockMatchMedia = (matches = false): MediaQueryList => ({
  media: '(prefers-color-scheme: dark)',
  matches,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => true,
})

beforeAll(() => {
  window.matchMedia = () => mockMatchMedia(false)
})

afterAll(() => {
  window.matchMedia = originalMatchMedia
})

// Create a simplified version of the Header for testing
const TestHeader = () => {
  const navigationItems = [
    {
      label: 'Home',
      href: '/app',
    }
  ]

  return (
    <ThemeProvider>
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Task Manager
          </Link>
          <div className="flex items-center gap-4">
            <NavigationMenu>
              <NavigationMenuList>
                {navigationItems.map((item) => (
                  <NavItem key={item.href} item={item} />
                ))}
              </NavigationMenuList>
            </NavigationMenu>
            <ThemeToggle />
          </div>
        </div>
      </header>
    </ThemeProvider>
  )
}

describe('Header Component', () => {
  it('should render the header element', () => {
    render(<TestHeader />)
    
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
  })

  it('should display the application title', () => {
    render(<TestHeader />)
    
    const title = screen.getByText('Task Manager')
    expect(title).toBeInTheDocument()
  })

  it('should render navigation menu', () => {
    render(<TestHeader />)
    
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
  })

  it('should render home navigation link', () => {
    render(<TestHeader />)
    
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
  })

  it('should have correct href attributes for navigation links', () => {
    render(<TestHeader />)
    
    const homeLink = screen.getByRole('link', { name: /home/i })
    
    expect(homeLink).toHaveAttribute('href', '/app')
  })

  it('should apply correct styling classes', () => {
    render(<TestHeader />)
    
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('border-b')
  })

  it('should have title link to home page', () => {
    render(<TestHeader />)
    
    const titleElement = screen.getByText('Task Manager')
    expect(titleElement).toBeInTheDocument()
    expect(titleElement.closest('a')).toHaveAttribute('href', '/')
  })
})
