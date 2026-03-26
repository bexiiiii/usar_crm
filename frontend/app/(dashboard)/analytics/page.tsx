'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import api from '@/lib/api'
import { CardSkeleton } from '@/components/ui/LoadingSkeleton'
import { formatCurrency } from '@/lib/utils'
import { DashboardStats } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { canAccess } from '@/lib/auth'
import {
  ChartIncreaseIcon,
  ChartDecreaseIcon,
  ChartLineData01Icon,
  ArrowRight01Icon,
} from 'hugeicons-react'

// Month labels
const MONTH_LABELS: Record<string, string> = {
  '01': 'Янв', '02': 'Фев', '03': 'Мар', '04': 'Апр',
  '05': 'Май', '06': 'Июн', '07': 'Июл', '08': 'Авг',
  '09': 'Сен', '10': 'Окт', '11': 'Ноя', '12': 'Дек',
  Jan: 'Янв', Feb: 'Фев', Mar: 'Мар', Apr: 'Апр',
  May: 'Май', Jun: 'Июн', Jul: 'Июл', Aug: 'Авг',
  Sep: 'Сен', Oct: 'Окт', Nov: 'Ноя', Dec: 'Дек',
}

function formatMonthLabel(month: string): string {
  return MONTH_LABELS[month] ?? month
}

function shortCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`
  return `$${value}`
}

const AVATAR_COLORS = ['#2B5BF0', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4']
const BAR_COLORS = [
  '#2B5BF0', '#3B6CF5', '#4C7CFA', '#5D8DFF',
  '#22C55E', '#16A34A', '#F59E0B', '#D97706',
  '#EF4444', '#DC2626', '#8B5CF6', '#7C3AED',
]

// KPI card — CHARGEO style
interface KpiCardProps {
  title: string
  value: string
  trend: number
  icon?: React.ReactNode
  accentColor?: string
}

function KpiCardNew({ title, value, trend, icon, accentColor = '#2B5BF0' }: KpiCardProps) {
  const isPositive = trend >= 0
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        {icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${accentColor}18`, color: accentColor }}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <div
        className="flex items-center gap-1.5 text-sm font-semibold"
        style={{ color: isPositive ? '#22C55E' : '#EF4444' }}
      >
        {isPositive ? (
          <ChartIncreaseIcon size={16} style={{ color: '#22C55E' }} />
        ) : (
          <ChartDecreaseIcon size={16} style={{ color: '#EF4444' }} />
        )}
        <span>
          {isPositive ? '+' : ''}
          {Math.abs(trend).toFixed(1)}%
        </span>
        <span className="text-gray-400 font-normal text-xs ml-1">vs прошлый мес.</span>
      </div>
    </div>
  )
}

// Agent avatar
function AgentAvatar({ name, color = '#2B5BF0' }: { name: string; color?: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
      style={{ background: color }}
    >
      {initials}
    </div>
  )
}

// Custom bar tooltip
function CustomBarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-2">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-900">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const { user } = useAuthStore()
  const isSuperAdmin = canAccess(user?.role, 'view_all_managers')

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard')
      return res.data.data
    },
  })

  const { data: revenue } = useQuery<Array<{ month: string; revenue: number }>>({
    queryKey: ['analytics', 'revenue'],
    queryFn: async () => {
      const res = await api.get('/analytics/revenue')
      return res.data.data
    },
  })

  const { data: destinations } = useQuery<Array<{ destination: string; count: number }>>({
    queryKey: ['analytics', 'destinations'],
    queryFn: async () => {
      const res = await api.get('/analytics/top-destinations?limit=10')
      return res.data.data
    },
  })

  const { data: managers } = useQuery<
    Array<{ managerName: string; bookingCount: number; revenue: number; conversionRate: number }>
  >({
    queryKey: ['analytics', 'managers'],
    queryFn: async () => {
      const res = await api.get('/analytics/managers')
      return res.data.data
    },
    enabled: isSuperAdmin,
  })

  const chartData = (revenue ?? []).map((item) => ({
    ...item,
    month: formatMonthLabel(item.month),
  }))

  const maxDestCount = destinations?.[0]?.count ?? 1

  return (
    <div className="space-y-6" style={{ background: '#EEF0F8', minHeight: '100vh' }}>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <ChartLineData01Icon size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Аналитика</h1>
            <p className="text-xs text-gray-500">Статистика и показатели агентства</p>
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : stats ? (
          <>
            <KpiCardNew
              title="Всего продаж"
              value={shortCurrency(stats.revenueCurrentMonth ?? 0)}
              trend={stats.revenueTrend ?? 0}
              icon={<ChartIncreaseIcon size={18} />}
              accentColor="#2B5BF0"
            />
            <KpiCardNew
              title="Всего возвратов"
              value={String(stats.bookingsCurrentMonth ?? 0)}
              trend={stats.bookingsTrend ?? 0}
              icon={<ChartDecreaseIcon size={18} />}
              accentColor="#EF4444"
            />
            <KpiCardNew
              title="Новых лидов"
              value={String(stats.newLeadsCurrentMonth ?? 0)}
              trend={stats.leadsTrend ?? 0}
              icon={<ChartLineData01Icon size={18} />}
              accentColor="#F59E0B"
            />
            <KpiCardNew
              title="Конверсия"
              value={`${(stats.conversionRate ?? 0).toFixed(1)}%`}
              trend={stats.conversionTrend ?? 0}
              icon={<ChartIncreaseIcon size={18} />}
              accentColor="#22C55E"
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        )}
      </div>

      {/* Revenue BarChart — full width */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Выручка по месяцам</h2>
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100">
            <option value="yearly">За год</option>
            <option value="monthly">За месяц</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => shortCurrency(v)}
            />
            <Tooltip content={<CustomBarTooltip />} />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row: destinations + managers */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top destinations table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Топ направления</h2>
            <button className="text-sm text-blue-600 hover:underline font-medium">
              Смотреть всё
            </button>
          </div>
          {!destinations?.length ? (
            <p className="text-gray-400 text-sm text-center py-12">Данных нет</p>
          ) : (
            <div className="p-6 space-y-4">
              {destinations.map((d, i) => (
                <div key={d.destination} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4 text-right font-medium">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-900 truncate">{d.destination}</span>
                      <span className="text-gray-500 ml-2 flex-shrink-0">{d.count} броней</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(d.count / maxDestCount) * 100}%`,
                          background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                  <ArrowRight01Icon size={14} className="text-gray-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manager performance — SUPER_ADMIN only */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Эффективность менеджеров</h2>
            {isSuperAdmin && (
              <button className="text-sm text-blue-600 hover:underline font-medium">
                Смотреть всё
              </button>
            )}
          </div>
          {!isSuperAdmin ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <ChartLineData01Icon size={22} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">Доступ ограничен</p>
              <p className="text-xs text-gray-400 mt-1">Только для администраторов</p>
            </div>
          ) : !managers?.length ? (
            <p className="text-gray-400 text-sm text-center py-12">Данных нет</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Менеджер
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Броней
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Выручка
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Конверсия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {managers.map((m, idx) => (
                    <tr key={m.managerName} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <AgentAvatar
                            name={m.managerName ?? '—'}
                            color={AVATAR_COLORS[idx % AVATAR_COLORS.length]}
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {m.managerName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-sm font-semibold text-gray-900">
                          {m.bookingCount}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(m.revenue)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: (m.conversionRate ?? 0) >= 50 ? '#22C55E' : '#F59E0B' }}
                        >
                          {(m.conversionRate ?? 0).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
