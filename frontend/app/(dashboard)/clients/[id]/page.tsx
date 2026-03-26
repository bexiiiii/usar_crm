'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import PageHeader from '@/components/layout/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import { Skeleton } from '@/components/ui/LoadingSkeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Client, Booking } from '@/types'
import { ArrowLeft01Icon, Edit01Icon, FloppyDiskIcon, Cancel01Icon } from 'hugeicons-react'
import toast from 'react-hot-toast'

const tabs = ['Информация', 'Брони', 'История']

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(0)
  const [editing, setEditing] = useState(false)

  const { data: client, isLoading } = useQuery<Client>({
    queryKey: ['clients', id],
    queryFn: async () => {
      const res = await api.get(`/clients/${id}`)
      return res.data.data
    },
  })

  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ['bookings', 'client', id],
    queryFn: async () => {
      const res = await api.get(`/bookings/by-client/${id}`)
      return res.data.data
    },
    enabled: activeTab === 1,
  })

  const { register, handleSubmit, reset } = useForm<Partial<Client>>()

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Client>) => api.put(`/clients/${id}`, data),
    onSuccess: () => {
      toast.success('Запись успешно сохранена')
      queryClient.invalidateQueries({ queryKey: ['clients', id] })
      setEditing(false)
    },
  })

  const startEdit = () => {
    if (client) reset(client)
    setEditing(true)
  }

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )

  if (!client) return <p className="text-gray-500">Клиент не найден</p>

  return (
    <div>
      <PageHeader
        title={client.fullName}
        actions={
          <div className="flex gap-2">
            <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              <ArrowLeft01Icon size={16} />
              Назад
            </button>
            {!editing ? (
              <button onClick={startEdit} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm hover:bg-blue-700">
                <Edit01Icon size={16} />
                Редактировать
              </button>
            ) : (
              <>
                <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  <Cancel01Icon size={16} />
                  Отмена
                </button>
                <button onClick={handleSubmit((d) => updateMutation.mutate(d))} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm hover:bg-blue-700">
                  <FloppyDiskIcon size={16} />
                  Сохранить
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-900">{client.totalBookings}</p>
          <p className="text-sm text-gray-500 mt-1">Броней</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(client.totalRevenue)}</p>
          <p className="text-sm text-gray-500 mt-1">Выручка</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
          <StatusBadge value={client.status} type="client" className="text-sm px-4 py-1.5" />
          <p className="text-sm text-gray-500 mt-2">Статус</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {activeTab === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {editing ? (
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'firstName', label: 'Имя' },
                { name: 'lastName', label: 'Фамилия' },
                { name: 'phone', label: 'Телефон' },
                { name: 'email', label: 'Email' },
                { name: 'passportNumber', label: 'Паспорт' },
                { name: 'source', label: 'Источник' },
              ].map(({ name, label }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    {...register(name as keyof Client)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Телефон', value: client.phone },
                { label: 'Email', value: client.email || '—' },
                { label: 'Паспорт', value: client.passportNumber || '—' },
                { label: 'Дата рождения', value: formatDate(client.dateOfBirth) },
                { label: 'Источник', value: client.source || '—' },
                { label: 'Менеджер', value: client.assignedManagerName || '—' },
                { label: 'Дата создания', value: formatDate(client.createdAt) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-sm text-gray-900 font-medium">{value}</p>
                </div>
              ))}
              {client.notes && (
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Заметки</p>
                  <p className="text-sm text-gray-900">{client.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bookings tab */}
      {activeTab === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {!bookings?.length ? (
            <p className="text-gray-500 text-center py-12">Броней нет. Оформите первую бронь</p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">№ Брони</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Направление</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Вылет</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Сумма</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b.id} onClick={() => router.push(`/bookings/${b.id}`)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">{b.bookingNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{b.destination}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(b.departureDate)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(b.totalPrice, b.currency)}</td>
                    <td className="px-4 py-3"><StatusBadge value={b.status} type="booking" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Activity tab */}
      {activeTab === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-gray-500 text-sm text-center py-8">История активности недоступна</p>
        </div>
      )}
    </div>
  )
}
