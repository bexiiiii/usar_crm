'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { formatCurrency, formatDate, getDaysUntil } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { canAccess } from '@/lib/auth'
import { Booking, PaginatedResponse } from '@/types'
import { Ticket01Icon, Calendar01Icon, Search01Icon, FilterIcon, Alert01Icon } from 'hugeicons-react'
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

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждено',
  PAID: 'Оплачено',
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено',
}

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
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery<PaginatedResponse<Booking>>({
    queryKey: ['bookings', status, search, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (search) params.set('search', search)
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
    <div className="bg-[#EEF0F8] min-h-screen p-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Бронирования</h1>
          <p className="text-sm text-gray-500 mt-0.5">Всего: {data?.totalElements ?? 0}</p>
        </div>
        <button
          onClick={() => router.push('/bookings/new')}
          className="flex items-center gap-2 bg-[#2B5BF0] text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Ticket01Icon size={16} />
          Новая бронь
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="Поиск по направлению, клиенту..."
            className="pl-9 pr-4 py-2.5 border border-[#E2E8F4] rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <FilterIcon size={16} className="text-gray-400" />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0) }}
            className="border border-[#E2E8F4] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar01Icon size={16} className="text-gray-400" />
          <input
            type="date"
            className="border border-[#E2E8F4] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="date"
            className="border border-[#E2E8F4] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !data?.content?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <Ticket01Icon size={32} className="text-blue-400" />
            </div>
            <p className="text-gray-500 text-sm mb-4">Броней нет. Оформите первую бронь</p>
            <button
              onClick={() => router.push('/bookings/new')}
              className="bg-[#2B5BF0] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Новая бронь
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Номер</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Клиент</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Направление</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Выезд</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Возврат</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Туристы</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Статус</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Сумма</th>
                    {canViewCost && <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Маржа</th>}
                    {user?.role === 'SUPER_ADMIN' && <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Менеджер</th>}
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((booking) => (
                    <tr
                      key={booking.id}
                      onClick={() => router.push(`/bookings/${booking.id}`)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100 last:border-0 ${isDeadlineWarning(booking) ? 'bg-yellow-50 hover:bg-yellow-100' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isDeadlineWarning(booking) && (
                            <Alert01Icon size={14} className="text-amber-500 flex-shrink-0" />
                          )}
                          <span className="text-sm font-semibold text-[#2B5BF0]">{booking.bookingNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{booking.clientName}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-800">{booking.destination}</p>
                          <p className="text-xs text-gray-400">{typeLabels[booking.type] || booking.type}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatDate(booking.departureDate)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{booking.returnDate ? formatDate(booking.returnDate) : '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-center">{booking.paxAdults + booking.paxChildren}</td>
                      <td className="px-6 py-4">
                        <select
                          value={booking.status}
                          onChange={(e) => { e.stopPropagation(); statusMutation.mutate({ id: booking.id, status: e.target.value }) }}
                          onClick={(e) => e.stopPropagation()}
                          className={`text-xs font-medium rounded-full px-3 py-1 border-0 outline-none cursor-pointer ${statusColors[booking.status] || 'bg-gray-100 text-gray-600'}`}
                        >
                          {statusOptions.filter(o => o.value).map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(booking.totalPrice, booking.currency)}</td>
                      {canViewCost && (
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">
                          {booking.margin != null ? `+${formatCurrency(booking.margin)}` : '—'}
                        </td>
                      )}
                      {user?.role === 'SUPER_ADMIN' && (
                        <td className="px-6 py-4 text-sm text-gray-500">{booking.assignedManagerName || '—'}</td>
                      )}
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        {canDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('Вы уверены, что хотите удалить?')) deleteMutation.mutate(booking.id)
                            }}
                            className="text-xs text-red-500 hover:text-red-700 px-2 py-1 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
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
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">Показано {data.content.length} из {data.totalElements}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 text-sm border border-[#E2E8F4] rounded-xl disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    ←
                  </button>
                  <span className="px-3 py-1.5 text-sm text-gray-700 font-medium">{page + 1} / {data.totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                    disabled={page >= data.totalPages - 1}
                    className="px-3 py-1.5 text-sm border border-[#E2E8F4] rounded-xl disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
