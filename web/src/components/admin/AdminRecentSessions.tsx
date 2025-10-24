'use client'

import { useState } from 'react'
import { Clock, MapPin, User, Euro } from 'lucide-react'

interface Session {
  id: string
  user: string
  booth: string
  startTime: string
  duration: number
  cost: number
  status: 'active' | 'completed' | 'cancelled'
}

const mockSessions: Session[] = [
  {
    id: '1',
    user: 'Anna Lindqvist',
    booth: '7-Eleven Stockholm Central',
    startTime: '2024-01-15T10:30:00Z',
    duration: 45,
    cost: 22.50,
    status: 'completed'
  },
  {
    id: '2',
    user: 'Erik Hansen',
    booth: '7-Eleven Oslo Downtown',
    startTime: '2024-01-15T11:15:00Z',
    duration: 30,
    cost: 15.00,
    status: 'active'
  },
  {
    id: '3',
    user: 'Maria Andersson',
    booth: '7-Eleven Copenhagen Main',
    startTime: '2024-01-15T09:45:00Z',
    duration: 60,
    cost: 30.00,
    status: 'completed'
  },
  {
    id: '4',
    user: 'Lars Johansson',
    booth: '7-Eleven Stockholm North',
    startTime: '2024-01-15T08:20:00Z',
    duration: 25,
    cost: 12.50,
    status: 'cancelled'
  },
]

export function AdminRecentSessions() {
  const [sessions] = useState<Session[]>(mockSessions)

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Sessions</h3>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          View all
        </button>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{session.user}</p>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{session.booth}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(session.startTime)}</span>
                </div>
                <p className="text-sm text-gray-500">{session.duration} min</p>
              </div>

              <div className="text-right">
                <div className="flex items-center space-x-1 text-sm font-medium text-gray-900">
                  <Euro className="w-4 h-4" />
                  <span>{session.cost.toFixed(2)}</span>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
