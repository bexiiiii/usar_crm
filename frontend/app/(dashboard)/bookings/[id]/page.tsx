'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import PageHeader from '@/components/layout/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import { Skeleton } from '@/components/ui/LoadingSkeleton'
import { formatCurrency, formatDate, getDaysUntil } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { canAccess } from '@/lib/auth'
import { Booking, Payment } from '@/types'
import { ArrowLeft, AlertTriangle, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const typeLabels: Record<string, string> = {
  TOUR: 'Тур', HOTEL: 'Отель', FLIGHT: 'Авиа', TRANSFER: 'Трансфер',
  VISA: 'Виза', INSURANCE: 'Страховка', CUSTOM: 'Другое',
}

const mealLabels: Record<string, string> = {
  BB: 'Завтрак', HB: 'Полупансион', FB: 'Полный пансион', AI: 'Всё включено',
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const canViewCost = canAccess(user?.role, 'view_cost_price')
  const canCancel = canAccess(user?.role, 'cancel_booking')
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  const { data: booking, isLoading } = useQuery<Booking>({
    queryKey: ['booking', id],
    queryFn: async () => {
      const res = await api.get(`/bookings/${id}`)
      return res.data.data
    },
  })

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ['payments', id],
    queryFn: async () => {
      const res = await api.get(`/payments?bookingId=${id}`)
      return res.data.data
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/bookings/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] })
      toast.success('Статус обновлён')
    },
  })

  const { register, handleSubmit, reset } = useForm()

  const paymentMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/payments', { ...data, bookingId: id, clientId: booking?.clientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', id] })
      toast.success('Платёж добавлен')
      setShowPaymentForm(false)
      reset()
    },
  })

  const totalPaid = payments?.filter(p => p.direction === 'INCOMING' && p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0) ?? 0
  const remaining = (booking?.totalPrice ?? 0) - totalPaid

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  )

  if (!booking) return <p className="text-red-500">Бронь не найдена</p>

  const deadlineDays = getDaysUntil(booking.supplierPaymentDeadline)
  const isDeadlineWarning = deadlineDays !== null && deadlineDays <= 3 && !booking.supplierPaid

  return (
    <div>
      <PageHeader
        title={booking.bookingNumber}
        subtitle={`${typeLabels[booking.type]} · ${booking.destination}`}
        actions={
          <div className="flex gap-2">
            <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              <ArrowLeft size={16} />
              Назад
            </button>
            <select
              value={booking.status}
              onChange={(e) => statusMutation.mutate(e.target.value)}
              disabled={!canCancel && booking.status !== 'CANCELLED'}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {['PENDING','CONFIRMED','PAID','IN_PROGRESS','COMPLETED','CANCELLED'].map((s) => (
                <option key={s} value={s}>{
                  {PENDING:'Ожидает',CONFIRMED:'Подтверждено',PAID:'Оплачено',
                   IN_PROGRESS:'В процессе',COMPLETED:'Завершено',CANCELLED:'Отменено'}[s]
                }</option>
              ))}
            </select>
          </div>
        }
      />

      {/* Deadline alert */}
      {isDeadlineWarning && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
          <p className="text-red-700 text-sm font-medium">
            Срок оплаты поставщику истекает через {deadlineDays} дн. ({formatDate(booking.supplierPaymentDeadline)})!
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="xl:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Информация о брони</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Клиент', value: booking.clientName },
                { label: 'Менеджер', value: booking.assignedManagerName || '—' },
                { label: 'Направление', value: booking.destination },
                { label: 'Страна', value: booking.country || '—' },
                { label: 'Город вылета', value: booking.departureCity || '—' },
                { label: 'Дата вылета', value: formatDate(booking.departureDate) },
                { label: 'Дата возврата', value: formatDate(booking.returnDate) },
                { label: 'Пассажиры', value: `${booking.paxAdults} взр. + ${booking.paxChildren} дет.` },
                { label: 'Отель', value: booking.hotelName ? `${booking.hotelName} ${booking.hotelStars ? '★'.repeat(booking.hotelStars) : ''}` : '—' },
                { label: 'Питание', value: booking.mealPlan ? (mealLabels[booking.mealPlan] || booking.mealPlan) : '—' },
                { label: 'Тур-оператор', value: booking.tourOperator || '—' },
                { label: 'Бронь поставщика', value: booking.supplierRef || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 uppercase font-medium tracking-wider mb-0.5">{label}</p>
                  <p className="text-sm text-gray-900">{value}</p>
                </div>
              ))}
            </div>
            {booking.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-medium tracking-wider mb-1">Заметки</p>
                <p className="text-sm text-gray-700">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Payments */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Платежи</h2>
              <button
                onClick={() => setShowPaymentForm(true)}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus size={14} />
                Добавить
              </button>
            </div>

            {/* Payment timeline */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1.5">
                <span>Оплачено: <strong className="text-green-600">{formatCurrency(totalPaid, booking.currency)}</strong></span>
                <span>Остаток: <strong className="text-red-500">{formatCurrency(remaining, booking.currency)}</strong></span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (totalPaid / booking.totalPrice) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0</span>
                <span>Итого: {formatCurrency(booking.totalPrice, booking.currency)}</span>
              </div>
            </div>

            {!payments?.length ? (
              <p className="text-gray-400 text-sm text-center py-4">Платежей нет</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {p.direction === 'INCOMING' ? '↓ ' : '↑ '}
                        {formatCurrency(p.amount, p.currency)}
                      </p>
                      <p className="text-xs text-gray-500">{p.type} · {p.method} · {formatDate(p.paidAt || p.createdAt)}</p>
                    </div>
                    <StatusBadge value={p.status} type="payment" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Финансы</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Стоимость</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(booking.totalPrice, booking.currency)}</span>
              </div>
              {canViewCost && booking.costPrice != null && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Себестоимость</span>
                    <span className="text-sm text-gray-700">{formatCurrency(booking.costPrice, booking.currency)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-2">
                    <span className="text-sm text-gray-500">Маржа</span>
                    <span className="text-sm font-semibold text-green-600">+{formatCurrency(booking.margin ?? 0, booking.currency)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Оплата поставщику</h3>
            <p className="text-sm text-gray-600 mb-2">Срок: <strong>{formatDate(booking.supplierPaymentDeadline)}</strong></p>
            <p className="text-sm">
              Статус:{' '}
              <span className={booking.supplierPaid ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                {booking.supplierPaid ? 'Оплачено' : 'Не оплачено'}
              </span>
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Статус</h3>
            <StatusBadge value={booking.status} type="booking" className="text-sm" />
            <p className="text-xs text-gray-400 mt-3">Создано: {formatDate(booking.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Add payment modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Добавить платёж</h2>
            <form onSubmit={handleSubmit((d) => paymentMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Сумма</label>
                  <input {...register('amount', { required: true })} type="number" step="0.01" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Валюта</label>
                  <select {...register('currency')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="RUB">RUB</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
                  <select {...register('type', { required: true })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="DEPOSIT">Аванс</option>
                    <option value="FULL_PAYMENT">Полная оплата</option>
                    <option value="PARTIAL">Частичная</option>
                    <option value="REFUND">Возврат</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Способ</label>
                  <select {...register('method')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="CASH">Наличные</option>
                    <option value="CARD">Карта</option>
                    <option value="BANK_TRANSFER">Банковский перевод</option>
                    <option value="ONLINE">Онлайн</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Направление</label>
                <select {...register('direction', { required: true })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="INCOMING">Входящий (от клиента)</option>
                  <option value="OUTGOING">Исходящий (поставщику)</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowPaymentForm(false); reset() }} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Отмена</button>
                <button type="submit" disabled={paymentMutation.isPending} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {paymentMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
