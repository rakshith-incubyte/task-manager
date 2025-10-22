import Link from 'next/link'
import { cookies } from 'next/headers'
import {
  NavigationMenu,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { NavItem } from './nav-item'
import { getNavigationItems } from '@/lib/navigation'
import { UserProfileDropdown } from './user-profile-dropdown'
import { verifySession } from '@/lib/auth'
import { getCurrentUser } from '@/lib/api-client'

export const Header: React.FC = async () => {
  const navigationItems = getNavigationItems()
  
  // Get user session and fetch user profile
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  const session = sessionCookie ? await verifySession(sessionCookie.value) : null
  
  // Fetch user profile if session exists
  let userProfile = null
  if (session) {
    try {
      userProfile = await getCurrentUser(session.accessToken)
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    }
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          Task Manager
        </Link>
        <div className="flex items-center gap-4">
          <NavigationMenu>
            <NavigationMenuList>
              {navigationItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <ThemeToggle />
          {userProfile && (
            <UserProfileDropdown
              username={userProfile.username}
              email={userProfile.email}
            />
          )}
        </div>
      </div>
    </header>
  )
}
