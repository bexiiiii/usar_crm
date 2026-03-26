'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
} from 'recharts'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Booking, DashboardStats } from '@/types'
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
}

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

const TYPE_LABELS: Record<string, string> = {
  TOUR: 'Туры',
  HOTEL: 'Отели',
  FLIGHT: 'Авиа',
  TRANSFER: 'Трансфер',
  VISA: 'Визы',
  INSURANCE: 'Страховка',
  CUSTOM: 'Другое',
}

function KpiWidget({
  title,
  value,
  trend,
  color = '#2B5BF0',
}: {
  title: string
  value: string
  trend?: number
  color?: string
}) {
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

function downloadCsv(filename: string, rows: string[][], headers: string[]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines = [headers.map(escape).join(',')]
  for (const row of rows) {
    lines.push(row.map(escape).join(','))
  }
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 11)
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])

  // Dashboard KPIs
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard')
      return res.data.data
    },
  })

  // All bookings for client-side aggregations
  const { data: bookingsRaw } = useQuery<Booking[]>({
    queryKey: ['bookings', 'all-reports'],
    queryFn: async () => {
      const res = await api.get('/bookings?size=200&sort=createdAt,desc')
      return res.data.data?.content ?? []
    },
  })

  const bookings = bookingsRaw ?? []

  // Revenue by month (last 12 months)
  const revenueChartData = useMemo(() => {
    const map: Record<string, number> = {}
    for (const b of bookings) {
      if (!b.createdAt) continue
      const d = new Date(b.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      map[key] = (map[key] ?? 0) + (b.totalPrice ?? 0)
    }
    // Build last 12 months in order
    const result: { month: string; revenue: number }[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      result.push({ month: MONTH_LABELS[mm] ?? mm, revenue: map[key] ?? 0 })
    }
    return result
  }, [bookings])

  // Top destinations
  const destinations = useMemo(() => {
    const map: Record<string, number> = {}
    for (const b of bookings) {
      if (!b.destination) continue
      map[b.destination] = (map[b.destination] ?? 0) + 1
    }
    return Object.entries(map)
      .map(([destination, count]) => ({ destination, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [bookings])

  // Manager performance
  const managers = useMemo(() => {
    const map: Record<string, { bookingCount: number; revenue: number; leads: number }> = {}
    for (const b of bookings) {
      const name = b.assignedManagerName ?? 'Не назначен'
      if (!map[name]) map[name] = { bookingCount: 0, revenue: 0, leads: 0 }
      map[name].bookingCount += 1
      map[name].revenue += b.totalPrice ?? 0
    }
    return Object.entries(map)
      .map(([managerName, v]) => ({
        managerName,
        bookingCount: v.bookingCount,
        revenue: v.revenue,
        conversionRate: v.bookingCount > 0 ? Math.min(100, (v.bookingCount / Math.max(1, v.bookingCount + 1)) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [bookings])

  // Booking type distribution
  const typeDistData = useMemo(() => {
    const map: Record<string, number> = {}
    for (const b of bookings) {
      const t = b.type ?? 'CUSTOM'
      map[t] = (map[t] ?? 0) + 1
    }
    const total = bookings.length || 1
    return Object.entries(map)
      .map(([type, count]) => ({
        name: TYPE_LABELS[type] ?? type,
        value: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [bookings])

  const maxDest = destinations[0]?.count ?? 1

  // Filter bookings by date range for exports
  const filteredBookings = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom).getTime() : 0
    const to = dateTo ? new Date(dateTo).getTime() + 86400000 : Infinity
    return bookings.filter((b) => {
      const t = new Date(b.createdAt).getTime()
      return t >= from && t <= to
    })
  }, [bookings, dateFrom, dateTo])

  function handleExport(reportId: string) {
    if (!bookings.length) {
      toast.error('Нет данных для экспорта')
      return
    }

    const label = REPORT_TYPES.find((r) => r.id === reportId)?.label ?? reportId
    const today = new Date().toISOString().split('T')[0]

    if (reportId === 'managers') {
      const rows = managers.map((m) => [
        m.managerName,
        String(m.bookingCount),
        String(m.revenue),
        `${m.conversionRate.toFixed(0)}%`,
      ])
      downloadCsv(
        `kpi_managers_${today}.csv`,
        rows,
        ['Менеджер', 'Броней', 'Выручка', 'Конверсия'],
      )
    } else if (reportId === 'tours') {
      const rows = destinations.map((d, i) => [String(i + 1), d.destination, String(d.count)])
      downloadCsv(
        `top_destinations_${today}.csv`,
        rows,
        ['#', 'Направление', 'Бронирований'],
      )
    } else {
      // General bookings export
      const rows = filteredBookings.map((b) => [
        b.bookingNumber,
        b.clientName ?? '',
        b.destination ?? '',
        b.type ?? '',
        b.status ?? '',
        b.departureDate ?? '',
        b.returnDate ?? '',
        String(b.totalPrice ?? 0),
        b.currency ?? '',
        b.assignedManagerName ?? '',
        b.createdAt ? b.createdAt.split('T')[0] : '',
      ])
      downloadCsv(
        `${reportId}_${today}.csv`,
        rows,
        ['Номер', 'Клиент', 'Направление', 'Тип', 'Статус', 'Выезд', 'Возврат', 'Сумма', 'Валюта', 'Менеджер', 'Дата создания'],
      )
    }

    toast.success(`Отчёт «${label}» скачан`)
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
            <AreaChart data={revenueChartData}>
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
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2B5BF0"
                strokeWidth={2.5}
                fill="url(#revGrad)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: '#2B5BF0' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Booking type pie */}
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E2E8F4' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: '#1A2332' }}>Типы бронирований</h3>
          </div>
          {!typeDistData.length ? (
            <p className="text-sm text-center py-10" style={{ color: '#9CA3AF' }}>Нет данных</p>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Top destinations */}
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
          {!destinations.length ? (
            <p className="text-sm text-center py-10" style={{ color: '#9CA3AF' }}>Нет данных</p>
          ) : (
            <div className="space-y-3">
              {destinations.map((d, i) => (
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
          {!managers.length ? (
            <p className="text-sm text-center py-10" style={{ color: '#9CA3AF' }}>Нет данных</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#F8F9FE' }}>
                    <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase" style={{ color: '#6B7A9A' }}>Менеджер</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase" style={{ color: '#6B7A9A' }}>Броней</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase" style={{ color: '#6B7A9A' }}>Выручка</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#F1F3F9' }}>
                  {managers.map((m, idx) => (
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
