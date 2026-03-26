'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import {
  Calendar01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  AirplaneTakeOff01Icon,
  CheckmarkSquare01Icon,
  Money01Icon,
  UserGroupIcon,
  Alert01Icon,
} from 'hugeicons-react'

type ViewMode = 'month' | 'week'

interface CalendarEvent {
  id: string
  type: 'departure' | 'return' | 'task' | 'payment' | 'birthday'
  date: string
  title: string
  subtitle?: string
  color: string
}

const EVENT_COLORS: Record<string, string> = {
  departure: '#2B5BF0',
  return: '#22C55E',
  task: '#F59E0B',
  payment: '#EF4444',
  birthday: '#8B5CF6',
}

const EVENT_ICONS: Record<string, React.ElementType> = {
  departure: AirplaneTakeOff01Icon,
  return: AirplaneTakeOff01Icon,
  task: CheckmarkSquare01Icon,
  payment: Money01Icon,
  birthday: UserGroupIcon,
}

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function getCalendarDays(year: number, month: number): Array<Date | null> {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  // Monday-based week
  const startDow = (firstDay.getDay() + 6) % 7
  const days: Array<Date | null> = Array.from({ length: startDow }, () => null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  while (days.length % 7 !== 0) days.push(null)
  return days
}

function toYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function CalendarPage() {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [viewMode] = useState<ViewMode>('month')

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))
  const goToday = () => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))

  // Fetch bookings for departures/returns
  const { data: bookingsData } = useQuery({
    queryKey: ['calendar', 'bookings', year, month],
    queryFn: async () => {
      const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const to = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`
      const res = await api.get(`/bookings?from=${from}&to=${to}&size=200`)
      return res.data.data?.content ?? []
    },
  })

  // Fetch tasks
  const { data: tasksData } = useQuery({
    queryKey: ['calendar', 'tasks', year, month],
    queryFn: async () => {
      const res = await api.get('/tasks?status=TODO&status=IN_PROGRESS&size=200')
      return res.data.data?.content ?? []
    },
  })

  // Fetch payment deadlines
  const { data: paymentsData } = useQuery({
    queryKey: ['calendar', 'payments', year, month],
    queryFn: async () => {
      const res = await api.get('/bookings/upcoming-deadlines?days=60')
      return res.data.data ?? []
    },
  })

  // Build events map
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}

    function addEvent(e: CalendarEvent) {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    }

    // Departures / returns
    ;(bookingsData ?? []).forEach((b: { id: string; departureDate: string; returnDate?: string; destination: string; clientName: string; bookingNumber: string }) => {
      if (b.departureDate) {
        addEvent({
          id: `dep-${b.id}`,
          type: 'departure',
          date: b.departureDate,
          title: `✈ ${b.destination}`,
          subtitle: b.clientName,
          color: EVENT_COLORS.departure,
        })
      }
      if (b.returnDate) {
        addEvent({
          id: `ret-${b.id}`,
          type: 'return',
          date: b.returnDate,
          title: `🏠 Возврат: ${b.clientName}`,
          subtitle: b.destination,
          color: EVENT_COLORS.return,
        })
      }
    })

    // Tasks
    ;(tasksData ?? []).forEach((t: { id: string; dueDate?: string; title: string; priority: string }) => {
      if (t.dueDate) {
        addEvent({
          id: `task-${t.id}`,
          type: 'task',
          date: t.dueDate.split('T')[0],
          title: t.title,
          subtitle: t.priority,
          color: EVENT_COLORS.task,
        })
      }
    })

    // Payment deadlines
    ;(paymentsData ?? []).forEach((b: { id: string; supplierPaymentDeadline?: string; destination: string; totalPrice: number }) => {
      if (b.supplierPaymentDeadline) {
        addEvent({
          id: `pay-${b.id}`,
          type: 'payment',
          date: b.supplierPaymentDeadline,
          title: `Оплата: ${b.destination}`,
          subtitle: `$${b.totalPrice}`,
          color: EVENT_COLORS.payment,
        })
      }
    })

    return map
  }, [bookingsData, tasksData, paymentsData])

  const calendarDays = getCalendarDays(year, month)
  const todayStr = toYMD(today)

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : []

  // Count events for the month
  const monthEventCount = Object.values(eventsByDate).reduce((s, evs) => s + evs.length, 0)
  const departures = Object.values(eventsByDate).flat().filter((e) => e.type === 'departure').length
  const tasksDue = Object.values(eventsByDate).flat().filter((e) => e.type === 'task').length
  const payments = Object.values(eventsByDate).flat().filter((e) => e.type === 'payment').length

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#2B5BF0' }}>
            <Calendar01Icon size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1A2332' }}>Календарь</h1>
            <p className="text-xs" style={{ color: '#6B7A9A' }}>Вылеты, задачи, дедлайны оплат</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Событий в месяце', value: monthEventCount, color: '#2B5BF0', icon: Calendar01Icon },
          { label: 'Вылетов', value: departures, color: '#22C55E', icon: AirplaneTakeOff01Icon },
          { label: 'Задач до срока', value: tasksDue, color: '#F59E0B', icon: CheckmarkSquare01Icon },
          { label: 'Оплат операторам', value: payments, color: '#EF4444', icon: Money01Icon },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-2xl p-4 flex items-center gap-4" style={{ border: '1px solid #E2E8F4' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18` }}>
                <Icon size={18} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#1A2332' }}>{s.value}</p>
                <p className="text-xs" style={{ color: '#6B7A9A' }}>{s.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Calendar Grid */}
        <div className="xl:col-span-3 bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F4' }}>
          {/* Calendar header */}
          <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: '#E2E8F4' }}>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold" style={{ color: '#1A2332' }}>
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={goToday}
                className="text-xs px-2.5 py-1 rounded-lg border font-medium"
                style={{ borderColor: '#E2E8F4', color: '#6B7A9A' }}
              >
                Сегодня
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: '#6B7A9A' }}
              >
                <ArrowLeft01Icon size={18} />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: '#6B7A9A' }}
              >
                <ArrowRight01Icon size={18} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b" style={{ borderColor: '#E2E8F4' }}>
            {WEEKDAYS_SHORT.map((d) => (
              <div key={d} className="py-2.5 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7A9A' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              if (!day) {
                return (
                  <div key={`empty-${idx}`} className="min-h-[88px] p-1 border-b border-r" style={{ borderColor: '#F1F3F9' }} />
                )
              }
              const dateStr = toYMD(day)
              const isToday = dateStr === todayStr
              const isSelected = selectedDate === dateStr
              const events = eventsByDate[dateStr] ?? []
              const isWeekend = day.getDay() === 0 || day.getDay() === 6

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className="min-h-[88px] p-1.5 border-b border-r cursor-pointer transition-colors"
                  style={{
                    borderColor: '#F1F3F9',
                    background: isSelected ? '#EEF0F8' : isWeekend ? '#FAFBFE' : '#fff',
                  }}
                >
                  <div className="flex justify-end mb-1">
                    <span
                      className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold"
                      style={{
                        background: isToday ? '#2B5BF0' : 'transparent',
                        color: isToday ? '#fff' : isWeekend ? '#9CA3AF' : '#1A2332',
                      }}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {events.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-xs px-1.5 py-0.5 rounded truncate font-medium"
                        style={{ background: `${ev.color}18`, color: ev.color }}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {events.length > 3 && (
                      <div className="text-xs px-1 py-0.5 rounded font-medium" style={{ color: '#6B7A9A', background: '#F1F3F9' }}>
                        +{events.length - 3} ещё
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right panel: Legend + Selected day events */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E2E8F4' }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: '#1A2332' }}>Легенда</h3>
            <div className="space-y-2">
              {[
                { type: 'departure', label: 'Вылет' },
                { type: 'return', label: 'Возврат' },
                { type: 'task', label: 'Задача' },
                { type: 'payment', label: 'Оплата оператору' },
                { type: 'birthday', label: 'День рождения' },
              ].map((item) => (
                <div key={item.type} className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: EVENT_COLORS[item.type] }} />
                  <span className="text-sm" style={{ color: '#6B7A9A' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected date events */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F4' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: '#E2E8F4' }}>
              <h3 className="text-sm font-bold" style={{ color: '#1A2332' }}>
                {selectedDate
                  ? formatDate(selectedDate)
                  : 'Выберите дату'}
              </h3>
            </div>
            {!selectedDate ? (
              <div className="px-5 py-8 text-center">
                <Calendar01Icon size={32} style={{ color: '#CBD5E1', margin: '0 auto 8px' }} />
                <p className="text-sm" style={{ color: '#6B7A9A' }}>Кликните на дату для просмотра событий</p>
              </div>
            ) : selectedEvents.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm" style={{ color: '#6B7A9A' }}>Событий нет</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#F1F3F9' }}>
                {selectedEvents.map((ev) => {
                  const Icon = EVENT_ICONS[ev.type]
                  return (
                    <div key={ev.id} className="px-5 py-3 flex items-start gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${ev.color}18` }}
                      >
                        <Icon size={14} style={{ color: ev.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#1A2332' }}>{ev.title}</p>
                        {ev.subtitle && (
                          <p className="text-xs" style={{ color: '#6B7A9A' }}>{ev.subtitle}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Upcoming events this week */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F4' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: '#E2E8F4' }}>
              <h3 className="text-sm font-bold" style={{ color: '#1A2332' }}>Ближайшие события</h3>
            </div>
            <div className="divide-y" style={{ borderColor: '#F1F3F9' }}>
              {Object.entries(eventsByDate)
                .filter(([date]) => date >= todayStr)
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(0, 6)
                .flatMap(([date, events]) =>
                  events.slice(0, 2).map((ev) => ({ ...ev, dateStr: date }))
                )
                .map((ev) => {
                  const Icon = EVENT_ICONS[ev.type]
                  return (
                    <div key={ev.id} className="px-5 py-3 flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${ev.color}18` }}
                      >
                        <Icon size={14} style={{ color: ev.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: '#1A2332' }}>{ev.title}</p>
                        <p className="text-xs" style={{ color: '#6B7A9A' }}>{formatDate(ev.dateStr)}</p>
                      </div>
                    </div>
                  )
                })}
              {Object.keys(eventsByDate).length === 0 && (
                <div className="px-5 py-6 text-center">
                  <Alert01Icon size={24} style={{ color: '#CBD5E1', margin: '0 auto 6px' }} />
                  <p className="text-xs" style={{ color: '#6B7A9A' }}>Нет предстоящих событий</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
