import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from '@/components/header'

describe('Header Component', () => {
  it('should render the header element', () => {
    render(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
  })

  it('should display the application title', () => {
    render(<Header />)
    
    const title = screen.getByText('Task Manager')
    expect(title).toBeInTheDocument()
  })

  it('should render navigation menu', () => {
    render(<Header />)
    
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
  })

  it('should render all navigation links', () => {
    render(<Header />)
    
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /tasks/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
  })

  it('should have correct href attributes for navigation links', () => {
    render(<Header />)
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    const tasksLink = screen.getByRole('link', { name: /tasks/i })
    const settingsLink = screen.getByRole('link', { name: /settings/i })
    
    expect(dashboardLink).toHaveAttribute('href', '/')
    expect(tasksLink).toHaveAttribute('href', '/tasks')
    expect(settingsLink).toHaveAttribute('href', '/settings')
  })

  it('should apply correct styling classes', () => {
    render(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('border-b')
  })

  it('should have title link to home page', () => {
    render(<Header />)
    
    const titleLink = screen.getByText('Task Manager').closest('a')
    expect(titleLink).toHaveAttribute('href', '/')
  })
})
