'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import PageHeader from '@/components/layout/PageHeader'
import { Lead } from '@/types'
import { formatDate } from '@/lib/utils'
import {
  Add01Icon,
  Flag01Icon,
  Message01Icon,
  LinkSquare01Icon,
  CheckListIcon,
} from 'hugeicons-react'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'

const STAGES: { key: string; label: string; dotColor: string }[] = [
  { key: 'NEW',           label: 'Новый',         dotColor: '#F59E0B' },
  { key: 'CONTACTED',     label: 'Контакт',        dotColor: '#3B82F6' },
  { key: 'PROPOSAL_SENT', label: 'КП отправлено',  dotColor: '#8B5CF6' },
  { key: 'NEGOTIATION',   label: 'Переговоры',     dotColor: '#EC4899' },
  { key: 'WON',           label: 'Успешно',         dotColor: '#22C55E' },
  { key: 'LOST',          label: 'Отказ',           dotColor: '#EF4444' },
]

// Status badge config per stage
const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  NEW:           { label: 'Не начат',   bg: '#DBEAFE', color: '#1D4ED8' },
  CONTACTED:     { label: 'В работе',   bg: '#FEF9C3', color: '#92400E' },
  PROPOSAL_SENT: { label: 'На изучении', bg: '#FEF9C3', color: '#92400E' },
  NEGOTIATION:   { label: 'На треке',   bg: '#FCE7F3', color: '#9D174D' },
  WON:           { label: 'Завершён',   bg: '#DCFCE7', color: '#166534' },
  LOST:          { label: 'Отменён',    bg: '#FEE2E2', color: '#991B1B' },
}

// Priority badge config derived from probability (0-100)
function getPriorityBadge(probability: number): { label: string; bg: string; color: string } {
  if (probability <= 30) {
    return { label: 'Low',    bg: '#EDE9FE', color: '#5B21B6' }
  } else if (probability <= 70) {
    return { label: 'Medium', bg: '#FFEDD5', color: '#C2410C' }
  } else {
    return { label: 'High',   bg: '#FEE2E2', color: '#991B1B' }
  }
}

function LeadCard({ lead, onStageChange }: { lead: Lead; onStageChange: (id: string, stage: string) => void }) {
  const statusBadge = STATUS_BADGE[lead.stage] ?? STATUS_BADGE['NEW']
  const priorityBadge = getPriorityBadge(lead.probability)
  const totalPax = (lead.paxAdults ?? 0) + (lead.paxChildren ?? 0)

  // Assignee initials (up to 2 chars)
  const initials = lead.assignedManagerName
    ? lead.assignedManagerName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
      {/* Status badge */}
      <div>
        <span
          className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: statusBadge.bg, color: statusBadge.color }}
        >
          {statusBadge.label}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">
        {lead.title}
      </p>

      {/* Description / destination */}
      {lead.destination && (
        <p className="text-xs text-gray-500 truncate">{lead.destination}</p>
      )}

      {/* Assignees row */}
      {lead.assignedManagerName && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Ответственный:</span>
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0"
            style={{ backgroundColor: '#3B82F6' }}
            title={lead.assignedManagerName}
          >
            {initials}
          </div>
        </div>
      )}

      {/* Due date row */}
      {lead.travelDatesFrom && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Flag01Icon size={13} className="text-gray-400 flex-shrink-0" />
            <span>{formatDate(lead.travelDatesFrom)}</span>
          </div>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: priorityBadge.bg, color: priorityBadge.color }}
          >
            {priorityBadge.label}
          </span>
        </div>
      )}

      {/* If no travel date, still show priority badge */}
      {!lead.travelDatesFrom && (
        <div className="flex justify-end">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: priorityBadge.bg, color: priorityBadge.color }}
          >
            {priorityBadge.label}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Bottom stats row */}
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Message01Icon size={13} />
          <span>0</span>
        </div>
        <div className="flex items-center gap-1">
          <LinkSquare01Icon size={13} />
          <span>0</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <CheckListIcon size={13} />
          <span>{totalPax}чел.</span>
        </div>
      </div>

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
            <Add01Icon size={16} />
            Создать лид
          </button>
        }
      />

      {isLoading ? (
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-6 gap-4 min-w-[960px]">
            {STAGES.map((s) => (
              <div key={s.key} className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded-xl mb-3" />
                <div
                  className="rounded-xl p-2 space-y-3"
                  style={{ backgroundColor: '#F5F5F5' }}
                >
                  {[1, 2].map((i) => <div key={i} className="h-40 bg-gray-200 rounded-xl" />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-6 gap-4 min-w-[960px]">
            {STAGES.map((stage) => {
              const stageLeads = byStage(stage.key)
              return (
                <div key={stage.key} className="flex flex-col">
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: stage.dotColor }}
                      />
                      <span className="text-sm font-semibold text-gray-700 truncate">
                        {stage.label}
                      </span>
                      <span
                        className="text-xs font-bold text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center flex-shrink-0"
                        style={{ backgroundColor: '#3B82F6' }}
                      >
                        {stageLeads.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowModal(true)}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0 ml-1"
                      title="Добавить лид"
                    >
                      <Add01Icon size={14} />
                    </button>
                  </div>

                  {/* Column body */}
                  <div
                    className="rounded-xl p-2 flex-1 min-h-[120px] space-y-3"
                    style={{ backgroundColor: '#F5F5F5' }}
                  >
                    {stageLeads.length === 0 && (
                      <p className="text-gray-400 text-xs text-center py-6">Лидов нет</p>
                    )}
                    {stageLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onStageChange={(id, s) => stageMutation.mutate({ id, stage: s })}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
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
                <input
                  {...register('title', { required: true })}
                  placeholder="Тур в Турцию, июль, 2 взрослых"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Направление</label>
                  <input
                    {...register('destination')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Источник</label>
                  <input
                    {...register('source')}
                    placeholder="instagram, website..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Бюджет от</label>
                  <input
                    {...register('budgetMin')}
                    type="number"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Бюджет до</label>
                  <input
                    {...register('budgetMax')}
                    type="number"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); reset() }}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
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
