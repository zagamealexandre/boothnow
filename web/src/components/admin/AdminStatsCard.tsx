import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminStatsCardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
  red: 'bg-red-100 text-red-600',
}

export function AdminStatsCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
}: AdminStatsCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={cn('p-3 rounded-lg', colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      <div className="mt-4 flex items-center">
        {changeType === 'positive' ? (
          <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
        ) : changeType === 'negative' ? (
          <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
        ) : null}
        <span className={cn(
          'text-sm font-medium',
          changeType === 'positive' && 'text-green-600',
          changeType === 'negative' && 'text-red-600',
          changeType === 'neutral' && 'text-gray-600'
        )}>
          {change}
        </span>
        <span className="text-sm text-gray-500 ml-1">vs last month</span>
      </div>
    </div>
  )
}
