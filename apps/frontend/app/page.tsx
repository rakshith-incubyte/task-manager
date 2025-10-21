import Link from 'next/link'
import { cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { SESSION_COOKIE_NAME } from '@/lib/cookies'
import { verifySession } from '@/lib/auth'

export default async function Home(): Promise<React.ReactElement> {
  // Check if user is authenticated
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const session = sessionCookie ? await verifySession(sessionCookie) : null
  const isAuthenticated = !!session

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Task Manager</h2>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <Button asChild>
                <Link href="/app">Go to Your Tasks</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 space-y-16">
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to Task Manager
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Organize your work and life, finally. Become focused, organized, and calm with Task Manager.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            {isAuthenticated ? (
              <Button asChild size="lg">
                <Link href="/app">Go to Your Tasks</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link href="/register">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">Login</Link>
                </Button>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
