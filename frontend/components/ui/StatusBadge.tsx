import { cn } from '@/lib/utils'

const clientStatusMap: Record<string, { label: string; bg: string; color: string }> = {
  NEW:      { label: 'Новый',      bg: '#DBEAFE', color: '#1D4ED8' },
  ACTIVE:   { label: 'Активный',   bg: '#DCFCE7', color: '#16A34A' },
  VIP:      { label: 'VIP',        bg: '#F3E8FF', color: '#7C3AED' },
  INACTIVE: { label: 'Неактивный', bg: '#F1F5F9', color: '#64748B' },
}

const leadStageMap: Record<string, { label: string; bg: string; color: string }> = {
  NEW:           { label: 'Новый',          bg: '#DBEAFE', color: '#1D4ED8' },
  CONTACTED:     { label: 'Контакт',        bg: '#FEF9C3', color: '#A16207' },
  PROPOSAL_SENT: { label: 'КП отправлено',  bg: '#FFEDD5', color: '#C2410C' },
  NEGOTIATION:   { label: 'Переговоры',     bg: '#E0E7FF', color: '#4338CA' },
  WON:           { label: 'Успешно',        bg: '#DCFCE7', color: '#16A34A' },
  LOST:          { label: 'Отказ',          bg: '#FEE2E2', color: '#DC2626' },
}

const bookingStatusMap: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:     { label: 'Ожидает',      bg: '#FEF9C3', color: '#A16207' },
  CONFIRMED:   { label: 'Подтверждено', bg: '#DBEAFE', color: '#1D4ED8' },
  PAID:        { label: 'Оплачено',     bg: '#DCFCE7', color: '#16A34A' },
  IN_PROGRESS: { label: 'В процессе',   bg: '#E0E7FF', color: '#4338CA' },
  COMPLETED:   { label: 'Завершено',    bg: '#F1F5F9', color: '#475569' },
  CANCELLED:   { label: 'Отменено',     bg: '#FEE2E2', color: '#DC2626' },
}

const taskPriorityMap: Record<string, { label: string; bg: string; color: string }> = {
  LOW:    { label: 'Низкий',  bg: '#F1F5F9', color: '#64748B' },
  MEDIUM: { label: 'Средний', bg: '#DBEAFE', color: '#1D4ED8' },
  HIGH:   { label: 'Высокий', bg: '#FFEDD5', color: '#C2410C' },
  URGENT: { label: 'Срочно',  bg: '#FEE2E2', color: '#DC2626' },
}

const paymentStatusMap: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:   { label: 'Ожидает',  bg: '#FEF9C3', color: '#A16207' },
  COMPLETED: { label: 'Выполнен', bg: '#DCFCE7', color: '#16A34A' },
  FAILED:    { label: 'Ошибка',   bg: '#FEE2E2', color: '#DC2626' },
  REFUNDED:  { label: 'Возврат',  bg: '#F3E8FF', color: '#7C3AED' },
}

const roleMap: Record<string, { label: string; bg: string; color: string }> = {
  SUPER_ADMIN: { label: 'Супер-админ', bg: '#F3E8FF', color: '#7C3AED' },
  MANAGER:     { label: 'Менеджер',   bg: '#DBEAFE', color: '#1D4ED8' },
}

type BadgeType = 'client' | 'lead' | 'booking' | 'task' | 'payment' | 'role'

interface StatusBadgeProps {
  value: string
  type: BadgeType
  className?: string
}

const maps: Record<BadgeType, Record<string, { label: string; bg: string; color: string }>> = {
  client:  clientStatusMap,
  lead:    leadStageMap,
  booking: bookingStatusMap,
  task:    taskPriorityMap,
  payment: paymentStatusMap,
  role:    roleMap,
}

export default function StatusBadge({ value, type, className }: StatusBadgeProps) {
  const config = maps[type]?.[value] || { label: value, bg: '#F1F5F9', color: '#64748B' }
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap',
        className
      )}
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  )
}
