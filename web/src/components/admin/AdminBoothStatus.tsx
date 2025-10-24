'use client'

import { useState } from 'react'
import { MapPin, Clock, Wifi, AlertCircle } from 'lucide-react'

interface Booth {
  id: string
  name: string
  location: string
  status: 'available' | 'occupied' | 'maintenance' | 'offline'
  lastUsed: string
  totalSessions: number
  revenue: number
}

const mockBooths: Booth[] = [
  {
    id: '1',
    name: 'Stockholm Central',
    location: 'Storgatan 1, Stockholm',
    status: 'available',
    lastUsed: '2024-01-15T10:30:00Z',
    totalSessions: 156,
    revenue: 2340.50
  },
  {
    id: '2',
    name: 'Oslo Downtown',
    location: 'Karl Johans gate 1, Oslo',
    status: 'occupied',
    lastUsed: '2024-01-15T11:15:00Z',
    totalSessions: 142,
    revenue: 2130.75
  },
  {
    id: '3',
    name: 'Copenhagen Main',
    location: 'Strøget 1, Copenhagen',
    status: 'maintenance',
    lastUsed: '2024-01-14T16:45:00Z',
    totalSessions: 98,
    revenue: 1470.25
  },
  {
    id: '4',
    name: 'Stockholm North',
    location: 'Drottninggatan 15, Stockholm',
    status: 'offline',
    lastUsed: '2024-01-13T14:20:00Z',
    totalSessions: 87,
    revenue: 1305.00
  },
]

export function AdminBoothStatus() {
  const [booths] = useState<Booth[]>(mockBooths)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'occupied':
        return 'bg-blue-100 text-blue-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      case 'offline':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <Wifi className="w-4 h-4" />
      case 'occupied':
        return <Clock className="w-4 h-4" />
      case 'maintenance':
        return <AlertCircle className="w-4 h-4" />
      case 'offline':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  const formatLastUsed = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Booth Status</h3>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          Manage
        </button>
      </div>

      <div className="space-y-4">
        {booths.map((booth) => (
          <div key={booth.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{booth.name}</p>
                  <p className="text-sm text-gray-600">{booth.location}</p>
                </div>
              </div>
              <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booth.status)}`}>
                {getStatusIcon(booth.status)}
                <span>{booth.status}</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Last Used</p>
                <p className="font-medium text-gray-900">{formatLastUsed(booth.lastUsed)}</p>
              </div>
              <div>
                <p className="text-gray-500">Sessions</p>
                <p className="font-medium text-gray-900">{booth.totalSessions}</p>
              </div>
              <div>
                <p className="text-gray-500">Revenue</p>
                <p className="font-medium text-gray-900">€{booth.revenue.toFixed(0)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {booths.filter(b => b.status === 'available').length}
            </p>
            <p className="text-sm text-gray-600">Available</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {booths.filter(b => b.status === 'occupied').length}
            </p>
            <p className="text-sm text-gray-600">In Use</p>
          </div>
        </div>
      </div>
    </div>
  )
}
