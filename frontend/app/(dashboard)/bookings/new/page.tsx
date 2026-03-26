'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import PageHeader from '@/components/layout/PageHeader'
import { ArrowLeft01Icon, ArrowRight01Icon, Tick01Icon, AirplaneTakeOff01Icon, UserAdd01Icon, Cancel01Icon } from 'hugeicons-react'
import toast from 'react-hot-toast'
import { Client, Tour } from '@/types'

const schema = z.object({
  clientId: z.string().min(1, 'Выберите клиента'),
  type: z.string().min(1, 'Выберите тип'),
  destination: z.string().min(1, 'Введите направление'),
  country: z.string().optional(),
  departureCity: z.string().optional(),
  departureDate: z.string().min(1, 'Введите дату вылета'),
  returnDate: z.string().optional(),
  paxAdults: z.coerce.number().min(1),
  paxChildren: z.coerce.number().min(0),
  hotelName: z.string().optional(),
  hotelStars: z.coerce.number().optional(),
  mealPlan: z.string().optional(),
  tourOperator: z.string().optional(),
  totalPrice: z.coerce.number().min(0.01, 'Введите стоимость'),
  costPrice: z.coerce.number().optional(),
  currency: z.string().default('KZT'),
  supplierPaymentDeadline: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const STEPS = ['Клиент', 'Детали', 'Подтверждение']

const typeOptions = [
  { value: 'TOUR', label: 'Тур' },
  { value: 'HOTEL', label: 'Отель' },
  { value: 'FLIGHT', label: 'Авиа' },
  { value: 'TRANSFER', label: 'Трансфер' },
  { value: 'VISA', label: 'Виза' },
  { value: 'INSURANCE', label: 'Страховка' },
  { value: 'CUSTOM', label: 'Другое' },
]

const mealOptions = [
  { value: '', label: 'Без питания' },
  { value: 'BB', label: 'Завтрак' },
  { value: 'HB', label: 'Полупансион' },
  { value: 'FB', label: 'Полный пансион' },
  { value: 'AI', label: 'Всё включено' },
]

export default function NewBookingPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(0)
  const [clientSearch, setClientSearch] = useState('')
  const [selectedTourId, setSelectedTourId] = useState<string>('')
  const [showCreateClient, setShowCreateClient] = useState(false)
  const [selectedClientData, setSelectedClientData] = useState<Client | null>(null)
  const { register: regClient, handleSubmit: handleClientSubmit, reset: resetClient, formState: { errors: clientErrors } } = useForm()

  const { data: clientsData } = useQuery<{ content: Client[] }>({
    queryKey: ['clients', 'search', clientSearch],
    queryFn: async () => {
      const res = await api.get(`/clients?search=${clientSearch}&size=10`)
      return res.data.data
    },
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paxAdults: 1, paxChildren: 0, currency: 'KZT' },
  })

  const watchedClientId = watch('clientId')
  const selectedClient = selectedClientData || clientsData?.content?.find((c) => c.id === watchedClientId)

  const { data: toursData } = useQuery<{ content: Tour[] }>({
    queryKey: ['tours', 'active'],
    queryFn: async () => {
      const res = await api.get('/tours?status=ACTIVE&size=100')
      return res.data.data
    },
    enabled: !!watchedClientId,
  })

  const handleTourSelect = (tourId: string) => {
    setSelectedTourId(tourId)
    if (!tourId) return
    const tour = toursData?.content?.find((t) => t.id === tourId)
    if (!tour) return
    setValue('destination', tour.country + (tour.resort ? `, ${tour.resort}` : ''))
    setValue('hotelName', tour.hotelName ?? '')
    setValue('hotelStars', tour.hotelStars ?? 0)
    setValue('mealPlan', tour.mealPlan ?? '')
    setValue('tourOperator', tour.tourOperator ?? '')
    setValue('departureDate', tour.departureDate ?? '')
    setValue('returnDate', tour.returnDate ?? '')
    setValue('totalPrice', tour.priceBrutto)
    setValue('departureCity', tour.departureCity ?? '')
    setValue('type', 'TOUR')
    setValue('currency', tour.currency)
  }

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/bookings', data),
    onSuccess: (res) => {
      toast.success('Бронь создана успешно')
      router.push(`/bookings/${res.data.data.id}`)
    },
  })

  const createClientMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/clients', data),
    onSuccess: (res) => {
      toast.success('Клиент создан')
      const newClient: Client = res.data.data
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setClientSearch(newClient.fullName)
      setValue('clientId', newClient.id)
      setSelectedClientData(newClient)
      setShowCreateClient(false)
      resetClient()
    },
    onError: () => toast.error('Ошибка при создании клиента'),
  })

  const formValues = watch()

  return (
    <div>
      <PageHeader
        title="Новая бронь"
        actions={
          <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            <ArrowLeft01Icon size={16} />
            Назад
          </button>
        }
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {i < step ? <Tick01Icon size={14} /> : i + 1}
            </div>
            <span className={`text-sm font-medium ${i === step ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* Step 1: Client */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Выберите клиента</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Поиск клиента</label>
              <input
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Введите имя или телефон..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {clientsData?.content && (
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {clientsData.content.length === 0 ? (
                  <div className="py-8 text-center space-y-3">
                    <p className="text-gray-500 text-sm">Клиент не найден</p>
                    <button
                      type="button"
                      onClick={() => setShowCreateClient(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
                    >
                      <UserAdd01Icon size={16} />
                      Создать клиента
                    </button>
                  </div>
                ) : (
                  clientsData.content.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => setValue('clientId', client.id)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${watchedClientId === client.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                        {client.firstName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{client.fullName}</p>
                        <p className="text-xs text-gray-500">{client.phone}</p>
                      </div>
                      {watchedClientId === client.id && <Tick01Icon size={16} className="ml-auto text-blue-600" />}
                    </div>
                  ))
                )}
              </div>
            )}
            {clientSearch && !showCreateClient && clientsData?.content && clientsData.content.length > 0 && (
              <button
                type="button"
                onClick={() => setShowCreateClient(true)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mt-1"
              >
                <UserAdd01Icon size={14} />
                Нет нужного клиента? Создать нового
              </button>
            )}
            {errors.clientId && <p className="text-red-500 text-sm">{errors.clientId.message}</p>}

            {/* Inline create client form */}
            {showCreateClient && (
              <div className="mt-3 border border-blue-200 rounded-xl bg-blue-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Новый клиент</p>
                  <button type="button" onClick={() => { setShowCreateClient(false); resetClient() }} className="p-1 rounded text-gray-400 hover:bg-gray-100">
                    <Cancel01Icon size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Имя *</label>
                    <input {...regClient('firstName', { required: true })} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${clientErrors.firstName ? 'border-red-400' : 'border-gray-200'}`} placeholder="Иван" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Фамилия *</label>
                    <input {...regClient('lastName', { required: true })} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${clientErrors.lastName ? 'border-red-400' : 'border-gray-200'}`} placeholder="Иванов" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Телефон *</label>
                    <input {...regClient('phone', { required: true })} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${clientErrors.phone ? 'border-red-400' : 'border-gray-200'}`} placeholder="+7 999 123 45 67" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Источник</label>
                    <input {...regClient('source')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Instagram..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Статус</label>
                    <select {...regClient('status')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="NEW">Новый</option>
                      <option value="ACTIVE">Активный</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => { setShowCreateClient(false); resetClient() }} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Отмена</button>
                  <button
                    type="button"
                    disabled={createClientMutation.isPending}
                    onClick={() => handleClientSubmit((d) => createClientMutation.mutate(d))()}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createClientMutation.isPending ? 'Сохранение...' : 'Создать и выбрать'}
                  </button>
                </div>
              </div>
            )}

            {watchedClientId && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <AirplaneTakeOff01Icon size={16} className="text-blue-500" />
                  Выбрать тур (необязательно)
                </label>
                <select
                  value={selectedTourId}
                  onChange={(e) => handleTourSelect(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Не выбирать тур</option>
                  {toursData?.content?.map((tour) => (
                    <option key={tour.id} value={tour.id}>
                      {tour.name} — {tour.country} — ${tour.priceBrutto} {tour.currency}
                    </option>
                  ))}
                </select>
                {selectedTourId && (
                  <p className="text-xs text-blue-600 mt-1">Поля бронирования заполнены из выбранного тура. Вы можете изменить их на следующем шаге.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Booking details */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h2 className="text-lg font-semibold text-gray-900 md:col-span-2 mb-2">Детали бронирования</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип *</label>
              <select {...register('type')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Выберите...</option>
                {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Направление *</label>
              <input {...register('destination')} placeholder="Турция, Анталья" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.destination && <p className="text-red-500 text-xs mt-1">{errors.destination.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Страна</label>
              <input {...register('country')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Город вылета</label>
              <input {...register('departureCity')} placeholder="Москва" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата вылета *</label>
              <input {...register('departureDate')} type="date" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.departureDate && <p className="text-red-500 text-xs mt-1">{errors.departureDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата возврата</label>
              <input {...register('returnDate')} type="date" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Взрослых</label>
              <input {...register('paxAdults')} type="number" min={1} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Детей</label>
              <input {...register('paxChildren')} type="number" min={0} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Отель</label>
              <input {...register('hotelName')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Питание</label>
              <select {...register('mealPlan')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {mealOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тур-оператор</label>
              <input {...register('tourOperator')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
              <textarea {...register('notes')} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h2 className="text-lg font-semibold text-gray-900 md:col-span-2 mb-2">Стоимость</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Стоимость *</label>
              <input {...register('totalPrice')} type="number" step="0.01" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.totalPrice && <p className="text-red-500 text-xs mt-1">{errors.totalPrice.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Себестоимость</label>
              <input {...register('costPrice')} type="number" step="0.01" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Валюта</label>
              <select {...register('currency')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="KZT">KZT — Тенге</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="RUB">RUB</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Срок оплаты поставщику</label>
              <input {...register('supplierPaymentDeadline')} type="date" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Подтверждение</h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Клиент:</span> <span className="font-medium">{selectedClient?.fullName || formValues.clientId}</span></div>
                <div><span className="text-gray-500">Тип:</span> <span className="font-medium">{typeOptions.find(o => o.value === formValues.type)?.label}</span></div>
                <div><span className="text-gray-500">Направление:</span> <span className="font-medium">{formValues.destination}</span></div>
                <div><span className="text-gray-500">Вылет:</span> <span className="font-medium">{formValues.departureDate}</span></div>
                <div><span className="text-gray-500">Пассажиры:</span> <span className="font-medium">{formValues.paxAdults} взр. + {formValues.paxChildren} дет.</span></div>
                <div><span className="text-gray-500">Стоимость:</span> <span className="font-medium text-blue-600">{formValues.totalPrice} {formValues.currency}</span></div>
              </div>
            </div>
            {createMutation.isError && (
              <p className="text-red-500 text-sm">Ошибка при сохранении. Проверьте данные.</p>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowLeft01Icon size={16} />
            Назад
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700"
            >
              Далее
              <ArrowRight01Icon size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit((d) => createMutation.mutate(d))}
              disabled={createMutation.isPending}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              <Tick01Icon size={16} />
              {createMutation.isPending ? 'Создание...' : 'Создать бронь'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
