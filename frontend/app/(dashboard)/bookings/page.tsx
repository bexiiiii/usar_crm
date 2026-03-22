'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import PageHeader from '@/components/layout/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import { TableSkeleton } from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import { formatCurrency, formatDate, getDaysUntil } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { canAccess } from '@/lib/auth'
import { Booking, PaginatedResponse } from '@/types'
import { Plus, BookOpen, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const statusOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'PENDING', label: 'Ожидает' },
  { value: 'CONFIRMED', label: 'Подтверждено' },
  { value: 'PAID', label: 'Оплачено' },
  { value: 'IN_PROGRESS', label: 'В процессе' },
  { value: 'COMPLETED', label: 'Завершено' },
  { value: 'CANCELLED', label: 'Отменено' },
]

const typeLabels: Record<string, string> = {
  TOUR: 'Тур', HOTEL: 'Отель', FLIGHT: 'Авиа', TRANSFER: 'Трансфер',
  VISA: 'Виза', INSURANCE: 'Страховка', CUSTOM: 'Другое',
}

export default function BookingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const canDelete = canAccess(user?.role, 'delete_record')
  const canViewCost = canAccess(user?.role, 'view_cost_price')

  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery<PaginatedResponse<Booking>>({
    queryKey: ['bookings', status, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      params.set('page', String(page))
      params.set('size', '20')
      params.set('sort', 'createdAt,desc')
      const res = await api.get(`/bookings?${params}`)
      return res.data.data
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/bookings/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Статус обновлён')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/bookings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Бронь удалена')
    },
  })

  const isDeadlineWarning = (b: Booking) => {
    const days = getDaysUntil(b.supplierPaymentDeadline)
    return days !== null && days <= 3 && !b.supplierPaid && b.status !== 'CANCELLED'
  }

  return (
    <div>
      <PageHeader
        title="Брони"
        subtitle={`Всего: ${data?.totalElements ?? 0}`}
        actions={
          <button
            onClick={() => router.push('/bookings/new')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Новая бронь
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(0) }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : !data?.content?.length ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16">
          <EmptyState
            message="Броней нет. Оформите первую бронь"
            icon={<BookOpen size={48} />}
            action={
              <button onClick={() => router.push('/bookings/new')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700">
                Новая бронь
              </button>
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">№</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Клиент</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Направление</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Тип</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Вылет</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Сумма</th>
                  {canViewCost && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Маржа</th>}
                  {user?.role === 'SUPER_ADMIN' && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Менеджер</th>}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Статус</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.content.map((booking) => (
                  <tr
                    key={booking.id}
                    onClick={() => router.push(`/bookings/${booking.id}`)}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${isDeadlineWarning(booking) ? 'bg-red-50 hover:bg-red-100' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isDeadlineWarning(booking) && <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />}
                        <span className="text-sm font-medium text-blue-600">{booking.bookingNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{booking.clientName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{booking.destination}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{typeLabels[booking.type] || booking.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(booking.departureDate)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(booking.totalPrice, booking.currency)}</td>
                    {canViewCost && (
                      <td className="px-4 py-3 text-sm font-medium text-green-600">
                        {booking.margin != null ? `+${formatCurrency(booking.margin)}` : '—'}
                      </td>
                    )}
                    {user?.role === 'SUPER_ADMIN' && (
                      <td className="px-4 py-3 text-sm text-gray-600">{booking.assignedManagerName || '—'}</td>
                    )}
                    <td className="px-4 py-3">
                      <select
                        value={booking.status}
                        onChange={(e) => { e.stopPropagation(); statusMutation.mutate({ id: booking.id, status: e.target.value }) }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {statusOptions.filter(o => o.value).map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Вы уверены, что хотите удалить?')) deleteMutation.mutate(booking.id)
                          }}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1 border border-red-200 rounded-lg"
                        >
                          Удалить
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">Показано {data.content.length} из {data.totalElements}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50">←</button>
                <span className="px-3 py-1.5 text-sm text-gray-700">{page + 1} / {data.totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))} disabled={page >= data.totalPages - 1} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50">→</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
