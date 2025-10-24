import { auth, currentUser } from '@clerk/nextjs/server'
import { redirectToSignIn } from '@clerk/nextjs'
import dynamic from 'next/dynamic'

export default async function DashboardPage() {
  const { userId } = auth()
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: '/dashboard' })
  }

  const user = await currentUser()

  const Dashboard = dynamic(() => import('../../components/Dashboard'), { ssr: false })
  return <Dashboard firstName={user?.firstName ?? null} />
}
