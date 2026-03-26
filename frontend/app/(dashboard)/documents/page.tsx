'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  File01Icon,
  Search01Icon,
  Add01Icon,
  Download01Icon,
  Delete01Icon,
  FilterIcon,
  Calendar01Icon,
  UserGroupIcon,
  Ticket01Icon,
  Upload01Icon,
} from 'hugeicons-react'

interface Doc {
  id: string
  type: string
  fileName: string
  filePath: string | null
  clientId: string | null
  clientName: string | null
  bookingId: string | null
  bookingNumber: string | null
  generatedAt: string
  generatedByName: string | null
}

const DOC_TYPES: Record<string, { label: string; color: string }> = {
  CONTRACT: { label: 'Договор', color: '#2B5BF0' },
  VOUCHER: { label: 'Ваучер', color: '#22C55E' },
  INVOICE: { label: 'Счёт', color: '#F59E0B' },
  PASSPORT_SCAN: { label: 'Паспорт', color: '#8B5CF6' },
  VISA: { label: 'Виза', color: '#06B6D4' },
  INSURANCE: { label: 'Страховка', color: '#EF4444' },
  TICKET: { label: 'Билет', color: '#0EA5E9' },
  OTHER: { label: 'Другое', color: '#9CA3AF' },
}

const fileExtIcon: Record<string, string> = {
  pdf: '📄', jpg: '🖼', jpeg: '🖼', png: '🖼', doc: '📝', docx: '📝',
  xls: '📊', xlsx: '📊', zip: '🗜',
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return <span className="text-xl">{fileExtIcon[ext] ?? '📄'}</span>
}

