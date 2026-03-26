'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import PageHeader from '@/components/layout/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import { TableSkeleton } from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Payment } from '@/types'
import { CreditCardAcceptIcon } from 'hugeicons-react'

const directionLabels: Record<string, string> = { INCOMING: 'Входящий', OUTGOING: 'Исходящий' }
const typeLabels: Record<string, string> = {
  DEPOSIT: 'Аванс', FULL_PAYMENT: 'Полная оплата', PARTIAL: 'Частичная', REFUND: 'Возврат',
}
const methodLabels: Record<string, string> = {
  CASH: 'Наличные', CARD: 'Карта', BANK_TRANSFER: 'Банковский перевод', ONLINE: 'Онлайн',
}

export default function PaymentsPage() {
  const router = useRouter()
  const [bookingId, setBookingId] = useState('')

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ['payments', bookingId],
    queryFn: async () => {
      if (!bookingId) return []
      const res = await api.get(`/payments?bookingId=${bookingId}`)
      return res.data.data
    },
    enabled: !!bookingId,
  })

  const totalIncoming = payments?.filter(p => p.direction === 'INCOMING' && p.status === 'COMPLETED')
    .reduce((s, p) => s + p.amount, 0) ?? 0
  const totalOutgoing = payments?.filter(p => p.direction === 'OUTGOING' && p.status === 'COMPLETED')
    .reduce((s, p) => s + p.amount, 0) ?? 0

  return (
    <div>
      <PageHeader title="Платежи" subtitle="Управление платежами по бронированиям" />

      <div className="mb-5">
        <input
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
          placeholder="Введите ID брони для поиска платежей..."
          className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 mt-1.5">Введите ID бронирования для отображения связанных платежей. Вы можете найти ID в разделе Брони.</p>
      </div>

      {!bookingId ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16">
          <EmptyState
            message="Введите ID брони для просмотра платежей"
            icon={<CreditCardAcceptIcon size={48} />}
            action={
              <button onClick={() => router.push('/bookings')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700">
                Перейти к броням
              </button>
            }
          />
        </div>
      ) : isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <>
          {payments && payments.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Получено</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalIncoming)}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Выплачено</p>
                <p className="text-xl font-bold text-red-500">{formatCurrency(totalOutgoing)}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Баланс</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(totalIncoming - totalOutgoing)}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {!payments?.length ? (
              <p className="text-gray-400 text-sm text-center py-12">Платежей по этой брони нет</p>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Дата</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Клиент</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Тип</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Направление</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Метод</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Сумма</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(p.paidAt || p.createdAt)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{p.clientName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{typeLabels[p.type] || p.type}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${p.direction === 'INCOMING' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {directionLabels[p.direction]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{methodLabels[p.method] || p.method}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(p.amount, p.currency)}</td>
                      <td className="px-4 py-3"><StatusBadge value={p.status} type="payment" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
