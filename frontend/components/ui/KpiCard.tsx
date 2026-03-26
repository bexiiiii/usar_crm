import { cn } from '@/lib/utils'
import {
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  ArrowDownRight01Icon,
} from 'hugeicons-react'
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
      className={cn(
        'rounded-2xl p-5 flex flex-col gap-3',
        onClick && 'cursor-pointer'
      )}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F4',
        boxShadow: '0 1px 4px 0 rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.15s',
      }}
      onClick={onClick}
      onMouseEnter={e => {
        if (onClick) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px 0 rgba(0,0,0,0.1)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px 0 rgba(0,0,0,0.05)'
      }}
    >
      {/* Top row: label + arrow */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6B7A9A' }}>
          {title}
        </p>
        <ArrowRight01Icon size={16} style={{ color: '#6B7A9A' }} />
      </div>

      {/* Middle: big value */}
      <div className="flex items-center justify-between">
        <p className="text-2xl font-bold leading-none" style={{ color: '#1A2332' }}>
          {value}
        </p>
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#EEF0F8' }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Bottom row: trend badge + label */}
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: isPositive ? '#DCFCE7' : '#FEE2E2',
            color: isPositive ? '#16A34A' : '#DC2626',
          }}
        >
          {isPositive
            ? <ArrowUpRight01Icon size={12} />
            : <ArrowDownRight01Icon size={12} />
          }
          {Math.abs(trend).toFixed(1)}%
        </span>
        <span className="text-xs" style={{ color: '#6B7A9A' }}>
          С прошлого месяца
        </span>
      </div>
    </div>
  )
}
