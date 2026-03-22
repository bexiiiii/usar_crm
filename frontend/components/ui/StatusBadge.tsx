import { cn } from '@/lib/utils'

const clientStatusMap: Record<string, { label: string; class: string }> = {
  NEW:      { label: 'Новый',     class: 'bg-blue-100 text-blue-700' },
  ACTIVE:   { label: 'Активный', class: 'bg-green-100 text-green-700' },
  VIP:      { label: 'VIP',      class: 'bg-purple-100 text-purple-700' },
  INACTIVE: { label: 'Неактивный', class: 'bg-gray-100 text-gray-600' },
}

const leadStageMap: Record<string, { label: string; class: string }> = {
  NEW:           { label: 'Новый',         class: 'bg-blue-100 text-blue-700' },
  CONTACTED:     { label: 'Контакт',       class: 'bg-yellow-100 text-yellow-700' },
  PROPOSAL_SENT: { label: 'КП отправлено', class: 'bg-orange-100 text-orange-700' },
  NEGOTIATION:   { label: 'Переговоры',    class: 'bg-indigo-100 text-indigo-700' },
  WON:           { label: 'Успешно',       class: 'bg-green-100 text-green-700' },
  LOST:          { label: 'Отказ',         class: 'bg-red-100 text-red-700' },
}

const bookingStatusMap: Record<string, { label: string; class: string }> = {
  PENDING:     { label: 'Ожидает',     class: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED:   { label: 'Подтверждено', class: 'bg-blue-100 text-blue-700' },
  PAID:        { label: 'Оплачено',    class: 'bg-green-100 text-green-700' },
  IN_PROGRESS: { label: 'В процессе', class: 'bg-indigo-100 text-indigo-700' },
  COMPLETED:   { label: 'Завершено',  class: 'bg-gray-100 text-gray-700' },
  CANCELLED:   { label: 'Отменено',   class: 'bg-red-100 text-red-700' },
}

const taskPriorityMap: Record<string, { label: string; class: string }> = {
  LOW:    { label: 'Низкий',  class: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'Средний', class: 'bg-blue-100 text-blue-700' },
  HIGH:   { label: 'Высокий', class: 'bg-orange-100 text-orange-700' },
  URGENT: { label: 'Срочно',  class: 'bg-red-100 text-red-700' },
}

const paymentStatusMap: Record<string, { label: string; class: string }> = {
  PENDING:   { label: 'Ожидает',  class: 'bg-yellow-100 text-yellow-700' },
  COMPLETED: { label: 'Выполнен', class: 'bg-green-100 text-green-700' },
  FAILED:    { label: 'Ошибка',   class: 'bg-red-100 text-red-700' },
  REFUNDED:  { label: 'Возврат',  class: 'bg-purple-100 text-purple-700' },
}

const roleMap: Record<string, { label: string; class: string }> = {
  SUPER_ADMIN: { label: 'Супер-админ', class: 'bg-purple-100 text-purple-700' },
  MANAGER:     { label: 'Менеджер',   class: 'bg-blue-100 text-blue-700' },
}

type BadgeType = 'client' | 'lead' | 'booking' | 'task' | 'payment' | 'role'

interface StatusBadgeProps {
  value: string
  type: BadgeType
  className?: string
}

const maps: Record<BadgeType, Record<string, { label: string; class: string }>> = {
  client: clientStatusMap,
  lead: leadStageMap,
  booking: bookingStatusMap,
  task: taskPriorityMap,
  payment: paymentStatusMap,
  role: roleMap,
}

export default function StatusBadge({ value, type, className }: StatusBadgeProps) {
  const config = maps[type]?.[value] || { label: value, class: 'bg-gray-100 text-gray-600' }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.class, className)}>
      {config.label}
    </span>
  )
}
