'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  AirplaneTakeOff01Icon,
  Search01Icon,
  FilterIcon,
  Add01Icon,
  Edit01Icon,
  Delete01Icon,
  StarIcon,
  Location01Icon,
  Calendar01Icon,
  Money01Icon,
  UserGroupIcon,
} from 'hugeicons-react'

interface Tour {
  id: string
  name: string
  description: string | null
  country: string
  resort: string | null
  hotelName: string | null
  hotelStars: number | null
  tourOperator: string | null
  category: string
  departureCity: string | null
  durationDays: number
  mealPlan: string | null
  transport: string
  priceNetto: number
  priceBrutto: number
  currency: string
  maxSeats: number | null
  bookedSeats: number
  status: string
  imageUrl: string | null
  departureDate: string | null
  returnDate: string | null
  visaRequired: boolean
  insuranceIncluded: boolean
  notes: string | null
  createdAt: string
}

interface TourForm {
  name: string
  country: string
  resort: string
  hotelName: string
  hotelStars: string
  tourOperator: string
  category: string
  departureCity: string
  durationDays: string
  mealPlan: string
  transport: string
  priceNetto: string
  priceBrutto: string
  currency: string
  maxSeats: string
  status: string
  departureDate: string
  returnDate: string
  visaRequired: boolean
  insuranceIncluded: boolean
  notes: string
  description: string
}

const EMPTY_FORM: TourForm = {
  name: '', country: '', resort: '', hotelName: '', hotelStars: '',
  tourOperator: '', category: 'BEACH', departureCity: '', durationDays: '7',
  mealPlan: 'AI', transport: 'AIR', priceNetto: '', priceBrutto: '',
  currency: 'KZT', maxSeats: '', status: 'ACTIVE',
  departureDate: '', returnDate: '', visaRequired: false,
  insuranceIncluded: false, notes: '', description: '',
}

const categoryLabels: Record<string, string> = {
  BEACH: 'Пляжный', CITY: 'Городской', MOUNTAIN: 'Горный',
  CRUISE: 'Круиз', SAFARI: 'Сафари', CULTURAL: 'Культурный',
  ADVENTURE: 'Экстрим', WELLNESS: 'Оздоровительный', BUSINESS: 'Деловой',
}
const transportLabels: Record<string, string> = {
  AIR: 'Авиа', BUS: 'Автобус', TRAIN: 'Ж/д', CRUISE_SHIP: 'Круизный лайнер', OWN: 'Свой транспорт',
}
const mealLabels: Record<string, string> = {
  RO: 'Без питания', BB: 'Завтрак', HB: 'Полупансион',
  FB: 'Полный пансион', AI: 'Всё включено', UAI: 'Ультра всё',
}
const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  SOLD_OUT: 'bg-red-100 text-red-600',
  ARCHIVED: 'bg-yellow-100 text-yellow-700',
}
const statusLabels: Record<string, string> = {
  ACTIVE: 'Активный', DRAFT: 'Черновик', SOLD_OUT: 'Нет мест', ARCHIVED: 'Архив',
}
const AVATAR_COLORS = ['#2B5BF0', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

function Stars({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          size={12}
          style={{ color: i < count ? '#F59E0B' : '#D1D5DB' }}
        />
      ))}
    </span>
  )
}

