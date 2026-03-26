'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { canAccess } from '@/lib/auth'
import { Client, PaginatedResponse } from '@/types'
import { Search01Icon, UserAdd01Icon, Delete01Icon, Edit01Icon, FilterIcon, Cancel01Icon } from 'hugeicons-react'
import toast from 'react-hot-toast'

const statusOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'NEW', label: 'Новый' },
  { value: 'ACTIVE', label: 'Активный' },
  { value: 'VIP', label: 'VIP' },
  { value: 'INACTIVE', label: 'Неактивный' },
]

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700',
  VIP: 'bg-purple-100 text-purple-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
}

const statusLabels: Record<string, string> = {
  NEW: 'Новый',
  ACTIVE: 'Активный',
  VIP: 'VIP',
  INACTIVE: 'Неактивный',
}

export default function ClientsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const canDelete = canAccess(user?.role, 'delete_record')

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/clients', data),
    onSuccess: () => {
      toast.success('Клиент создан')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setShowCreateModal(false)
      reset()
    },
    onError: () => toast.error('Ошибка при создании клиента'),
  })

  const { data, isLoading } = useQuery<PaginatedResponse<Client>>({
    queryKey: ['clients', search, status, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      params.set('page', String(page))
      params.set('size', '20')
      params.set('sort', 'createdAt,desc')
      const res = await api.get(`/clients?${params}`)
      return res.data.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => {
      toast.success('Клиент удалён')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Вы уверены, что хотите удалить?')) deleteMutation.mutate(id)
  }

  return (
    <div className="bg-[#EEF0F8] min-h-screen p-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Клиенты</h1>
          <p className="text-sm text-gray-500 mt-0.5">Всего: {data?.totalElements ?? 0}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#2B5BF0] text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <UserAdd01Icon size={16} />
          Новый клиент
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="Поиск по имени, телефону..."
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
              <UserAdd01Icon size={32} className="text-blue-400" />
            </div>
            <p className="text-gray-500 text-sm mb-4">Клиентов пока нет. Добавьте первого клиента</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#2B5BF0] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Добавить клиента
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Клиент</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Телефон</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Статус</th>
                    {user?.role === 'SUPER_ADMIN' && (
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Менеджер</th>
                    )}
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Брони</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Выручка</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Дата</th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => router.push(`/clients/${client.id}`)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100 last:border-0"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#2B5BF0]/10 flex items-center justify-center text-[#2B5BF0] font-semibold text-sm flex-shrink-0">
                            {client.firstName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{client.fullName}</p>
                            <p className="text-xs text-gray-400">{client.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{client.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusColors[client.status] || 'bg-gray-100 text-gray-600'}`}>
                          {statusLabels[client.status] || client.status}
                        </span>
                      </td>
                      {user?.role === 'SUPER_ADMIN' && (
                        <td className="px-6 py-4 text-sm text-gray-600">{client.assignedManagerName || '—'}</td>
                      )}
                      <td className="px-6 py-4 text-sm text-gray-700 text-center">{client.totalBookings}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(client.totalRevenue)}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{formatDate(client.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/clients/${client.id}`) }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#2B5BF0] hover:bg-blue-50 transition-colors"
                          >
                            <Edit01Icon size={15} />
                          </button>
                          {canDelete && (
                            <button
                              onClick={(e) => handleDelete(e, client.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Delete01Icon size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Показано {data.content.length} из {data.totalElements}
                </p>
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
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Новый клиент</h2>
              <button onClick={() => { setShowCreateModal(false); reset() }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <Cancel01Icon size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
                  <input
                    {...register('firstName', { required: true })}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.firstName ? 'border-red-400' : 'border-[#E2E8F4]'}`}
                    placeholder="Иван"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия *</label>
                  <input
                    {...register('lastName', { required: true })}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.lastName ? 'border-red-400' : 'border-[#E2E8F4]'}`}
                    placeholder="Иванов"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
                <input
                  {...register('phone', { required: true })}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-400' : 'border-[#E2E8F4]'}`}
                  placeholder="+7 999 123 45 67"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Номер паспорта</label>
                  <input
                    {...register('passportNumber')}
                    className="w-full px-4 py-2.5 border border-[#E2E8F4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="AB1234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата рождения</label>
                  <input
                    {...register('dateOfBirth')}
                    type="date"
                    className="w-full px-4 py-2.5 border border-[#E2E8F4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                  <select {...register('status')} className="w-full px-4 py-2.5 border border-[#E2E8F4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="NEW">Новый</option>
                    <option value="ACTIVE">Активный</option>
                    <option value="VIP">VIP</option>
                    <option value="INACTIVE">Неактивный</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Источник</label>
                  <input
                    {...register('source')}
                    className="w-full px-4 py-2.5 border border-[#E2E8F4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Instagram, сайт..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Примечания</label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-[#E2E8F4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); reset() }}
                  className="px-4 py-2.5 border border-[#E2E8F4] rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2.5 bg-[#2B5BF0] text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Сохранение...' : 'Создать клиента'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
