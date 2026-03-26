'use client'

import { useState } from 'react'
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
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from 'recharts'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  ChartLineData01Icon,
  Download01Icon,
  Calendar01Icon,
  ArrowRight01Icon,
  ChartIncreaseIcon,
  ChartDecreaseIcon,
} from 'hugeicons-react'

const MONTH_LABELS: Record<string, string> = {
  '01': 'Янв', '02': 'Фев', '03': 'Мар', '04': 'Апр',
  '05': 'Май', '06': 'Июн', '07': 'Июл', '08': 'Авг',
  '09': 'Сен', '10': 'Окт', '11': 'Ноя', '12': 'Дек',
  Jan: 'Янв', Feb: 'Фев', Mar: 'Мар', Apr: 'Апр',
  May: 'Май', Jun: 'Июн', Jul: 'Июл', Aug: 'Авг',
  Sep: 'Сен', Oct: 'Окт', Nov: 'Ноя', Dec: 'Дек',
}

function fml(m: string) { return MONTH_LABELS[m] ?? m }

function shortCurrency(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`
  return `$${v}`
}

const BAR_COLORS = ['#2B5BF0', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6']
const PIE_COLORS = ['#2B5BF0', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

const REPORT_TYPES = [
  { id: 'sales', label: 'Отчёт по продажам', icon: '💰', description: 'Выручка, средний чек, динамика' },
  { id: 'bookings', label: 'Отчёт по бронированиям', icon: '✈️', description: 'Статусы, типы, направления' },
  { id: 'managers', label: 'KPI менеджеров', icon: '👥', description: 'Эффективность, конверсия, выручка' },
  { id: 'clients', label: 'Клиентская аналитика', icon: '🎯', description: 'Источники, LTV, RFM-анализ' },
  { id: 'finance', label: 'Финансовый отчёт', icon: '📊', description: 'P&L, маржа, оборот' },
  { id: 'tours', label: 'Популярные туры', icon: '🌍', description: 'Топ направлений и туроператоров' },
]

function KpiWidget({ title, value, trend, color = '#2B5BF0' }: { title: string; value: string; trend?: number; color?: string }) {
  const isPos = (trend ?? 0) >= 0
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={{ border: '1px solid #E2E8F4' }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: '#6B7A9A' }}>{title}</p>
        <ArrowRight01Icon size={16} style={{ color: '#6B7A9A' }} />
      </div>
      <p className="text-2xl font-bold" style={{ color: '#1A2332' }}>{value}</p>
      {trend !== undefined && (
        <div className="flex items-center gap-1.5" style={{ color: isPos ? '#22C55E' : '#EF4444' }}>
          {isPos ? <ChartIncreaseIcon size={14} /> : <ChartDecreaseIcon size={14} />}
          <span className="text-xs font-semibold">{isPos ? '+' : ''}{Math.abs(trend).toFixed(1)}%</span>
          <span className="text-xs font-normal" style={{ color: '#6B7A9A' }}>vs прошлый мес.</span>
        </div>
      )}
      <div className="h-1 rounded-full" style={{ background: color, width: '35%', opacity: 0.35 }} />
    </div>
  )
}

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 11); d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])

  const { data: stats } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard')
      return res.data.data
    },
  })

  const { data: revenue } = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: async () => {
      const res = await api.get('/analytics/revenue')
      return res.data.data ?? []
    },
  })

  const { data: destinations } = useQuery({
    queryKey: ['analytics', 'destinations'],
    queryFn: async () => {
      const res = await api.get('/analytics/top-destinations?limit=8')
      return res.data.data ?? []
    },
  })

  const { data: managers } = useQuery({
    queryKey: ['analytics', 'managers'],
    queryFn: async () => {
      const res = await api.get('/analytics/managers')
      return res.data.data ?? []
    },
  })

  const chartData = (revenue ?? []).map((item: { month: string; revenue: number }) => ({
    ...item,
    month: fml(item.month),
  }))

  const maxDest = destinations?.[0]?.count ?? 1

  // Booking type distribution (simulated from managers for now)
  const typeDistData = [
    { name: 'Туры', value: 52 },
    { name: 'Отели', value: 18 },
    { name: 'Авиа', value: 15 },
    { name: 'Визы', value: 8 },
    { name: 'Другое', value: 7 },
  ]

  function handleExport(reportId: string) {
    toast.success(`Отчёт "${REPORT_TYPES.find((r) => r.id === reportId)?.label}" формируется... Функция скачивания будет доступна после настройки PDF-сервиса.`)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#2B5BF0' }}>
            <ChartLineData01Icon size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1A2332' }}>Отчёты</h1>
            <p className="text-xs" style={{ color: '#6B7A9A' }}>Аналитика и экспорт данных</p>
          </div>
        </div>
        {/* Date range */}
        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5" style={{ border: '1px solid #E2E8F4' }}>
          <Calendar01Icon size={16} style={{ color: '#6B7A9A' }} />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="text-sm bg-transparent outline-none"
            style={{ color: '#1A2332' }}
          />
          <span style={{ color: '#CBD5E1' }}>—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="text-sm bg-transparent outline-none"
            style={{ color: '#1A2332' }}
          />
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiWidget
          title="Выручка за месяц"
          value={shortCurrency(stats?.revenueCurrentMonth ?? 0)}
          trend={stats?.revenueTrend ?? 0}
          color="#2B5BF0"
        />
        <KpiWidget
          title="Бронирований"
          value={String(stats?.bookingsCurrentMonth ?? 0)}
          trend={stats?.bookingsTrend ?? 0}
          color="#22C55E"
        />
        <KpiWidget
          title="Новых лидов"
          value={String(stats?.newLeadsCurrentMonth ?? 0)}
          trend={stats?.leadsTrend ?? 0}
          color="#F59E0B"
        />
        <KpiWidget
          title="Конверсия"
          value={`${(stats?.conversionRate ?? 0).toFixed(1)}%`}
          trend={stats?.conversionTrend ?? 0}
          color="#8B5CF6"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Revenue trend */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-6" style={{ border: '1px solid #E2E8F4' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: '#1A2332' }}>Динамика выручки</h3>
            <button
              onClick={() => handleExport('sales')}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border"
              style={{ borderColor: '#E2E8F4', color: '#6B7A9A' }}
            >
              <Download01Icon size={13} />
              Excel
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2B5BF0" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2B5BF0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={shortCurrency} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), 'Выручка']} />
              <Area type="monotone" dataKey="revenue" stroke="#2B5BF0" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: '#2B5BF0' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Booking type pie */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E2E8F4' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: '#1A2332' }}>Типы бронирований</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={typeDistData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {typeDistData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {typeDistData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-xs" style={{ color: '#6B7A9A' }}>{item.name} {item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Top destinations bar */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E2E8F4' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: '#1A2332' }}>Топ направлений</h3>
            <button
              onClick={() => handleExport('tours')}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border"
              style={{ borderColor: '#E2E8F4', color: '#6B7A9A' }}
            >
              <Download01Icon size={13} />
              Excel
            </button>
          </div>
          {!destinations?.length ? (
            <p className="text-sm text-center py-10" style={{ color: '#9CA3AF' }}>Нет данных</p>
          ) : (
            <div className="space-y-3">
              {destinations.map((d: { destination: string; count: number }, i: number) => (
                <div key={d.destination} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-5 text-right flex-shrink-0" style={{ color: '#6B7A9A' }}>{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium" style={{ color: '#1A2332' }}>{d.destination}</span>
                      <span style={{ color: '#6B7A9A' }}>{d.count}</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: '#F1F3F9' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(d.count / maxDest) * 100}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manager performance */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F4' }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F4' }}>
            <h3 className="text-base font-semibold" style={{ color: '#1A2332' }}>KPI менеджеров</h3>
            <button
              onClick={() => handleExport('managers')}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border"
              style={{ borderColor: '#E2E8F4', color: '#6B7A9A' }}
            >
              <Download01Icon size={13} />
              Excel
            </button>
          </div>
          {!managers?.length ? (
            <p className="text-sm text-center py-10" style={{ color: '#9CA3AF' }}>Нет данных</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#F8F9FE' }}>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase" style={{ color: '#6B7A9A' }}>Менеджер</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase" style={{ color: '#6B7A9A' }}>Броней</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase" style={{ color: '#6B7A9A' }}>Выручка</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase" style={{ color: '#6B7A9A' }}>Конв.</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#F1F3F9' }}>
                  {managers.map((m: { managerName: string; bookingCount: number; revenue: number; conversionRate: number }, idx: number) => (
                    <tr key={m.managerName} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm font-medium" style={{ color: '#1A2332' }}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: BAR_COLORS[idx % BAR_COLORS.length] }}
                          >
                            {m.managerName?.charAt(0)?.toUpperCase()}
                          </div>
                          {m.managerName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold" style={{ color: '#1A2332' }}>{m.bookingCount}</td>
                      <td className="px-4 py-3 text-right text-sm" style={{ color: '#1A2332' }}>{shortCurrency(m.revenue)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: m.conversionRate >= 50 ? '#22C55E' : '#F59E0B' }}>
                        {(m.conversionRate ?? 0).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Report templates */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E2E8F4' }}>
        <h3 className="text-base font-bold mb-4" style={{ color: '#1A2332' }}>Готовые отчёты</h3>
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
          {REPORT_TYPES.map((r) => (
            <button
              key={r.id}
              onClick={() => handleExport(r.id)}
              className="p-4 rounded-xl text-left border hover:shadow-md transition-shadow flex items-start gap-3"
              style={{ borderColor: '#E2E8F4' }}
            >
              <span className="text-2xl flex-shrink-0">{r.icon}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#1A2332' }}>{r.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7A9A' }}>{r.description}</p>
              </div>
              <Download01Icon size={16} className="ml-auto flex-shrink-0" style={{ color: '#6B7A9A' }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
