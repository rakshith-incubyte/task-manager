import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth'
import { SESSION_COOKIE_NAME } from '@/lib/cookies'
import { getTasks } from '@/lib/api-client'
import { TaskList } from '@/components/tasks/task-list'

export default async function DashboardPage(): Promise<React.ReactElement> {
  // Get session
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value
  
  if (!sessionCookie) {
    redirect('/login')
  }

  const session = await verifySession(sessionCookie)
  
  if (!session) {
    redirect('/login')
  }

  // Fetch tasks
  const tasksData = await getTasks(session.accessToken, { limit: 20 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Tasks</h1>
      </div>
      <TaskList initialTasks={tasksData} accessToken={session.accessToken} />
    </div>
  )
}
