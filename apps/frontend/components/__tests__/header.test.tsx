import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from '@/components/header'
import { ThemeProvider } from '@/components/theme-provider'

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

const renderHeader = (): void => {
  render(
    <ThemeProvider>
      <Header />
    </ThemeProvider>
  )
}

describe('Header Component', () => {
  it('should render the header element', () => {
    renderHeader()
    
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
  })

  it('should display the application title', () => {
    renderHeader()
    
    const title = screen.getByText('Task Manager')
    expect(title).toBeInTheDocument()
  })

  it('should render navigation menu', () => {
    renderHeader()
    
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
  })

  it('should render all navigation links', () => {
    renderHeader()
    
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
  })

  it('should have correct href attributes for navigation links', () => {
    renderHeader()
    
    const homeLink = screen.getByRole('link', { name: /home/i })
    const settingsLink = screen.getByRole('link', { name: /settings/i })
    
    expect(homeLink).toHaveAttribute('href', '/app')
    expect(settingsLink).toHaveAttribute('href', '/app/settings')
  })

  it('should apply correct styling classes', () => {
    renderHeader()
    
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('border-b')
  })

  it('should have title link to home page', () => {
    renderHeader()
    
    const titleLink = screen.getByText('Task Manager').closest('a')
    expect(titleLink).toHaveAttribute('href', '/')
  })
})
