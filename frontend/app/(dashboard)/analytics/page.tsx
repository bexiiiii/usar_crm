'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts'
import api from '@/lib/api'
import PageHeader from '@/components/layout/PageHeader'
import { CardSkeleton } from '@/components/ui/LoadingSkeleton'
import KpiCard from '@/components/ui/KpiCard'
import { formatCurrency } from '@/lib/utils'
import { DashboardStats } from '@/types'
import { DollarSign, BookOpen, TrendingUp, Users } from 'lucide-react'

export default function AnalyticsPage() {
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

  const { data: managers } = useQuery<Array<{ managerName: string; bookingCount: number; revenue: number; conversionRate: number }>>({
    queryKey: ['analytics', 'managers'],
    queryFn: async () => {
      const res = await api.get('/analytics/managers')
      return res.data.data
    },
  })

  return (
    <div>
      <PageHeader title="Аналитика" subtitle="Статистика и показатели агентства" />

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : stats ? (
          <>
            <KpiCard title="Выручка за месяц" value={formatCurrency(stats.revenueCurrentMonth)} trend={stats.revenueTrend} icon={<DollarSign size={22} />} />
            <KpiCard title="Броней за месяц" value={String(stats.bookingsCurrentMonth)} trend={stats.bookingsTrend} icon={<BookOpen size={22} />} />
            <KpiCard title="Новых лидов" value={String(stats.newLeadsCurrentMonth)} trend={stats.leadsTrend} icon={<Users size={22} />} />
            <KpiCard title="Конверсия" value={`${stats.conversionRate.toFixed(1)}%`} trend={stats.conversionTrend} icon={<TrendingUp size={22} />} />
          </>
        ) : null}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Выручка по месяцам</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={revenue || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Top destinations */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Топ направления</h2>
          {!destinations?.length ? (
            <p className="text-gray-400 text-sm text-center py-8">Данных нет</p>
          ) : (
            <div className="space-y-3">
              {destinations.map((d, i) => (
                <div key={d.destination} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900 truncate">{d.destination}</span>
                      <span className="text-gray-500 ml-2">{d.count} броней</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(d.count / (destinations[0]?.count || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Managers performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Эффективность менеджеров</h2>
          {!managers?.length ? (
            <p className="text-gray-400 text-sm text-center py-8">Данных нет</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-3 text-xs font-semibold text-gray-500 uppercase">Менеджер</th>
                    <th className="text-right pb-3 text-xs font-semibold text-gray-500 uppercase">Броней</th>
                    <th className="text-right pb-3 text-xs font-semibold text-gray-500 uppercase">Выручка</th>
                    <th className="text-right pb-3 text-xs font-semibold text-gray-500 uppercase">Конверсия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {managers.map((m) => (
                    <tr key={m.managerName}>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {m.managerName?.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{m.managerName}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-sm text-gray-700">{m.bookingCount}</td>
                      <td className="py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(m.revenue)}</td>
                      <td className="py-3 text-right text-sm text-green-600 font-medium">{m.conversionRate?.toFixed(1)}%</td>
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