export default function DocumentsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [docForm, setDocForm] = useState({
    type: 'CONTRACT', clientId: '', bookingId: '', notes: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['documents', page, search, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page), size: '20',
        ...(search && { search }),
        ...(typeFilter && { type: typeFilter }),
      })
      const res = await api.get(`/documents?${params}`)
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

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error('No file')
      const fd = new FormData()
      fd.append('file', uploadFile)
      fd.append('type', docForm.type)
      if (docForm.clientId) fd.append('clientId', docForm.clientId)
      if (docForm.bookingId) fd.append('bookingId', docForm.bookingId)
      const res = await api.post('/documents/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
    onSuccess: () => {
      toast.success('Документ загружен')
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      setShowModal(false)
      setUploadFile(null)
    },
    onError: () => toast.error('Ошибка загрузки файла'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      toast.success('Документ удалён')
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: () => toast.error('Ошибка удаления'),
  })

  const generateMutation = useMutation({
    mutationFn: ({ bookingId, type }: { bookingId: string; type: string }) =>
      api.post(`/documents/generate?bookingId=${encodeURIComponent(bookingId)}&type=${encodeURIComponent(type)}`),
    onSuccess: () => {
      toast.success('Документ сгенерирован')
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: () => toast.error('Ошибка генерации'),
  })

  const docs: Doc[] = data?.content ?? []
  const total = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 1

  // Type counts
  const typeCounts = Object.keys(DOC_TYPES).reduce((acc, t) => {
    acc[t] = docs.filter((d) => d.type === t).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#2B5BF0' }}>
            <File01Icon size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1A2332' }}>Документы</h1>
            <p className="text-xs" style={{ color: '#6B7A9A' }}>Управление документами и файлами</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: '#2B5BF0' }}
        >
          <Upload01Icon size={16} />
          Загрузить документ
        </button>
      </div>

      {/* Type quick filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter('')}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors"
          style={{
            borderColor: typeFilter === '' ? '#2B5BF0' : '#E2E8F4',
            background: typeFilter === '' ? '#EEF0F8' : '#fff',
            color: typeFilter === '' ? '#2B5BF0' : '#6B7A9A',
          }}
        >
          Все ({total})
        </button>
        {Object.entries(DOC_TYPES).map(([key, { label, color }]) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key === typeFilter ? '' : key)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors"
            style={{
              borderColor: typeFilter === key ? color : '#E2E8F4',
              background: typeFilter === key ? `${color}18` : '#fff',
              color: typeFilter === key ? color : '#6B7A9A',
            }}
          >
            {label} ({typeCounts[key] ?? 0})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 flex flex-wrap gap-3 items-center" style={{ border: '1px solid #E2E8F4' }}>
        <div className="flex items-center gap-2 flex-1 min-w-48 bg-gray-50 rounded-xl px-3 py-2" style={{ border: '1px solid #E2E8F4' }}>
          <Search01Icon size={16} style={{ color: '#6B7A9A' }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="Поиск по имени файла, клиенту..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: '#1A2332' }}
          />
        </div>
        <span className="text-sm" style={{ color: '#6B7A9A' }}>
          Найдено: <strong style={{ color: '#1A2332' }}>{total}</strong>
        </span>
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1px solid #E2E8F4' }}>
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
        </div>
      ) : !docs.length ? (
        <div className="bg-white rounded-2xl p-16 text-center" style={{ border: '1px solid #E2E8F4' }}>
          <File01Icon size={48} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
          <p className="font-medium" style={{ color: '#1A2332' }}>Документы не найдены</p>
          <p className="text-sm mt-1" style={{ color: '#6B7A9A' }}>Загрузите первый документ или сгенерируйте из бронирования</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {docs.map((doc) => {
            const docType = DOC_TYPES[doc.type] ?? { label: doc.type, color: '#9CA3AF' }
            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl p-5 hover:shadow-md transition-shadow"
                style={{ border: '1px solid #E2E8F4' }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                    style={{ background: `${docType.color}18` }}
                  >
                    <FileIcon name={doc.fileName} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#1A2332' }}>{doc.fileName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-lg font-medium"
                        style={{ background: `${docType.color}18`, color: docType.color }}
                      >
                        {docType.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  {doc.clientName && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6B7A9A' }}>
                      <UserGroupIcon size={12} />
                      <span>{doc.clientName}</span>
                    </div>
                  )}
                  {doc.bookingNumber && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6B7A9A' }}>
                      <Ticket01Icon size={12} />
                      <span>Бронь #{doc.bookingNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6B7A9A' }}>
                    <Calendar01Icon size={12} />
                    <span>{formatDate(doc.generatedAt)}</span>
                    {doc.generatedByName && <span>• {doc.generatedByName}</span>}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => toast('Функция скачивания будет доступна после настройки хранилища')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-colors hover:bg-gray-50"
                    style={{ borderColor: '#E2E8F4', color: '#6B7A9A' }}
                  >
                    <Download01Icon size={13} />
                    Скачать
                  </button>
                  <button
                    onClick={() => { if (confirm('Удалить документ?')) deleteMutation.mutate(doc.id) }}
                    className="p-2 rounded-xl border hover:bg-red-50 transition-colors"
                    style={{ borderColor: '#E2E8F4', color: '#EF4444' }}
                  >
                    <Delete01Icon size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: '#6B7A9A' }}>Страница {page + 1} из {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40" style={{ borderColor: '#E2E8F4' }}>Назад</button>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40" style={{ borderColor: '#E2E8F4' }}>Вперёд</button>
          </div>
        </div>
      )}

      {/* Generate section */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E2E8F4' }}>
        <h3 className="text-base font-bold mb-4" style={{ color: '#1A2332' }}>Генерация документов из бронирования</h3>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { type: 'CONTRACT', label: 'Договор с туристом', color: '#2B5BF0' },
            { type: 'VOUCHER', label: 'Ваучер для отеля', color: '#22C55E' },
            { type: 'INVOICE', label: 'Счёт на оплату', color: '#F59E0B' },
            { type: 'TOURIST_MEMO', label: 'Памятка туриста', color: '#8B5CF6' },
          ].map((tmpl) => (
            <button
              key={tmpl.type}
              onClick={() => {
                const bookingId = prompt('Введите ID бронирования:')
                if (bookingId) generateMutation.mutate({ bookingId, type: tmpl.type })
              }}
              className="p-4 rounded-xl text-left hover:shadow-md transition-shadow"
              style={{ background: `${tmpl.color}0D`, border: `1px solid ${tmpl.color}33` }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${tmpl.color}18` }}>
                <File01Icon size={16} style={{ color: tmpl.color }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: '#1A2332' }}>{tmpl.label}</p>
              <p className="text-xs mt-0.5" style={{ color: '#6B7A9A' }}>Автозаполнение</p>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl" style={{ border: '1px solid #E2E8F4' }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F4' }}>
              <h2 className="text-base font-bold" style={{ color: '#1A2332' }}>Загрузить документ</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {/* File drop zone */}
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: uploadFile ? '#2B5BF0' : '#E2E8F4' }}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <input
                  id="fileInput"
                  type="file"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                />
                {uploadFile ? (
                  <div>
                    <FileIcon name={uploadFile.name} />
                    <p className="text-sm font-medium mt-2" style={{ color: '#1A2332' }}>{uploadFile.name}</p>
                    <p className="text-xs" style={{ color: '#6B7A9A' }}>
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload01Icon size={32} style={{ color: '#CBD5E1', margin: '0 auto 8px' }} />
                    <p className="text-sm font-medium" style={{ color: '#6B7A9A' }}>Кликните или перетащите файл</p>
                    <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>PDF, JPEG, PNG, DOC, XLS до 10 MB</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Тип документа</label>
                <select
                  value={docForm.type}
                  onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-200"
                  style={{ borderColor: '#E2E8F4' }}
                >
                  {Object.entries(DOC_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Клиент</label>
                <select
                  value={docForm.clientId}
                  onChange={(e) => setDocForm({ ...docForm, clientId: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-200"
                  style={{ borderColor: '#E2E8F4' }}
                >
                  <option value="">Не указан</option>
                  {(clientsList ?? []).map((c: { id: string; fullName: string }) => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Бронирование</label>
                <select
                  value={docForm.bookingId}
                  onChange={(e) => setDocForm({ ...docForm, bookingId: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-200"
                  style={{ borderColor: '#E2E8F4' }}
                >
                  <option value="">Не привязано</option>
                  {(bookingsList ?? []).map((b: { id: string; bookingNumber: string; destination: string }) => (
                    <option key={b.id} value={b.id}>#{b.bookingNumber} — {b.destination}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: '#E2E8F4', color: '#6B7A9A' }}>
                  Отмена
                </button>
                <button
                  type="button"
                  disabled={!uploadFile || uploadMutation.isPending}
                  onClick={() => uploadMutation.mutate()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: '#2B5BF0' }}
                >
                  {uploadMutation.isPending ? 'Загрузка...' : 'Загрузить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
