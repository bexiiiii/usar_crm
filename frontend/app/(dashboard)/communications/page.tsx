'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { canAccess } from '@/lib/auth'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Message01Icon,
  Notification03Icon,
  Search01Icon,
  UserGroupIcon,
  AirplaneTakeOff01Icon,
  Money01Icon,
  Alert01Icon,
  CheckmarkSquare01Icon,
  ArrowRight01Icon,
} from 'hugeicons-react'

type NotifType = 'departure' | 'payment' | 'task' | 'birthday' | 'lead' | 'system'

interface Notification {
  id: string
  type: NotifType
  title: string
  body: string
  read: boolean
  readAt: string | null
  createdAt: string
  recipientName?: string
  createdByName?: string
}

const NOTIF_ICONS: Record<NotifType, React.ElementType> = {
  departure: AirplaneTakeOff01Icon,
  payment: Money01Icon,
  task: CheckmarkSquare01Icon,
  birthday: UserGroupIcon,
  lead: ArrowRight01Icon,
  system: Alert01Icon,
}

const NOTIF_COLORS: Record<NotifType, string> = {
  departure: '#2B5BF0',
  payment: '#EF4444',
  task: '#F59E0B',
  birthday: '#8B5CF6',
  lead: '#22C55E',
  system: '#6B7A9A',
}

type NotificationForm = {
  title: string
  body: string
  type: NotifType
}

const EMPTY_FORM: NotificationForm = {
  title: '',
  body: '',
  type: 'system',
}

export default function CommunicationsPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const canCompose = canAccess(user?.role, 'manage_notifications', user?.permissions)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<NotificationForm>(EMPTY_FORM)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '0',
        size: '100',
      })
      const res = await api.get(`/notifications?${params}`)
      return res.data.data
    },
  })

  const notifications: Notification[] = data?.content ?? []
  const filteredNotifications = notifications.filter((item) => {
    const needle = search.trim().toLowerCase()
    if (!needle) return true
    return (
      item.title.toLowerCase().includes(needle) ||
      item.body.toLowerCase().includes(needle) ||
      item.type.toLowerCase().includes(needle)
    )
  })
  const unreadCount = notifications.filter((item) => !item.read).length

  const broadcastMutation = useMutation({
    mutationFn: async (payload: NotificationForm) => {
      const res = await api.post('/notifications/broadcast', payload)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Уведомление отправлено всем сотрудникам')
      setShowModal(false)
      setForm(EMPTY_FORM)
    },
    onError: () => toast.error('Не удалось отправить уведомление'),
  })

  const readMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const readAllMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Все уведомления отмечены как прочитанные')
    },
  })

  function submitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Заполните заголовок и текст')
      return
    }
    broadcastMutation.mutate(form)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#2B5BF0' }}>
            <Message01Icon size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1A2332' }}>Уведомления</h1>
            <p className="text-xs" style={{ color: '#6B7A9A' }}>Единый центр уведомлений и рассылка для сотрудников</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => readAllMutation.mutate()}
              className="rounded-xl border px-4 py-2.5 text-sm font-medium"
              style={{ borderColor: '#E2E8F4', color: '#2B5BF0' }}
            >
              Прочитать все
            </button>
          )}
          {canCompose && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-xl bg-[#2B5BF0] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Notification03Icon size={16} />
              Создать уведомление
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #E2E8F4' }}>
        <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5" style={{ borderColor: '#E2E8F4' }}>
          <Search01Icon size={16} style={{ color: '#6B7A9A' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по уведомлениям..."
            className="w-full bg-transparent text-sm outline-none"
            style={{ color: '#1A2332' }}
          />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid #E2E8F4' }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F4' }}>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold" style={{ color: '#1A2332' }}>Центр уведомлений</h3>
            {unreadCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#EF444418', color: '#EF4444' }}>
                {unreadCount} новых
              </span>
            )}
          </div>
          <span className="text-sm" style={{ color: '#6B7A9A' }}>
            {filteredNotifications.length} записей
          </span>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm" style={{ color: '#6B7A9A' }}>
            Загрузка...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Notification03Icon size={40} style={{ color: '#CBD5E1', margin: '0 auto 10px' }} />
            <p className="text-sm font-medium" style={{ color: '#1A2332' }}>Уведомлений пока нет</p>
            <p className="text-xs mt-1" style={{ color: '#6B7A9A' }}>Новые события будут появляться здесь</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#F1F3F9' }}>
            {filteredNotifications.map((notif) => {
              const Icon = NOTIF_ICONS[notif.type]
              const color = NOTIF_COLORS[notif.type]
              return (
                <button
                  key={notif.id}
                  onClick={() => readMutation.mutate(notif.id)}
                  className="w-full px-6 py-4 flex items-start gap-4 text-left hover:bg-gray-50 transition-colors"
                  style={{ background: notif.read ? '#fff' : '#FAFBFE' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#1A2332' }}>{notif.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#6B7A9A' }}>
                          {formatDate(notif.createdAt)}
                          {notif.createdByName ? ` · от ${notif.createdByName}` : ''}
                        </p>
                      </div>
                      {!notif.read && (
                        <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                      )}
                    </div>
                    <p className="text-sm mt-2" style={{ color: '#4B5563' }}>{notif.body}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {showModal && canCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl" style={{ border: '1px solid #E2E8F4' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E2E8F4' }}>
              <div>
                <h2 className="text-base font-bold" style={{ color: '#1A2332' }}>Создать уведомление</h2>
                <p className="text-xs mt-0.5" style={{ color: '#6B7A9A' }}>Сообщение уйдёт всем активным сотрудникам</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={submitForm} className="space-y-4 p-6">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Заголовок</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ borderColor: '#E2E8F4' }}
                  placeholder="Например: Срочное обновление"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Текст</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={5}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                  style={{ borderColor: '#E2E8F4' }}
                  placeholder="Сообщение для всех сотрудников"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Тип</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as NotifType })}
                  className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ borderColor: '#E2E8F4' }}
                >
                  <option value="system">Системное</option>
                  <option value="task">Задача</option>
                  <option value="payment">Оплата</option>
                  <option value="departure">Вылет</option>
                  <option value="birthday">День рождения</option>
                  <option value="lead">Лид</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold"
                  style={{ borderColor: '#E2E8F4', color: '#6B7A9A' }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={broadcastMutation.isPending}
                  className="flex-1 rounded-xl bg-[#2B5BF0] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {broadcastMutation.isPending ? 'Отправка...' : 'Отправить всем'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
