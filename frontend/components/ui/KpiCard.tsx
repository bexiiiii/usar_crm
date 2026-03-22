import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { ReactNode } from 'react'

interface KpiCardProps {
  title: string
  value: string
  trend: number
  icon?: ReactNode
  prefix?: string
  onClick?: () => void
}

export default function KpiCard({ title, value, trend, icon, onClick }: KpiCardProps) {
  const isPositive = trend >= 0

  return (
    <div
      className={cn('bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4', onClick && 'cursor-pointer hover:shadow-md transition-shadow')}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        {icon && (
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            {icon}
          </div>
        )}
      </div>
      <div className={cn('flex items-center gap-1 text-sm font-medium', isPositive ? 'text-green-600' : 'text-red-600')}>
        {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        <span>{Math.abs(trend).toFixed(2)}% vs прошлый месяц</span>
      </div>
    </div>
  )
}
