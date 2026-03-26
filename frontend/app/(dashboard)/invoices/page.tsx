'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Invoice01Icon,
  Search01Icon,
  Add01Icon,
  Edit01Icon,
  Delete01Icon,
  Download01Icon,
  SendingOrderIcon,
  FilterIcon,
  Calendar01Icon,
  Money01Icon,
  ArrowRight01Icon,
} from 'hugeicons-react'

interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string
  clientName: string
  bookingId: string | null
  bookingNumber: string | null
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  amount: number
  taxAmount: number
  totalAmount: number
  currency: string
  dueDate: string | null
  paidAt: string | null
  notes: string | null
  items: InvoiceItem[]
  createdAt: string
}

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface InvoiceForm {
  clientId: string
  bookingId: string
  status: string
  amount: string
  taxPercent: string
  currency: string
  dueDate: string
  notes: string
  items: InvoiceItem[]
}

const EMPTY_FORM: InvoiceForm = {
  clientId: '', bookingId: '', status: 'DRAFT',
  amount: '', taxPercent: '0', currency: 'KZT',
  dueDate: '', notes: '',
  items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-600',
  CANCELLED: 'bg-yellow-100 text-yellow-700',
}
const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик', SENT: 'Отправлен', PAID: 'Оплачен',
  OVERDUE: 'Просрочен', CANCELLED: 'Отменён',
}

const KPI_COLORS = ['#2B5BF0', '#EF4444', '#F59E0B', '#22C55E']

