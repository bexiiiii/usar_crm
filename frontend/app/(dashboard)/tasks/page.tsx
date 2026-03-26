'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import PageHeader from '@/components/layout/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import { TableSkeleton } from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { Task, PaginatedResponse } from '@/types'
import { Add01Icon, CheckmarkSquare01Icon, Tick01Icon } from 'hugeicons-react'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'

const priorityOptions = [
  { value: '', label: 'Все приоритеты' },
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' },
  { value: 'URGENT', label: 'Срочно' },
]

const statusOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'TODO', label: 'К выполнению' },
  { value: 'IN_PROGRESS', label: 'В процессе' },
  { value: 'DONE', label: 'Выполнено' },
  { value: 'CANCELLED', label: 'Отменено' },
]

export default function TasksPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [priority, setPriority] = useState('')
  const [status, setStatus] = useState('TODO')
  const [showModal, setShowModal] = useState(false)
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery<PaginatedResponse<Task>>({
    queryKey: ['tasks', priority, status, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (priority) params.set('priority', priority)
      if (status) params.set('status', status)
      params.set('page', String(page))
      params.set('size', '20')
      params.set('sort', 'dueDate,asc')
      const res = await api.get(`/tasks?${params}`)
      return res.data.data
    },
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/tasks/${id}/status`, { status: 'DONE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Задача выполнена')
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Задача создана')
      setShowModal(false)
      reset()
    },
  })

  const { register, handleSubmit, reset } = useForm()

  const isOverdue = (t: Task) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'

  return (
    <div>
      <PageHeader
        title="Задачи"
        subtitle={`Всего: ${data?.totalElements ?? 0}`}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700"
          >
            <Add01Icon size={16} />
            Создать задачу
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
          {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={priority}
          onChange={(e) => { setPriority(e.target.value); setPage(0) }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {priorityOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : !data?.content?.length ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16">
          <EmptyState
            message="Задач нет. Создайте задачу"
            icon={<CheckmarkSquare01Icon size={48} />}
            action={
              <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700">
                Создать задачу
              </button>
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="w-10 px-4 py-3" />
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Задача</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Приоритет</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Назначено</th>
                {user?.role === 'SUPER_ADMIN' && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Менеджер</th>}
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Срок</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Связь</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.content.map((task) => (
                <tr key={task.id} className={`hover:bg-gray-50 ${isOverdue(task) ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3">
                    {task.status !== 'DONE' && (
                      <button
                        onClick={() => completeMutation.mutate(task.id)}
                        className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 flex items-center justify-center transition-colors"
                      >
                        <Tick01Icon size={12} className="text-green-500 opacity-0 hover:opacity-100" />
                      </button>
                    )}
                    {task.status === 'DONE' && (
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Tick01Icon size={12} className="text-white" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className={`text-sm font-medium ${task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {task.title}
                    </p>
                    {task.description && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{task.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={task.priority} type="task" />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{task.assignedToName || '—'}</td>
                  {user?.role === 'SUPER_ADMIN' && (
                    <td className="px-4 py-3 text-sm text-gray-600">{task.assignedToName || '—'}</td>
                  )}
                  <td className="px-4 py-3">
                    <span className={`text-sm ${isOverdue(task) ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                      {formatDate(task.dueDate)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {task.relatedBookingNumber && <p>Бронь: {task.relatedBookingNumber}</p>}
                    {task.relatedClientName && <p>Клиент: {task.relatedClientName}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">Показано {data.content.length} из {data.totalElements}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50">←</button>
                <span className="px-3 py-1.5 text-sm text-gray-700">{page + 1} / {data.totalPages}</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.totalPages - 1} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50">→</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Создать задачу</h2>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                <input {...register('title', { required: true })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea {...register('description')} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
                  <select {...register('priority')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="LOW">Низкий</option>
                    <option value="MEDIUM">Средний</option>
                    <option value="HIGH">Высокий</option>
                    <option value="URGENT">Срочно</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Срок</label>
                  <input {...register('dueDate')} type="datetime-local" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowModal(false); reset() }} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Отмена</button>
                <button type="submit" disabled={createMutation.isPending} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {createMutation.isPending ? 'Сохранение...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
