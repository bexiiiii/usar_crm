'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Message01Icon,
  SendingOrderIcon,
  Search01Icon,
  UserGroupIcon,
  Notification03Icon,
  Calendar01Icon,
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
  date: string
  read: boolean
  clientName?: string
  bookingNumber?: string
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

// Simulated notifications
const DEMO_NOTIFS: Notification[] = [
  { id: '1', type: 'departure', title: 'Вылет через 3 дня', body: 'Клиент Иванов А.А. — Турция, 26 марта', date: new Date().toISOString(), read: false, clientName: 'Иванов Алексей', bookingNumber: 'BK-00123' },
  { id: '2', type: 'payment', title: 'Дедлайн оплаты оператору', body: 'Tez Tour, бронь #BK-00118 — $2,400 до 28 марта', date: new Date(Date.now() - 3600000).toISOString(), read: false, bookingNumber: 'BK-00118' },
  { id: '3', type: 'birthday', title: 'День рождения клиента', body: 'Сегодня день рождения у Смирновой Елены (+7 777 123-45-67)', date: new Date(Date.now() - 7200000).toISOString(), read: false, clientName: 'Смирнова Елена' },
  { id: '4', type: 'task', title: 'Просроченная задача', body: 'Отправить КП клиенту Ким Д. — просрочено на 2 дня', date: new Date(Date.now() - 86400000).toISOString(), read: true },
  { id: '5', type: 'lead', title: 'Новый лид назначен', body: 'Лид «Египет — 2 взрослых» назначен на вас', date: new Date(Date.now() - 86400000 * 2).toISOString(), read: true },
  { id: '6', type: 'system', title: 'Система обновлена', body: 'Usar Travel CRM обновлён до версии 2.0', date: new Date(Date.now() - 86400000 * 3).toISOString(), read: true },
]

interface ChatMessage {
  id: string
  from: 'me' | 'client'
  text: string
  time: string
}

interface Contact {
  id: string
  name: string
  phone: string
  lastMessage: string
  lastTime: string
  unread: number
}

const DEMO_CONTACTS: Contact[] = [
  { id: '1', name: 'Иванов Алексей', phone: '+7 777 111-22-33', lastMessage: 'Хорошо, жду документы', lastTime: '10:45', unread: 2 },
  { id: '2', name: 'Смирнова Елена', phone: '+7 777 222-33-44', lastMessage: 'Когда будет готов ваучер?', lastTime: 'Вчера', unread: 0 },
  { id: '3', name: 'Козлов Дмитрий', phone: '+7 777 333-44-55', lastMessage: 'Спасибо за отличный тур!', lastTime: 'Пн', unread: 0 },
  { id: '4', name: 'Попова Мария', phone: '+7 777 444-55-66', lastMessage: 'Нас 2 взрослых + ребёнок 8 лет', lastTime: '23 мар', unread: 0 },
]

const DEMO_MESSAGES: Record<string, ChatMessage[]> = {
  '1': [
    { id: '1', from: 'client', text: 'Здравствуйте! Интересует тур в Турцию на июль для 2 взрослых', time: '10:30' },
    { id: '2', from: 'me', text: 'Добрый день! Конечно, подберём варианты. Какой бюджет планируете?', time: '10:32' },
    { id: '3', from: 'client', text: 'Примерно до $1500 на человека, всё включено', time: '10:35' },
    { id: '4', from: 'me', text: 'Отлично! Сейчас пришлю несколько хороших предложений', time: '10:38' },
    { id: '5', from: 'client', text: 'Хорошо, жду документы', time: '10:45' },
  ],
  '2': [
    { id: '1', from: 'client', text: 'Добрый день, мы уже оплатили тур', time: 'Вчера 14:00' },
    { id: '2', from: 'me', text: 'Принято! Готовим документы', time: 'Вчера 14:05' },
    { id: '3', from: 'client', text: 'Когда будет готов ваучер?', time: 'Вчера 16:30' },
  ],
}

const QUICK_TEMPLATES = [
  { id: 'confirmation', label: '✅ Подтверждение брони', text: 'Ваше бронирование подтверждено! Номер брони: {booking_number}. Дата вылета: {departure_date}. Для уточнений звоните: +7 777 000-00-00' },
  { id: 'reminder_payment', label: '💳 Напоминание об оплате', text: 'Уважаемый(ая) {client_name}! Напоминаем, что оплата по броне #{booking_number} должна быть произведена до {payment_date}. Сумма: {amount}.' },
  { id: 'departure_reminder', label: '✈️ Напоминание о вылете', text: 'До вашего вылета осталось 3 дня! Не забудьте: паспорт, ваучер, страховка. Вылет {departure_date} из {departure_city}.' },
  { id: 'review_request', label: '⭐ Запрос отзыва', text: 'Надеемся, тур прошёл отлично! Пожалуйста, оставьте отзыв — это очень важно для нас.' },
  { id: 'birthday', label: '🎂 День рождения', text: 'С Днём рождения, {client_name}! Желаем ярких путешествий и незабываемых впечатлений. Специально для вас — скидка 5% на следующий тур!' },
]

