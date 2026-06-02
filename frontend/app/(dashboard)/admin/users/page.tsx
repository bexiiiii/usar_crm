'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import * as XLSX from 'xlsx'
import api from '@/lib/api'
import PageHeader from '@/components/layout/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import { TableSkeleton } from '@/components/ui/LoadingSkeleton'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { User, PaginatedResponse } from '@/types'
import { Add01Icon, ArrowDown01Icon, UserRemove01Icon } from 'hugeicons-react'
import toast from 'react-hot-toast'

const ROLE_LABELS: Record<User['role'], string> = {
  MANAGER: 'Менеджер',
  SUPER_ADMIN: 'Супер-админ',
}

export default function UsersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [showModal, setShowModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') router.push('/403')
  }, [user, router])

  const { data, isLoading } = useQuery<PaginatedResponse<User>>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users?size=50')
      return res.data.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Сотрудник создан')
      setShowModal(false)
      reset()
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Пользователь деактивирован')
    },
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Роль обновлена')
    },
  })

  const { register, handleSubmit, reset } = useForm()

  async function handleExport() {
    try {
      setIsExporting(true)

      const size = 200
      let page = 0
      let totalPages = 1
      const users: User[] = []

      do {
        const res = await api.get(`/users?page=${page}&size=${size}&sort=createdAt,desc`)
        const chunk: PaginatedResponse<User> = res.data.data
        users.push(...chunk.content)
        totalPages = chunk.totalPages
        page += 1
      } while (page < totalPages)

      if (!users.length) {
        toast.error('Нет пользователей для экспорта')
        return
      }

      const worksheet = XLSX.utils.json_to_sheet(
        users.map((u, index) => ({
          '№': index + 1,
          'ФИО': u.fullName,
          Email: u.email,
          Роль: ROLE_LABELS[u.role],
          Статус: u.active ? 'Активен' : 'Деактивирован',
          'Количество броней': u.bookingCount,
          'Дата создания': formatDate(u.createdAt),
          ID: u.id,
        }))
      )

      worksheet['!cols'] = [
        { wch: 6 },
        { wch: 30 },
        { wch: 32 },
        { wch: 18 },
        { wch: 18 },
        { wch: 20 },
        { wch: 18 },
        { wch: 38 },
      ]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Пользователи')
      XLSX.writeFile(workbook, `users_${new Date().toISOString().slice(0, 10)}.xlsx`)

      toast.success('Экспорт пользователей готов')
    } catch {
      toast.error('Не удалось экспортировать пользователей')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Пользователи"
        subtitle={`Всего: ${data?.totalElements ?? 0}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 border border-gray-200 bg-white px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <ArrowDown01Icon size={16} />
              {isExporting ? 'Экспорт...' : 'Экспорт в Excel'}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700"
            >
              <Add01Icon size={16} />
              Создать сотрудника
            </button>
          </div>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Сотрудник</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Роль</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Статус</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Броней</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Дата</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.content?.map((u) => (
                <tr key={u.id} className={`hover:bg-gray-50 ${!u.active ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {u.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${!u.active ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {u.fullName}
                        </p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="MANAGER">{ROLE_LABELS.MANAGER}</option>
                      <option value="SUPER_ADMIN">{ROLE_LABELS.SUPER_ADMIN}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.active ? 'Активен' : 'Деактивирован'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-center">{u.bookingCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    {u.active && u.id !== user?.id && (
                      <button
                        onClick={() => {
                          if (confirm('Деактивировать пользователя? Он не сможет войти в систему.'))
                            deactivateMutation.mutate(u.id)
                        }}
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <UserRemove01Icon size={14} />
                        Деактивировать
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Создать сотрудника</h2>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ФИО *</label>
                <input {...register('fullName', { required: true })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Иванова Мария Сергеевна" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input {...register('email', { required: true })} type="email" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Пароль *</label>
                <input {...register('password', { required: true })} type="password" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
                <select {...register('role')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="MANAGER">Менеджер</option>
                  <option value="SUPER_ADMIN">Супер-админ</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowModal(false); reset() }} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Отмена</button>
                <button type="submit" disabled={createMutation.isPending} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {createMutation.isPending ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
