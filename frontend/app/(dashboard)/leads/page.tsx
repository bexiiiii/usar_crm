'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import PageHeader from '@/components/layout/PageHeader'
import { Lead } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Calendar, Users, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'

const STAGES = [
  { key: 'NEW',           label: 'Новый',         color: 'bg-blue-50 border-blue-200' },
  { key: 'CONTACTED',     label: 'Контакт',        color: 'bg-yellow-50 border-yellow-200' },
  { key: 'PROPOSAL_SENT', label: 'КП отправлено', color: 'bg-orange-50 border-orange-200' },
  { key: 'NEGOTIATION',   label: 'Переговоры',    color: 'bg-indigo-50 border-indigo-200' },
  { key: 'WON',           label: 'Успешно',        color: 'bg-green-50 border-green-200' },
  { key: 'LOST',          label: 'Отказ',          color: 'bg-red-50 border-red-200' },
]

const STAGE_HEADER_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500',
  CONTACTED: 'bg-yellow-500',
  PROPOSAL_SENT: 'bg-orange-500',
  NEGOTIATION: 'bg-indigo-500',
  WON: 'bg-green-500',
  LOST: 'bg-red-500',
}

function LeadCard({ lead, onStageChange }: { lead: Lead; onStageChange: (id: string, stage: string) => void }) {
  const daysSince = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold text-gray-900 leading-snug">{lead.title}</p>
        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{daysSince}д</span>
      </div>

      {lead.clientName && (
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Users size={12} />
          <span>{lead.clientName}</span>
        </div>
      )}

      {lead.destination && (
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Calendar size={12} />
          <span>{lead.destination}</span>
          {lead.travelDatesFrom && <span>· {formatDate(lead.travelDatesFrom)}</span>}
        </div>
      )}

      {(lead.budgetMin || lead.budgetMax) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <DollarSign size={12} />
          <span>
            {lead.budgetMin ? formatCurrency(lead.budgetMin) : '—'}
            {' — '}
            {lead.budgetMax ? formatCurrency(lead.budgetMax) : '—'}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        {lead.assignedManagerName && (
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs flex-shrink-0">
            {lead.assignedManagerName.charAt(0)}
          </div>
        )}
        <div className="text-xs text-gray-400 ml-auto">
          {lead.paxAdults}+{lead.paxChildren} чел.
        </div>
      </div>

      {/* Quick stage change */}
      <select
        value={lead.stage}
        onChange={(e) => onStageChange(lead.id, e.target.value)}
        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
        onClick={(e) => e.stopPropagation()}
      >
        {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
      </select>
    </div>
  )
}

export default function LeadsPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data: leads, isLoading } = useQuery<{ content: Lead[] }>({
    queryKey: ['leads'],
    queryFn: async () => {
      const res = await api.get('/leads?size=200&sort=createdAt,desc')
      return res.data.data
    },
  })

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      api.patch(`/leads/${id}/stage`, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Статус обновлён')
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/leads', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Лид создан')
      setShowModal(false)
    },
  })

  const { register, handleSubmit, reset } = useForm()

  const byStage = (stage: string) =>
    leads?.content?.filter((l) => l.stage === stage) ?? []

  return (
    <div>
      <PageHeader
        title="Лиды"
        subtitle={`Всего: ${leads?.content?.length ?? 0}`}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Создать лид
          </button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {STAGES.map((s) => (
            <div key={s.key} className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded-xl mb-3" />
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto">
          {STAGES.map((stage) => {
            const stagLeads = byStage(stage.key)
            return (
              <div key={stage.key} className="min-w-[200px]">
                {/* Column header */}
                <div className={`${STAGE_HEADER_COLORS[stage.key]} rounded-xl px-3 py-2 mb-3 flex items-center justify-between`}>
                  <span className="text-white text-sm font-semibold">{stage.label}</span>
                  <span className="bg-white/25 text-white text-xs rounded-full px-2 py-0.5">{stagLeads.length}</span>
                </div>

                {/* Cards */}
                <div className="space-y-3 min-h-[100px]">
                  {stagLeads.length === 0 && (
                    <p className="text-gray-400 text-xs text-center py-6">Лидов нет</p>
                  )}
                  {stagLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onStageChange={(id, stage) => stageMutation.mutate({ id, stage })}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Создать лид</h2>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                <input {...register('title', { required: true })} placeholder="Тур в Турцию, июль, 2 взрослых" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Направление</label>
                  <input {...register('destination')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Источник</label>
                  <input {...register('source')} placeholder="instagram, website..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Бюджет от</label>
                  <input {...register('budgetMin')} type="number" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Бюджет до</label>
                  <input {...register('budgetMax')} type="number" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
                <textarea {...register('notes')} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
