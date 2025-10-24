'use client'

import { useState, useEffect } from 'react'
import { Users, MapPin, Clock, DollarSign, TrendingUp, Activity } from 'lucide-react'
import { AdminStatsCard } from '@/components/admin/AdminStatsCard'
import { AdminChart } from '@/components/admin/AdminChart'
import { AdminRecentSessions } from '@/components/admin/AdminRecentSessions'
import { AdminBoothStatus } from '@/components/admin/AdminBoothStatus'

interface DashboardStats {
  totalUsers: number
  totalSessions: number
  totalRevenue: number
  activeBooths: number
  averageSessionDuration: number
  conversionRate: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSessions: 0,
    totalRevenue: 0,
    activeBooths: 0,
    averageSessionDuration: 0,
    conversionRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setStats({
        totalUsers: 1247,
        totalSessions: 3421,
        totalRevenue: 45680,
        activeBooths: 12,
        averageSessionDuration: 45,
        conversionRate: 23.5,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your BoothNow operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change="+12%"
          changeType="positive"
          icon={Users}
          color="blue"
        />
        <AdminStatsCard
          title="Total Sessions"
          value={stats.totalSessions.toLocaleString()}
          change="+8%"
          changeType="positive"
          icon={Activity}
          color="green"
        />
        <AdminStatsCard
          title="Revenue"
          value={`€${stats.totalRevenue.toLocaleString()}`}
          change="+15%"
          changeType="positive"
          icon={DollarSign}
          color="purple"
        />
        <AdminStatsCard
          title="Active Booths"
          value={stats.activeBooths.toString()}
          change="+2"
          changeType="positive"
          icon={MapPin}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminChart
          title="Session Trends"
          description="Daily session count over the last 30 days"
          type="line"
          data={[
            { name: 'Week 1', sessions: 120 },
            { name: 'Week 2', sessions: 145 },
            { name: 'Week 3', sessions: 180 },
            { name: 'Week 4', sessions: 220 },
          ]}
        />
        <AdminChart
          title="Revenue by Location"
          description="Revenue breakdown by booth location"
          type="bar"
          data={[
            { name: 'Stockholm Central', revenue: 12000 },
            { name: 'Oslo Downtown', revenue: 9800 },
            { name: 'Copenhagen Main', revenue: 8500 },
            { name: 'Stockholm North', revenue: 7200 },
          ]}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AdminRecentSessions />
        </div>
        <div>
          <AdminBoothStatus />
        </div>
      </div>
    </div>
  )
}
