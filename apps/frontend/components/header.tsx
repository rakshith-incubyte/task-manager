import Link from 'next/link'
import {
  NavigationMenu,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import { NavItem } from './nav-item'
import { getNavigationItems } from '@/lib/navigation'

export const Header: React.FC = () => {
  const navigationItems = getNavigationItems()

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold">
          Task Manager
        </Link>
        <NavigationMenu>
          <NavigationMenuList>
            {navigationItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  )
}
