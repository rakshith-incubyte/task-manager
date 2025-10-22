import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { THEME_STORAGE_KEY } from '@/lib/theme-storage'

describe('Theme Toggle', () => {
  const originalMatchMedia = window.matchMedia

  beforeAll(() => {
    window.matchMedia = (query: string): MediaQueryList => ({
      media: query,
      matches: false,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => true,
    })
  })

  afterAll(() => {
    window.matchMedia = originalMatchMedia
  })

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  const renderToggle = (): void => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )
  }

  it('should render an accessible toggle button', () => {
    renderToggle()

    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  it('should apply dark mode when the toggle is activated', async () => {
    const user = userEvent.setup()
    renderToggle()

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('should persist the selected theme to storage', async () => {
    const user = userEvent.setup()
    renderToggle()

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('should respect stored theme on initial render', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')

    renderToggle()

    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('should fall back to system preference when no stored theme exists', () => {
    window.matchMedia = () => ({
      media: '(prefers-color-scheme: dark)',
      matches: true,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => true,
    })

    renderToggle()

    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })
})
