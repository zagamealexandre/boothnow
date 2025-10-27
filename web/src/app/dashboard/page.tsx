import { auth, currentUser } from '@clerk/nextjs/server'
import { redirectToSignIn } from '@clerk/nextjs'
import dynamic from 'next/dynamic'

export default async function DashboardPage() {
  const { userId } = auth()
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: '/dashboard' })
  }

  const user = await currentUser()

  // Serialize the Clerk user data to plain objects to avoid Next.js errors
  const serializedUser = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress,
    emailAddresses: user.emailAddresses?.map(email => ({
      emailAddress: email.emailAddress
    })) || [],
    primaryEmailAddress: user.primaryEmailAddress ? {
      emailAddress: user.primaryEmailAddress.emailAddress
    } : null,
    phoneNumbers: user.phoneNumbers?.map(phone => ({
      phoneNumber: phone.phoneNumber
    })) || [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  } : null

  const Dashboard = dynamic(() => import('../../components/Dashboard'), { ssr: false })
  return <Dashboard clerkUser={serializedUser} />
}
