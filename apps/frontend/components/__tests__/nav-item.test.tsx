import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NavItem } from '@/components/nav-item'
import { NavigationMenu, NavigationMenuList } from '@/components/ui/navigation-menu'

describe('NavItem Component', () => {
  const mockItem = {
    label: 'Dashboard',
    href: '/',
  }

  // Helper to render NavItem with required NavigationMenu context
  const renderNavItem = (item: typeof mockItem) => {
    return render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavItem item={item} />
        </NavigationMenuList>
      </NavigationMenu>
    )
  }

  it('should render navigation item with label', () => {
    renderNavItem(mockItem)
    
    const link = screen.getByRole('link', { name: /dashboard/i })
    expect(link).toBeInTheDocument()
  })

  it('should have correct href attribute', () => {
    renderNavItem(mockItem)
    
    const link = screen.getByRole('link', { name: /dashboard/i })
    expect(link).toHaveAttribute('href', '/')
  })

  it('should apply consistent styling classes', () => {
    renderNavItem(mockItem)
    
    const link = screen.getByRole('link', { name: /dashboard/i })
    expect(link).toHaveClass('px-3', 'py-2', 'text-sm')
  })

  it('should render icon when provided', () => {
    const itemWithIcon = {
      ...mockItem,
      icon: () => <svg data-testid="test-icon" />,
    }
    
    renderNavItem(itemWithIcon)
    
    const icon = screen.getByTestId('test-icon')
    expect(icon).toBeInTheDocument()
  })

  it('should render without icon when not provided', () => {
    renderNavItem(mockItem)
    
    const link = screen.getByRole('link', { name: /dashboard/i })
    expect(link.querySelector('svg')).not.toBeInTheDocument()
  })

  it('should be accessible', () => {
    renderNavItem(mockItem)
    
    const link = screen.getByRole('link', { name: /dashboard/i })
    expect(link).toBeVisible()
  })
})
