export type NavigationItem = {
  label: string
  href: string
  icon?: () => React.ReactNode
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Home',
    href: '/app',
  },
  {
    label: 'Settings',
    href: '/app/settings',
  },
]

export const getNavigationItems = (): NavigationItem[] => {
  return navigationItems
}
