"use client"

import { useState } from 'react'
import { usePointsEarning } from '../hooks/usePointsEarning'
import { Coffee, Calendar, Users, Star, CheckCircle } from 'lucide-react'

export default function PointsEarningDemo() {
  const { awardBoothSessionPoints, awardAdvanceBookingPoints, awardFriendInvitePoints, awardReviewPoints } = usePointsEarning()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [lastAwarded, setLastAwarded] = useState<string | null>(null)

  const handleAwardPoints = async (action: string, pointsFunction: () => Promise<any>, points: number) => {
    setIsLoading(action)
    setLastAwarded(null)
    
    try {
      const result = await pointsFunction()
      if (result.success) {
        setLastAwarded(`${action} - ${points} points awarded!`)
        setTimeout(() => setLastAwarded(null), 3000)
      } else {
        console.error(`Failed to award points for ${action}:`, result.error)
      }
    } catch (error) {
      console.error(`Error awarding points for ${action}:`, error)
    } finally {
      setIsLoading(null)
    }
  }

  const actions = [
    {
      id: 'booth_session',
      title: 'Complete a booth session',
      points: 50,
      icon: Coffee,
      action: () => awardBoothSessionPoints('demo-session-' + Date.now())
    },
    {
      id: 'advance_booking',
      title: 'Book in advance',
      points: 25,
      icon: Calendar,
      action: () => awardAdvanceBookingPoints('demo-booking-' + Date.now())
    },
    {
      id: 'friend_invite',
      title: 'Invite a friend',
      points: 100,
      icon: Users,
      action: () => awardFriendInvitePoints('demo-invite-' + Date.now())
    },
    {
      id: 'review',
      title: 'Leave a review',
      points: 10,
      icon: Star,
      action: () => awardReviewPoints('demo-review-' + Date.now())
    }
  ]

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Points Earning</h3>
      <p className="text-sm text-gray-600 mb-4">
        Click the buttons below to test the points earning system. Each action will award the corresponding points.
      </p>
      
      {lastAwarded && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-800">{lastAwarded}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action) => {
          const IconComponent = action.icon
          return (
            <button
              key={action.id}
              onClick={() => handleAwardPoints(action.title, action.action, action.points)}
              disabled={isLoading === action.id}
              className="flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <IconComponent className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{action.title}</div>
                <div className="text-xs text-gray-500">+{action.points} points</div>
              </div>
              {isLoading === action.id && (
                <div className="animate-spin h-4 w-4 border-2 border-orange-600 border-t-transparent rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