export default function ToursPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TourForm>(EMPTY_FORM)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  const { data, isLoading } = useQuery({
    queryKey: ['tours', page, search, statusFilter, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page), size: '12',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { category: categoryFilter }),
      })
      const res = await api.get(`/tours?${params}`)
      return res.data.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: TourForm) => api.post('/tours', {
      ...data,
      hotelStars: data.hotelStars ? Number(data.hotelStars) : null,
      durationDays: Number(data.durationDays),
      priceNetto: Number(data.priceNetto),
      priceBrutto: Number(data.priceBrutto),
      maxSeats: data.maxSeats ? Number(data.maxSeats) : null,
    }),
    onSuccess: () => {
      toast.success('Тур создан')
      queryClient.invalidateQueries({ queryKey: ['tours'] })
      closeModal()
    },
    onError: () => toast.error('Ошибка создания тура'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TourForm }) =>
      api.put(`/tours/${id}`, {
        ...data,
        hotelStars: data.hotelStars ? Number(data.hotelStars) : null,
        durationDays: Number(data.durationDays),
        priceNetto: Number(data.priceNetto),
        priceBrutto: Number(data.priceBrutto),
        maxSeats: data.maxSeats ? Number(data.maxSeats) : null,
      }),
    onSuccess: () => {
      toast.success('Тур обновлён')
      queryClient.invalidateQueries({ queryKey: ['tours'] })
      closeModal()
    },
    onError: () => toast.error('Ошибка обновления'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tours/${id}`),
    onSuccess: () => {
      toast.success('Тур удалён')
      queryClient.invalidateQueries({ queryKey: ['tours'] })
    },
    onError: () => toast.error('Ошибка удаления'),
  })

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(tour: Tour) {
    setForm({
      name: tour.name,
      country: tour.country,
      resort: tour.resort ?? '',
      hotelName: tour.hotelName ?? '',
      hotelStars: tour.hotelStars ? String(tour.hotelStars) : '',
      tourOperator: tour.tourOperator ?? '',
      category: tour.category,
      departureCity: tour.departureCity ?? '',
      durationDays: String(tour.durationDays),
      mealPlan: tour.mealPlan ?? 'AI',
      transport: tour.transport,
      priceNetto: String(tour.priceNetto),
      priceBrutto: String(tour.priceBrutto),
      currency: tour.currency,
      maxSeats: tour.maxSeats ? String(tour.maxSeats) : '',
      status: tour.status,
      departureDate: tour.departureDate ?? '',
      returnDate: tour.returnDate ?? '',
      visaRequired: tour.visaRequired,
      insuranceIncluded: tour.insuranceIncluded,
      notes: tour.notes ?? '',
      description: tour.description ?? '',
    })
    setEditingId(tour.id)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.country || !form.priceBrutto) {
      toast.error('Заполните обязательные поля')
      return
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const tours: Tour[] = data?.content ?? []
  const total = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#2B5BF0' }}>
            <AirplaneTakeOff01Icon size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1A2332' }}>Каталог туров</h1>
            <p className="text-xs" style={{ color: '#6B7A9A' }}>Управление турами и предложениями</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: '#E2E8F4' }}>
            <button
              onClick={() => setViewMode('table')}
              className="px-3 py-2 text-sm font-medium transition-colors"
              style={{
                background: viewMode === 'table' ? '#2B5BF0' : '#fff',
                color: viewMode === 'table' ? '#fff' : '#6B7A9A',
              }}
            >
              Таблица
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className="px-3 py-2 text-sm font-medium transition-colors"
              style={{
                background: viewMode === 'grid' ? '#2B5BF0' : '#fff',
                color: viewMode === 'grid' ? '#fff' : '#6B7A9A',
              }}
            >
              Карточки
            </button>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#2B5BF0' }}
          >
            <Add01Icon size={16} />
            Новый тур
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 flex flex-wrap gap-3 items-center" style={{ border: '1px solid #E2E8F4' }}>
        <div className="flex items-center gap-2 flex-1 min-w-48 bg-gray-50 rounded-xl px-3 py-2" style={{ border: '1px solid #E2E8F4' }}>
          <Search01Icon size={16} style={{ color: '#6B7A9A' }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="Поиск по названию, стране, курорту..."
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
            <option value="ACTIVE">Активные</option>
            <option value="DRAFT">Черновики</option>
            <option value="SOLD_OUT">Нет мест</option>
            <option value="ARCHIVED">Архив</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(0) }}
            className="text-sm border rounded-xl px-3 py-2 bg-white outline-none"
            style={{ borderColor: '#E2E8F4', color: '#1A2332' }}
          >
            <option value="">Все категории</option>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <span className="text-sm ml-auto" style={{ color: '#6B7A9A' }}>
          Найдено: <strong style={{ color: '#1A2332' }}>{total}</strong>
        </span>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1px solid #E2E8F4' }}>
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
        </div>
      ) : !tours.length ? (
        <div className="bg-white rounded-2xl p-16 text-center" style={{ border: '1px solid #E2E8F4' }}>
          <AirplaneTakeOff01Icon size={48} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
          <p className="font-medium" style={{ color: '#1A2332' }}>Туры не найдены</p>
          <p className="text-sm mt-1" style={{ color: '#6B7A9A' }}>Добавьте первый тур в каталог</p>
          <button
            onClick={openCreate}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#2B5BF0' }}
          >
            Добавить тур
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tours.map((tour, idx) => (
            <div
              key={tour.id}
              className="bg-white rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
              style={{ border: '1px solid #E2E8F4' }}
            >
              {/* Card header */}
              <div
                className="h-28 flex items-end p-4"
                style={{ background: `linear-gradient(135deg, ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}33, ${AVATAR_COLORS[(idx + 2) % AVATAR_COLORS.length]}55)` }}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg text-white" style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
                    {categoryLabels[tour.category] ?? tour.category}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${statusColors[tour.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[tour.status] ?? tour.status}
                  </span>
                </div>
              </div>
              {/* Card body */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-sm leading-tight" style={{ color: '#1A2332' }}>{tour.name}</h3>
                  {tour.hotelName && (
                    <p className="text-xs mt-0.5" style={{ color: '#6B7A9A' }}>{tour.hotelName}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: '#6B7A9A' }}>
                  <span className="flex items-center gap-1">
                    <Location01Icon size={12} />
                    {tour.country}{tour.resort ? `, ${tour.resort}` : ''}
                  </span>
                  {tour.hotelStars ? <Stars count={tour.hotelStars} /> : null}
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: '#6B7A9A' }}>
                  <span className="flex items-center gap-1">
                    <Calendar01Icon size={12} />
                    {tour.durationDays} дн.
                  </span>
                  <span>{transportLabels[tour.transport] ?? tour.transport}</span>
                  {tour.mealPlan && <span>{mealLabels[tour.mealPlan] ?? tour.mealPlan}</span>}
                </div>
                {tour.maxSeats && (
                  <div className="flex items-center gap-1 text-xs" style={{ color: '#6B7A9A' }}>
                    <UserGroupIcon size={12} />
                    <span>Мест: {tour.maxSeats - tour.bookedSeats}/{tour.maxSeats}</span>
                    <div className="flex-1 h-1.5 rounded-full ml-1" style={{ background: '#E2E8F4' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(tour.bookedSeats / tour.maxSeats) * 100}%`,
                          background: tour.bookedSeats >= tour.maxSeats ? '#EF4444' : '#2B5BF0',
                        }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-lg font-bold" style={{ color: '#1A2332' }}>
                      {formatCurrency(tour.priceBrutto)} <span className="text-xs font-normal" style={{ color: '#6B7A9A' }}>{tour.currency}</span>
                    </p>
                    {tour.priceNetto > 0 && (
                      <p className="text-xs" style={{ color: '#6B7A9A' }}>
                        нетто: {formatCurrency(tour.priceNetto)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(tour)}
                      className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      style={{ color: '#2B5BF0' }}
                    >
                      <Edit01Icon size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Удалить тур?')) deleteMutation.mutate(tour.id)
                      }}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                      style={{ color: '#EF4444' }}
                    >
                      <Delete01Icon size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F4' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F8F9FE' }}>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7A9A' }}>Тур</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7A9A' }}>Страна / Курорт</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7A9A' }}>Категория</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7A9A' }}>Длит.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7A9A' }}>Цена</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7A9A' }}>Места</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7A9A' }}>Статус</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#F1F3F9' }}>
                {tours.map((tour) => (
                  <tr key={tour.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#1A2332' }}>{tour.name}</p>
                        {tour.hotelName && (
                          <p className="text-xs mt-0.5" style={{ color: '#6B7A9A' }}>{tour.hotelName} {tour.hotelStars ? <span className="text-yellow-500">{'★'.repeat(tour.hotelStars)}</span> : ''}</p>
                        )}
                        {tour.tourOperator && (
                          <p className="text-xs" style={{ color: '#6B7A9A' }}>{tour.tourOperator}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: '#1A2332' }}>
                      <span className="flex items-center gap-1">
                        <Location01Icon size={13} style={{ color: '#6B7A9A' }} />
                        {tour.country}{tour.resort ? `, ${tour.resort}` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: '#EEF0F8', color: '#2B5BF0' }}>
                        {categoryLabels[tour.category] ?? tour.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: '#1A2332' }}>
                      {tour.durationDays} дн.
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold" style={{ color: '#1A2332' }}>
                        {formatCurrency(tour.priceBrutto)}
                      </p>
                      <p className="text-xs" style={{ color: '#6B7A9A' }}>
                        нетто: {formatCurrency(tour.priceNetto)}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: '#6B7A9A' }}>
                      {tour.maxSeats ? `${tour.maxSeats - tour.bookedSeats}/${tour.maxSeats}` : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${statusColors[tour.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[tour.status] ?? tour.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(tour)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          style={{ color: '#2B5BF0' }}
                        >
                          <Edit01Icon size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Удалить тур?')) deleteMutation.mutate(tour.id)
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 flex items-center justify-between border-t" style={{ borderColor: '#E2E8F4' }}>
              <p className="text-sm" style={{ color: '#6B7A9A' }}>
                Страница {page + 1} из {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40"
                  style={{ borderColor: '#E2E8F4' }}
                >
                  Назад
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40"
                  style={{ borderColor: '#E2E8F4' }}
                >
                  Вперёд
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div
            className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            style={{ border: '1px solid #E2E8F4' }}
          >
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between z-10" style={{ borderColor: '#E2E8F4' }}>
              <h2 className="text-base font-bold" style={{ color: '#1A2332' }}>
                {editingId ? 'Редактировать тур' : 'Новый тур'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Название тура *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ borderColor: '#E2E8F4' }}
                  placeholder="Турция - Belek 5* | 7 ночей"
                />
              </div>

              {/* Country / Resort */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Страна *</label>
                  <input
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                    placeholder="Турция"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Курорт</label>
                  <input
                    value={form.resort}
                    onChange={(e) => setForm({ ...form, resort: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                    placeholder="Белек"
                  />
                </div>
              </div>

              {/* Hotel */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Отель</label>
                  <input
                    value={form.hotelName}
                    onChange={(e) => setForm({ ...form, hotelName: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                    placeholder="Voyage Belek"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Звёздность</label>
                  <select
                    value={form.hotelStars}
                    onChange={(e) => setForm({ ...form, hotelStars: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                  >
                    <option value="">—</option>
                    <option value="1">1★</option>
                    <option value="2">2★</option>
                    <option value="3">3★</option>
                    <option value="4">4★</option>
                    <option value="5">5★</option>
                  </select>
                </div>
              </div>

              {/* Tour operator / Departure */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Туроператор</label>
                  <input
                    value={form.tourOperator}
                    onChange={(e) => setForm({ ...form, tourOperator: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                    placeholder="Tez Tour"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Город вылета</label>
                  <input
                    value={form.departureCity}
                    onChange={(e) => setForm({ ...form, departureCity: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                    placeholder="Алматы"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Дата вылета</label>
                  <input
                    type="date"
                    value={form.departureDate}
                    onChange={(e) => setForm({ ...form, departureDate: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Дата возврата</label>
                  <input
                    type="date"
                    value={form.returnDate}
                    onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                  />
                </div>
              </div>

              {/* Category / Transport / Duration */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Категория</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                  >
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Транспорт</label>
                  <select
                    value={form.transport}
                    onChange={(e) => setForm({ ...form, transport: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                  >
                    {Object.entries(transportLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Длительность (дн.)</label>
                  <input
                    type="number"
                    value={form.durationDays}
                    onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                    min="1"
                  />
                </div>
              </div>

              {/* Meal / Max Seats */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Питание</label>
                  <select
                    value={form.mealPlan}
                    onChange={(e) => setForm({ ...form, mealPlan: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                  >
                    {Object.entries(mealLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Кол-во мест</label>
                  <input
                    type="number"
                    value={form.maxSeats}
                    onChange={(e) => setForm({ ...form, maxSeats: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                    placeholder="Без ограничений"
                    min="1"
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Цена нетто *</label>
                  <input
                    type="number"
                    value={form.priceNetto}
                    onChange={(e) => setForm({ ...form, priceNetto: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Цена брутто *</label>
                  <input
                    type="number"
                    value={form.priceBrutto}
                    onChange={(e) => setForm({ ...form, priceBrutto: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    style={{ borderColor: '#E2E8F4' }}
                    placeholder="0"
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

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Статус</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-200"
                  style={{ borderColor: '#E2E8F4' }}
                >
                  <option value="ACTIVE">Активный</option>
                  <option value="DRAFT">Черновик</option>
                  <option value="SOLD_OUT">Нет мест</option>
                  <option value="ARCHIVED">Архив</option>
                </select>
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.visaRequired}
                    onChange={(e) => setForm({ ...form, visaRequired: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm" style={{ color: '#1A2332' }}>Нужна виза</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.insuranceIncluded}
                    onChange={(e) => setForm({ ...form, insuranceIncluded: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm" style={{ color: '#1A2332' }}>Страховка включена</span>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Примечание</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                  style={{ borderColor: '#E2E8F4' }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                  style={{ borderColor: '#E2E8F4', color: '#6B7A9A' }}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: '#2B5BF0' }}
                >
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
