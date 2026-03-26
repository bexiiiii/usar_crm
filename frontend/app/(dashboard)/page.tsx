'use client'

import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
} from 'recharts'
import api from '@/lib/api'
import { CardSkeleton } from '@/components/ui/LoadingSkeleton'
import { formatCurrency } from '@/lib/utils'
import { DashboardStats, Booking, Task } from '@/types'
import {
  ArrowRight01Icon,
  ChartIncreaseIcon,
  ChartDecreaseIcon,
} from 'hugeicons-react'

// Month labels for the x-axis
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

// KPI card with CHARGEO style
interface KpiCardProps {
  title: string
  value: string
  trend: number
  subtitle?: string
  accentColor?: string
}

function KpiCardNew({ title, value, trend, accentColor = '#2B5BF0' }: KpiCardProps) {
  const isPositive = trend >= 0
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
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
      <div
        className="h-1 rounded-full mt-1"
        style={{ background: accentColor, width: '40%', opacity: 0.3 }}
      />
    </div>
  )
}

// Avatar placeholder
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

const AVATAR_COLORS = ['#2B5BF0', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4']

// Static agent performance rows (demo — replace with real API when available)
const AGENT_ROWS = [
  { name: 'Алексей Смирнов', sales: 48, returns: 3, chargeback: 1, notifications: 2 },
  { name: 'Мария Иванова', sales: 35, returns: 1, chargeback: 0, notifications: 5 },
  { name: 'Дмитрий Козлов', sales: 29, returns: 2, chargeback: 2, notifications: 1 },
  { name: 'Елена Попова', sales: 22, returns: 0, chargeback: 0, notifications: 3 },
  { name: 'Сергей Новиков', sales: 18, returns: 1, chargeback: 1, notifications: 0 },
]

const BEST_PERFORMERS = [
  { name: 'Алексей Смирнов', role: 'Старший агент' },
  { name: 'Мария Иванова', role: 'Агент' },
  { name: 'Дмитрий Козлов', role: 'Агент' },
  { name: 'Елена Попова', role: 'Агент' },
]

// Custom tooltip for AreaChart
function CustomAreaTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-2">
      <p className="text-xs text-gray-500 mb-1">{formatMonthLabel(label ?? '')}</p>
      <p className="text-sm font-bold text-gray-900">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard')
      return res.data.data
    },
  })

  const { data: revenueData } = useQuery<Array<{ month: string; revenue: number }>>({
    queryKey: ['analytics', 'revenue'],
    queryFn: async () => {
      const res = await api.get('/analytics/revenue')
      return res.data.data
    },
  })

  const { data: deadlines } = useQuery<Booking[]>({
    queryKey: ['bookings', 'deadlines'],
    queryFn: async () => {
      const res = await api.get('/bookings/upcoming-deadlines')
      return res.data.data
    },
  })

  const { data: tasksPage } = useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: async () => {
      const res = await api.get('/tasks?status=TODO&size=5&sort=dueDate,asc')
      return res.data.data
    },
  })

  // Chart data
  const chartData = (revenueData ?? []).map((item) => ({
    ...item,
    month: formatMonthLabel(item.month),
  }))

  // Income donut data for RadialBarChart
  const incomeRadialData = [
    { name: 'Прибыль', value: 75, fill: '#2B5BF0' },
    { name: 'Убыток', value: 45, fill: '#EF4444' },
    { name: 'Доход', value: 90, fill: '#22C55E' },
  ]

  return (
    <div className="space-y-6" style={{ background: '#EEF0F8', minHeight: '100vh' }}>
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : stats ? (
          <>
            <KpiCardNew
              title="Всего продаж"
              value={shortCurrency(stats.revenueCurrentMonth ?? 0)}
              trend={stats.revenueTrend ?? 0}
              accentColor="#2B5BF0"
            />
            <KpiCardNew
              title="Всего возвратов"
              value={String(stats.bookingsCurrentMonth ?? 0)}
              trend={stats.bookingsTrend ?? 0}
              accentColor="#EF4444"
            />
            <KpiCardNew
              title="Chargeback"
              value={String(stats.newLeadsCurrentMonth ?? 0)}
              trend={stats.leadsTrend ?? 0}
              accentColor="#F59E0B"
            />
            <KpiCardNew
              title="Чистая прибыль"
              value={`${(stats.conversionRate ?? 0).toFixed(1)}%`}
              trend={stats.conversionTrend ?? 0}
              accentColor="#22C55E"
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        )}
      </div>

      {/* Charts row: Sales Overview (3 cols) + Income donut (2 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Sales Overview — 3 cols */}
        <div className="xl:col-span-3 bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900">Обзор продаж</h2>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100">
              <option value="yearly">Yearly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2B5BF0" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#2B5BF0" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Tooltip content={<CustomAreaTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2B5BF0"
                strokeWidth={2.5}
                fill="url(#salesGradient)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: '#2B5BF0' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Income donut — 2 cols */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Доход</h2>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100">
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={90}
                barSize={14}
                data={incomeRadialData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  background={{ fill: '#F3F4F6' }}
                  dataKey="value"
                  cornerRadius={7}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex items-center justify-center gap-5 mt-2">
              {incomeRadialData
                .slice()
                .reverse()
                .map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ background: item.fill }}
                    />
                    <span className="text-xs text-gray-600">{item.name}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Agent table (3 cols) + Best performers (2 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Agent monthly performance table — 3 cols */}
        <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Эффективность агентов</h2>
            <button className="text-sm text-blue-600 hover:underline font-medium">
              Смотреть всё
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Агент
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Продажи
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Возврат
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Chargeback
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Уведомления
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {AGENT_ROWS.map((agent, idx) => (
                  <tr key={agent.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <AgentAvatar name={agent.name} color={AVATAR_COLORS[idx % AVATAR_COLORS.length]} />
                        <span className="text-sm font-medium text-gray-900">{agent.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm font-semibold text-gray-900">
                      {agent.sales}
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm text-gray-600">
                      {agent.returns}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className="text-sm font-medium"
                        style={{ color: agent.chargeback > 0 ? '#EF4444' : '#9CA3AF' }}
                      >
                        {agent.chargeback}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {agent.notifications > 0 ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                          {agent.notifications}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        <ArrowRight01Icon size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best performers panel — 2 cols */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Лучшие агенты</h2>
            <p className="text-xs text-gray-400 mt-0.5">за этот месяц</p>
          </div>
          <div className="divide-y divide-gray-50">
            {BEST_PERFORMERS.map((agent, idx) => (
              <div
                key={agent.name}
                className="px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <AgentAvatar name={agent.name} color={AVATAR_COLORS[idx % AVATAR_COLORS.length]} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{agent.name}</p>
                  <p className="text-xs text-gray-400">{agent.role}</p>
                </div>
                <ArrowRight01Icon size={16} className="text-gray-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
