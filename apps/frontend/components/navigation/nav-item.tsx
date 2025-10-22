import Link from 'next/link'
import {
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'
import type { NavigationItem } from '@/lib/navigation'

type NavItemProps = {
  item: NavigationItem
}

export const NavItem: React.FC<NavItemProps> = ({ item }) => {
  return (
    <NavigationMenuItem>
      <NavigationMenuLink asChild>
        <Link href={item.href} className="px-3 py-2 text-sm hover:underline">
          {item.icon && <span className="mr-2">{item.icon()}</span>}
          {item.label}
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  )
}
