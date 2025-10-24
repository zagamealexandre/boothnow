import { auth, currentUser } from '@clerk/nextjs/server'
import { redirectToSignIn } from '@clerk/nextjs'
import dynamic from 'next/dynamic'

export default async function RewardsPage() {
  const { userId } = auth()
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: '/rewards' })
  }

  const user = await currentUser()

  const Rewards = dynamic(() => import('../../components/Rewards'), { ssr: false })
  return <Rewards />
}
