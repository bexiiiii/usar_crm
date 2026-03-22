'use client'

import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import api from '@/lib/api'
import KpiCard from '@/components/ui/KpiCard'
import { CardSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton'
import PageHeader from '@/components/layout/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatCurrency, formatDate, getDaysUntil } from '@/lib/utils'
import { DashboardStats, Booking, Task } from '@/types'
import { AlertTriangle, DollarSign, BookOpen, TrendingUp, Users } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b']

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

  const { data: upcomingDepartures } = useQuery<Booking[]>({
    queryKey: ['bookings', 'upcoming'],
    queryFn: async () => {
      const res = await api.get('/analytics/upcoming-departures?days=7')
      return res.data.data
    },
  })

  const incomeData = [
    { name: 'Доход', value: 60 },
    { name: 'Убыток', value: 20 },
    { name: 'Прибыль', value: 20 },
  ]

  return (
    <div>
      <PageHeader title="Дашборд" subtitle="Lorem ipsum dolor sit amet consectetur." />

      {/* Alert */}
      {deadlines && deadlines.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-red-800">Срок оплаты поставщику!</p>
            {deadlines.map((b) => (
              <p key={b.id} className="text-red-700 text-sm">
                {b.bookingNumber} — {b.destination} — срок через {getDaysUntil(b.supplierPaymentDeadline)} дн.
              </p>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : stats ? (
          <>
            <KpiCard
              title="Выручка за месяц"
              value={formatCurrency(stats.revenueCurrentMonth)}
              trend={stats.revenueTrend}
              icon={<DollarSign size={22} />}
            />
            <KpiCard
              title="Броней за месяц"
              value={String(stats.bookingsCurrentMonth)}
              trend={stats.bookingsTrend}
              icon={<BookOpen size={22} />}
            />
            <KpiCard
              title="Новых лидов"
              value={String(stats.newLeadsCurrentMonth)}
              trend={stats.leadsTrend}
              icon={<Users size={22} />}
            />
            <KpiCard
              title="Конверсия"
              value={`${stats.conversionRate.toFixed(1)}%`}
              trend={stats.conversionTrend}
              icon={<TrendingUp size={22} />}
            />
          </>
        ) : null}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Обзор продаж</h2>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600">
              <option>Годовой</option>
              <option>Месячный</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Income donut */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Доход</h2>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600">
              <option>Месячный</option>
              <option>Годовой</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={incomeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                {incomeData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {incomeData.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Upcoming Departures */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Вылеты на этой неделе</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingDepartures?.length === 0 && (
              <p className="text-gray-500 text-sm px-6 py-8 text-center">Нет предстоящих вылетов</p>
            )}
            {upcomingDepartures?.slice(0, 5).map((b) => (
              <div key={b.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{b.clientName}</p>
                  <p className="text-xs text-gray-500">{b.destination} · {b.bookingNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatDate(b.departureDate)}</p>
                  <StatusBadge value={b.status} type="booking" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks due */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Задачи на сегодня</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {tasksPage?.content?.length === 0 && (
              <p className="text-gray-500 text-sm px-6 py-8 text-center">Задач нет. Создайте задачу</p>
            )}
            {tasksPage?.content?.slice(0, 5).map((t: Task) => (
              <div key={t.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.title}</p>
                  <p className="text-xs text-gray-500">{t.assignedToName}</p>
                </div>
                <StatusBadge value={t.priority} type="task" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