type TabType = 'notifications' | 'messages' | 'broadcast'

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('notifications')
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFS)
  const [broadcastText, setBroadcastText] = useState('')
  const [broadcastChannel, setBroadcastChannel] = useState('whatsapp')
  const [broadcastSegment, setBroadcastSegment] = useState('all')
  const [searchContact, setSearchContact] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentMessages = selectedContact ? (DEMO_MESSAGES[selectedContact] ?? []) : []
  const currentContact = DEMO_CONTACTS.find((c) => c.id === selectedContact)

  function sendMessage() {
    if (!newMessage.trim() || !selectedContact) return
    toast.success('Сообщение отправлено (в демо-режиме)')
    setNewMessage('')
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.success('Все уведомления прочитаны')
  }

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  function sendBroadcast() {
    if (!broadcastText.trim()) { toast.error('Введите текст рассылки'); return }
    toast.success(`Рассылка запущена по каналу "${broadcastChannel}"`)
    setBroadcastText('')
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const filteredContacts = DEMO_CONTACTS.filter((c) =>
    c.name.toLowerCase().includes(searchContact.toLowerCase())
  )

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#2B5BF0' }}>
          <Message01Icon size={20} color="#fff" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1A2332' }}>Коммуникации</h1>
          <p className="text-xs" style={{ color: '#6B7A9A' }}>Уведомления, сообщения и рассылки</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 w-fit" style={{ border: '1px solid #E2E8F4' }}>
        {([
          { id: 'notifications', label: 'Уведомления', badge: unreadCount },
          { id: 'messages', label: 'Сообщения' },
          { id: 'broadcast', label: 'Рассылки' },
        ] as Array<{ id: TabType; label: string; badge?: number }>).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.id ? '#2B5BF0' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#6B7A9A',
            }}
          >
            {tab.label}
            {tab.badge && tab.badge > 0 ? (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold" style={{ background: activeTab === tab.id ? 'rgba(255,255,255,0.3)' : '#EF4444', color: '#fff' }}>
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F4' }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F4' }}>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold" style={{ color: '#1A2332' }}>Центр уведомлений</h3>
              {unreadCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#EF444418', color: '#EF4444' }}>
                  {unreadCount} новых
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-sm font-medium" style={{ color: '#2B5BF0' }}>
                Отметить все как прочитанные
              </button>
            )}
          </div>
          <div className="divide-y" style={{ borderColor: '#F1F3F9' }}>
            {notifications.map((notif) => {
              const Icon = NOTIF_ICONS[notif.type]
              const color = NOTIF_COLORS[notif.type]
              return (
                <div
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className="px-6 py-4 flex items-start gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ background: notif.read ? '#fff' : '#FAFBFE' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}18` }}
                  >
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold" style={{ color: '#1A2332' }}>{notif.title}</p>
                      <span className="text-xs flex-shrink-0" style={{ color: '#9CA3AF' }}>
                        {new Date(notif.date).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: '#6B7A9A' }}>{notif.body}</p>
                    {!notif.read && (
                      <span className="inline-block w-2 h-2 rounded-full mt-1.5" style={{ background: color }} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-2xl overflow-hidden flex" style={{ border: '1px solid #E2E8F4', height: '600px' }}>
          {/* Contact List */}
          <div className="w-72 border-r flex flex-col flex-shrink-0" style={{ borderColor: '#E2E8F4' }}>
            <div className="p-3 border-b" style={{ borderColor: '#E2E8F4' }}>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2" style={{ border: '1px solid #E2E8F4' }}>
                <Search01Icon size={14} style={{ color: '#6B7A9A' }} />
                <input
                  value={searchContact}
                  onChange={(e) => setSearchContact(e.target.value)}
                  placeholder="Поиск клиента..."
                  className="flex-1 bg-transparent text-xs outline-none"
                  style={{ color: '#1A2332' }}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: '#F1F3F9' }}>
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact.id)}
                  className="w-full px-4 py-3.5 text-left hover:bg-gray-50 transition-colors flex items-start gap-3"
                  style={{ background: selectedContact === contact.id ? '#EEF0F8' : undefined }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: '#2B5BF0' }}
                  >
                    {contact.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold truncate" style={{ color: '#1A2332' }}>{contact.name}</p>
                      <span className="text-xs flex-shrink-0" style={{ color: '#9CA3AF' }}>{contact.lastTime}</span>
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: '#6B7A9A' }}>{contact.lastMessage}</p>
                  </div>
                  {contact.unread > 0 && (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#2B5BF0' }}>
                      {contact.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {!selectedContact ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <Message01Icon size={48} style={{ color: '#CBD5E1' }} />
                <p className="text-sm" style={{ color: '#6B7A9A' }}>Выберите контакт для начала переписки</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: '#E2E8F4' }}>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: '#2B5BF0' }}
                  >
                    {currentContact?.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#1A2332' }}>{currentContact?.name}</p>
                    <p className="text-xs" style={{ color: '#6B7A9A' }}>{currentContact?.phone} · WhatsApp</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ background: '#FAFBFE' }}>
                  {currentMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="max-w-xs px-4 py-2.5 rounded-2xl"
                        style={{
                          background: msg.from === 'me' ? '#2B5BF0' : '#fff',
                          color: msg.from === 'me' ? '#fff' : '#1A2332',
                          border: msg.from === 'me' ? 'none' : '1px solid #E2E8F4',
                        }}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p
                          className="text-xs mt-1 text-right"
                          style={{ color: msg.from === 'me' ? 'rgba(255,255,255,0.6)' : '#9CA3AF' }}
                        >
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t" style={{ borderColor: '#E2E8F4' }}>
                  <div className="flex gap-2">
                    <select
                      className="text-xs border rounded-xl px-2 py-2 bg-white outline-none"
                      style={{ borderColor: '#E2E8F4', color: '#6B7A9A' }}
                      onChange={(e) => setNewMessage(QUICK_TEMPLATES.find((t) => t.id === e.target.value)?.text ?? newMessage)}
                    >
                      <option value="">Шаблон...</option>
                      {QUICK_TEMPLATES.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                      placeholder="Введите сообщение..."
                      className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                      style={{ borderColor: '#E2E8F4' }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2.5 rounded-xl disabled:opacity-40 transition-opacity"
                      style={{ background: '#2B5BF0' }}
                    >
                      <SendingOrderIcon size={18} color="#fff" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Broadcast Tab */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Compose */}
          <div className="xl:col-span-2 bg-white rounded-2xl p-6 space-y-5" style={{ border: '1px solid #E2E8F4' }}>
            <h3 className="text-base font-semibold" style={{ color: '#1A2332' }}>Новая рассылка</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Канал</label>
                <select value={broadcastChannel} onChange={(e) => setBroadcastChannel(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white" style={{ borderColor: '#E2E8F4' }}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Сегмент</label>
                <select value={broadcastSegment} onChange={(e) => setBroadcastSegment(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white" style={{ borderColor: '#E2E8F4' }}>
                  <option value="all">Все клиенты</option>
                  <option value="vip">VIP клиенты</option>
                  <option value="active">Активные</option>
                  <option value="inactive">Давно не покупали</option>
                  <option value="upcoming">Вылетают скоро</option>
                  <option value="birthday">Именинники (эта неделя)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Быстрые шаблоны</label>
              <div className="flex flex-wrap gap-2">
                {QUICK_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setBroadcastText(t.text)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#E2E8F4', color: '#6B7A9A' }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Текст сообщения</label>
              <textarea
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                rows={6}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                style={{ borderColor: '#E2E8F4' }}
                placeholder="Текст рассылки... Используйте переменные: {client_name}, {booking_number}, {departure_date}"
              />
              <p className="text-xs mt-1 text-right" style={{ color: '#9CA3AF' }}>{broadcastText.length} символов</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => toast('Рассылка сохранена как черновик')}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: '#E2E8F4', color: '#6B7A9A' }}
              >
                Сохранить черновик
              </button>
              <button
                onClick={sendBroadcast}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#2B5BF0' }}
              >
                Отправить рассылку
              </button>
            </div>
          </div>

          {/* Stats panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E2E8F4' }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: '#1A2332' }}>Статистика рассылок</h3>
              {[
                { label: 'Отправлено (месяц)', value: '1,247', color: '#2B5BF0' },
                { label: 'Открыто', value: '73%', color: '#22C55E' },
                { label: 'Клики', value: '12%', color: '#F59E0B' },
                { label: 'Отписки', value: '0.4%', color: '#EF4444' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: '#F1F3F9' }}>
                  <span className="text-sm" style={{ color: '#6B7A9A' }}>{s.label}</span>
                  <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E2E8F4' }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: '#1A2332' }}>Подсказки по переменным</h3>
              <div className="space-y-1.5">
                {[
                  ['{client_name}', 'Имя клиента'],
                  ['{booking_number}', 'Номер брони'],
                  ['{departure_date}', 'Дата вылета'],
                  ['{destination}', 'Направление'],
                  ['{amount}', 'Сумма'],
                  ['{payment_date}', 'Дата оплаты'],
                ].map(([code, desc]) => (
                  <div key={code} className="flex items-center gap-2">
                    <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#EEF0F8', color: '#2B5BF0' }}>{code}</code>
                    <span className="text-xs" style={{ color: '#6B7A9A' }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
