export type NavigationItem = {
  label: string
  href: string
  icon?: () => React.ReactNode
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Home',
    href: '/app',
  }
]

export const getNavigationItems = (): NavigationItem[] => {
  return navigationItems
}
