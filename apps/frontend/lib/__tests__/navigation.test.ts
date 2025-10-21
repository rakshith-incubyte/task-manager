import { describe, it, expect } from 'vitest'
import { getNavigationItems, type NavigationItem } from '@/lib/navigation'

describe('Navigation Configuration', () => {
  describe('getNavigationItems', () => {
    it('should return an array of navigation items', () => {
      const items = getNavigationItems()
      
      expect(items).toBeInstanceOf(Array)
      expect(items.length).toBeGreaterThan(0)
    })

    it('should return navigation items with required properties', () => {
      const items = getNavigationItems()
      
      items.forEach((item) => {
        expect(item).toHaveProperty('label')
        expect(item).toHaveProperty('href')
        expect(typeof item.label).toBe('string')
        expect(typeof item.href).toBe('string')
      })
    })

    it('should include Dashboard navigation item', () => {
      const items = getNavigationItems()
      const dashboard = items.find((item) => item.label === 'Dashboard')
      
      expect(dashboard).toBeDefined()
      expect(dashboard?.href).toBe('/')
    })

    it('should include Tasks navigation item', () => {
      const items = getNavigationItems()
      const tasks = items.find((item) => item.label === 'Tasks')
      
      expect(tasks).toBeDefined()
      expect(tasks?.href).toBe('/tasks')
    })

    it('should include Settings navigation item', () => {
      const items = getNavigationItems()
      const settings = items.find((item) => item.label === 'Settings')
      
      expect(settings).toBeDefined()
      expect(settings?.href).toBe('/settings')
    })

    it('should return items in correct order', () => {
      const items = getNavigationItems()
      
      expect(items[0].label).toBe('Dashboard')
      expect(items[1].label).toBe('Tasks')
      expect(items[2].label).toBe('Settings')
    })

    it('should support optional icon property', () => {
      const items = getNavigationItems()
      
      items.forEach((item) => {
        if (item.icon) {
          expect(typeof item.icon).toBe('function')
        }
      })
    })
  })

  describe('NavigationItem type', () => {
    it('should have correct type structure', () => {
      const mockItem: NavigationItem = {
        label: 'Test',
        href: '/test',
      }
      
      expect(mockItem.label).toBe('Test')
      expect(mockItem.href).toBe('/test')
    })

    it('should allow optional icon property', () => {
      const mockItem: NavigationItem = {
        label: 'Test',
        href: '/test',
        icon: () => null,
      }
      
      expect(mockItem.icon).toBeDefined()
    })
  })
})
