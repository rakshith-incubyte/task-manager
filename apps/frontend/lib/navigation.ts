export type NavigationItem = {
  label: string
  href: string
  icon?: () => React.ReactNode
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/',
  },
  {
    label: 'Tasks',
    href: '/tasks',
  },
  {
    label: 'Settings',
    href: '/settings',
  },
]

export const getNavigationItems = (): NavigationItem[] => {
  return navigationItems
}