export default function InvoicesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<InvoiceForm>(EMPTY_FORM)

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page), size: '15',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      })
      const res = await api.get(`/invoices?${params}`)
      return res.data.data
    },
  })

  const { data: statsData } = useQuery({
    queryKey: ['invoices', 'stats'],
    queryFn: async () => {
      const res = await api.get('/invoices/stats')
      return res.data.data
    },
  })

  const { data: clientsList } = useQuery({
    queryKey: ['clients', 'all'],
    queryFn: async () => {
      const res = await api.get('/clients?size=200')
      return res.data.data?.content ?? []
    },
  })

  const { data: bookingsList } = useQuery({
    queryKey: ['bookings', 'all'],
    queryFn: async () => {
      const res = await api.get('/bookings?size=200')
      return res.data.data?.content ?? []
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: InvoiceForm) => api.post('/invoices', {
      ...data,
      amount: Number(data.amount),
      taxPercent: Number(data.taxPercent),
      clientId: data.clientId || null,
      bookingId: data.bookingId || null,
    }),
    onSuccess: () => {
      toast.success('Счёт создан')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      closeModal()
    },
    onError: () => toast.error('Ошибка создания счёта'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InvoiceForm> }) =>
      api.put(`/invoices/${id}`, data),
    onSuccess: () => {
      toast.success('Счёт обновлён')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      closeModal()
    },
    onError: () => toast.error('Ошибка обновления'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/invoices/${id}`),
    onSuccess: () => {
      toast.success('Счёт удалён')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: () => toast.error('Ошибка удаления'),
  })

  const sendMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/invoices/${id}/send`),
    onSuccess: () => {
      toast.success('Счёт отправлен клиенту')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: () => toast.error('Ошибка отправки'),
  })

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/invoices/${id}/paid`),
    onSuccess: () => {
      toast.success('Счёт отмечен как оплаченный')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: () => toast.error('Ошибка'),
  })

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  function addItem() {
    setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }] })
  }

  function removeItem(idx: number) {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })
  }

  function updateItem(idx: number, field: keyof InvoiceItem, value: string | number) {
    const items = [...form.items]
    items[idx] = { ...items[idx], [field]: value }
    if (field === 'quantity' || field === 'unitPrice') {
      items[idx].total = Number(items[idx].quantity) * Number(items[idx].unitPrice)
    }
    const total = items.reduce((s, i) => s + i.total, 0)
    setForm({ ...form, items, amount: String(total) })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clientId) { toast.error('Выберите клиента'); return }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const invoices: Invoice[] = data?.content ?? []
  const total = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 1

  const kpiCards = [
    { label: 'Всего счетов', value: String(statsData?.totalCount ?? total), color: KPI_COLORS[0] },
    { label: 'Неоплаченных', value: String(statsData?.unpaidCount ?? 0), color: KPI_COLORS[1] },
    { label: 'Просрочено', value: String(statsData?.overdueCount ?? 0), color: KPI_COLORS[2] },
    { label: 'Оплачено (мес.)', value: formatCurrency(statsData?.paidMonthAmount ?? 0), color: KPI_COLORS[3] },
  ]

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#2B5BF0' }}>
            <Invoice01Icon size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1A2332' }}>Счета</h1>
            <p className="text-xs" style={{ color: '#6B7A9A' }}>Выставление и управление счетами</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: '#2B5BF0' }}
        >
          <Add01Icon size={16} />
          Новый счёт
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-5 flex flex-col gap-2"
            style={{ border: '1px solid #E2E8F4' }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium" style={{ color: '#6B7A9A' }}>{card.label}</p>
              <ArrowRight01Icon size={16} style={{ color: '#6B7A9A' }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: '#1A2332' }}>{card.value}</p>
            <div className="h-1 rounded-full" style={{ background: card.color, opacity: 0.3 }} />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 flex flex-wrap gap-3 items-center" style={{ border: '1px solid #E2E8F4' }}>
        <div className="flex items-center gap-2 flex-1 min-w-48 bg-gray-50 rounded-xl px-3 py-2" style={{ border: '1px solid #E2E8F4' }}>
          <Search01Icon size={16} style={{ color: '#6B7A9A' }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="Поиск по номеру, клиенту..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: '#1A2332' }}
          />
        </div>
        <div className="flex items-center gap-2">
          <FilterIcon size={14} style={{ color: '#6B7A9A' }} />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
            className="text-sm border rounded-xl px-3 py-2 bg-white outline-none"
            style={{ borderColor: '#E2E8F4', color: '#1A2332' }}
          >
            <option value="">Все статусы</option>
            <option value="DRAFT">Черновик</option>
            <option value="SENT">Отправлен</option>
            <option value="PAID">Оплачен</option>
            <option value="OVERDUE">Просрочен</option>
            <option value="CANCELLED">Отменён</option>
          </select>
        </div>
        <span className="text-sm ml-auto" style={{ color: '#6B7A9A' }}>
          Найдено: <strong style={{ color: '#1A2332' }}>{total}</strong>
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1px solid #E2E8F4' }}>
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
        </div>
      ) : !invoices.length ? (
        <div className="bg-white rounded-2xl p-16 text-center" style={{ border: '1px solid #E2E8F4' }}>
          <Invoice01Icon size={48} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
          <p className="font-medium" style={{ color: '#1A2332' }}>Счета не найдены</p>
          <p className="text-sm mt-1" style={{ color: '#6B7A9A' }}>Создайте первый счёт для клиента</p>
          <button
            onClick={openCreate}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#2B5BF0' }}
          >
            Создать счёт
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F4' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F8F9FE' }}>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7A9A' }}>№ Счёта</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7A9A' }}>Клиент</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7A9A' }}>Бронь</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7A9A' }}>Сумма</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7A9A' }}>Срок оплаты</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7A9A' }}>Статус</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#F1F3F9' }}>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold" style={{ color: '#2B5BF0' }}>#{inv.invoiceNumber}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: '#1A2332' }}>{inv.clientName}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: '#6B7A9A' }}>
                      {inv.bookingNumber ? `#${inv.bookingNumber}` : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold" style={{ color: '#1A2332' }}>
                        {formatCurrency(inv.totalAmount)} {inv.currency}
                      </p>
                      {inv.taxAmount > 0 && (
                        <p className="text-xs" style={{ color: '#6B7A9A' }}>НДС: {formatCurrency(inv.taxAmount)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {inv.dueDate ? (
                        <span className="flex items-center gap-1 text-sm" style={{ color: '#6B7A9A' }}>
                          <Calendar01Icon size={13} />
                          {formatDate(inv.dueDate)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${statusColors[inv.status]}`}>
                        {statusLabels[inv.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        {inv.status === 'DRAFT' && (
                          <button
                            onClick={() => sendMutation.mutate(inv.id)}
                            title="Отправить"
                            className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                            style={{ color: '#2B5BF0' }}
                          >
                            <SendingOrderIcon size={14} />
                          </button>
                        )}
                        {inv.status === 'SENT' && (
                          <button
                            onClick={() => markPaidMutation.mutate(inv.id)}
                            title="Отметить как оплачен"
                            className="p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                            style={{ color: '#22C55E' }}
                          >
                            <Money01Icon size={14} />
                          </button>
                        )}
                        <button
                          title="Скачать PDF"
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          style={{ color: '#6B7A9A' }}
                        >
                          <Download01Icon size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Удалить счёт?')) deleteMutation.mutate(inv.id)
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          style={{ color: '#EF4444' }}
                        >
                          <Delete01Icon size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-5 py-3 flex items-center justify-between border-t" style={{ borderColor: '#E2E8F4' }}>
              <p className="text-sm" style={{ color: '#6B7A9A' }}>Страница {page + 1} из {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40" style={{ borderColor: '#E2E8F4' }}>Назад</button>
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40" style={{ borderColor: '#E2E8F4' }}>Вперёд</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" style={{ border: '1px solid #E2E8F4' }}>
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between z-10" style={{ borderColor: '#E2E8F4' }}>
              <h2 className="text-base font-bold" style={{ color: '#1A2332' }}>
                {editingId ? 'Редактировать счёт' : 'Новый счёт'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Client */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Клиент *</label>
                  <select
                    value={form.clientId}
                    onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                  >
                    <option value="">Выберите клиента</option>
                    {(clientsList ?? []).map((c: { id: string; fullName: string }) => (
                      <option key={c.id} value={c.id}>{c.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Бронирование</label>
                  <select
                    value={form.bookingId}
                    onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                  >
                    <option value="">Без бронирования</option>
                    {(bookingsList ?? []).map((b: { id: string; bookingNumber: string; destination: string }) => (
                      <option key={b.id} value={b.id}>#{b.bookingNumber} — {b.destination}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#6B7A9A' }}>Позиции счёта</label>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        placeholder="Описание"
                        className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        style={{ borderColor: '#E2E8F4' }}
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                        className="w-16 border rounded-xl px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        style={{ borderColor: '#E2E8F4' }}
                        min="1"
                        placeholder="Кол."
                      />
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                        className="w-24 border rounded-xl px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        style={{ borderColor: '#E2E8F4' }}
                        placeholder="Цена"
                      />
                      <span className="w-24 text-sm font-semibold text-right" style={{ color: '#1A2332' }}>
                        {formatCurrency(item.total)}
                      </span>
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 transition-colors text-lg">✕</button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="mt-2 text-sm font-medium flex items-center gap-1"
                  style={{ color: '#2B5BF0' }}
                >
                  <Add01Icon size={14} /> Добавить позицию
                </button>
              </div>

              {/* Totals row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Итого</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>НДС %</label>
                  <input
                    type="number"
                    value={form.taxPercent}
                    onChange={(e) => setForm({ ...form, taxPercent: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Валюта</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="KZT">KZT</option>
                    <option value="RUB">RUB</option>
                  </select>
                </div>
              </div>

              {/* Due Date / Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Срок оплаты</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Статус</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                  >
                    <option value="DRAFT">Черновик</option>
                    <option value="SENT">Отправлен</option>
                    <option value="PAID">Оплачен</option>
                    <option value="CANCELLED">Отменён</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Примечание</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                  style={{ borderColor: '#E2E8F4' }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: '#E2E8F4', color: '#6B7A9A' }}>
                  Отмена
                </button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: '#2B5BF0' }}>
                  {createMutation.isPending || updateMutation.isPending ? 'Сохранение...' : editingId ? 'Обновить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
