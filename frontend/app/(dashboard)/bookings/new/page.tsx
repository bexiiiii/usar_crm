'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import PageHeader from '@/components/layout/PageHeader'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { Client } from '@/types'

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
  currency: z.string().default('USD'),
  supplierPaymentDeadline: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const STEPS = ['Клиент', 'Детали', 'Цена', 'Подтверждение']

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
  const [step, setStep] = useState(0)
  const [clientSearch, setClientSearch] = useState('')

  const { data: clientsData } = useQuery<{ content: Client[] }>({
    queryKey: ['clients', 'search', clientSearch],
    queryFn: async () => {
      const res = await api.get(`/clients?search=${clientSearch}&size=10`)
      return res.data.data
    },
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paxAdults: 1, paxChildren: 0, currency: 'USD' },
  })

  const watchedClientId = watch('clientId')
  const selectedClient = clientsData?.content?.find((c) => c.id === watchedClientId)

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/bookings', data),
    onSuccess: (res) => {
      toast.success('Бронь создана успешно')
      router.push(`/bookings/${res.data.data.id}`)
    },
  })

  const formValues = watch()

  return (
    <div>
      <PageHeader
        title="Новая бронь"
        actions={
          <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            <ArrowLeft size={16} />
            Назад
          </button>
        }
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {i < step ? <Check size={14} /> : i + 1}
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
                {clientsData.content.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-6">Клиентов не найдено</p>
                )}
                {clientsData.content.map((client) => (
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
                    {watchedClientId === client.id && <Check size={16} className="ml-auto text-blue-600" />}
                  </div>
                ))}
              </div>
            )}
            {errors.clientId && <p className="text-red-500 text-sm">{errors.clientId.message}</p>}
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
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="RUB">RUB</option>
                <option value="KZT">KZT</option>
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
            <ArrowLeft size={16} />
            Назад
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700"
            >
              Далее
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit((d) => createMutation.mutate(d))}
              disabled={createMutation.isPending}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              <Check size={16} />
              {createMutation.isPending ? 'Создание...' : 'Создать бронь'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
