export type Role = 'SUPER_ADMIN' | 'MANAGER'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: Role
  permissions?: Record<string, boolean>
}

export const ACCESS_FEATURES: Array<{ key: string; label: string; description: string }> = [
  { key: 'edit_record', label: 'Редактирование', description: 'Изменение карточек и сущностей' },
  { key: 'delete_record', label: 'Удаление', description: 'Удаление записей из системы' },
  { key: 'view_all_managers', label: 'Все менеджеры', description: 'Просмотр общей аналитики по всем менеджерам' },
  { key: 'manage_users', label: 'Сотрудники', description: 'Управление пользователями и ролями' },
  { key: 'view_cost_price', label: 'Себестоимость', description: 'Просмотр закупочной стоимости и маржи' },
  { key: 'export_data', label: 'Экспорт', description: 'Скачивание данных и выгрузок' },
  { key: 'cancel_booking', label: 'Отмена брони', description: 'Отмена и возврат бронирований' },
  { key: 'view_analytics', label: 'Аналитика', description: 'Доступ к аналитике и графикам' },
  { key: 'view_payments', label: 'Платежи', description: 'Просмотр платежей' },
  { key: 'view_reports', label: 'Отчёты', description: 'Просмотр отчётов' },
  { key: 'manage_settings', label: 'Настройки', description: 'Управление системными настройками' },
  { key: 'manage_notifications', label: 'Уведомления', description: 'Создание и рассылка уведомлений' },
  { key: 'manage_tasks', label: 'Задачи', description: 'Создание и управление задачами' },
  { key: 'manage_documents', label: 'Документы', description: 'Генерация и скачивание документов' },
  { key: 'manage_invoices', label: 'Счета', description: 'Редактирование и скачивание счетов' },
  { key: 'assign_tasks', label: 'Назначение задач', description: 'Назначение задач сотрудникам' },
]

export const ROLE_DEFAULT_PERMISSIONS: Record<Role, Record<string, boolean>> = {
  SUPER_ADMIN: Object.fromEntries(ACCESS_FEATURES.map((feature) => [feature.key, true])),
  MANAGER: {
    view_analytics: true,
    view_reports: true,
    manage_tasks: true,
    manage_documents: true,
  },
}

export function canAccess(
  role: Role | undefined,
  feature: string,
  permissions?: Record<string, boolean>
): boolean {
  if (!role) return false
  if (role === 'SUPER_ADMIN') return true
  const resolvedPermissions = permissions ?? getUser()?.permissions
  const defaults = ROLE_DEFAULT_PERMISSIONS[role] ?? {}
  if (resolvedPermissions && Object.prototype.hasOwnProperty.call(resolvedPermissions, feature)) {
    return Boolean(resolvedPermissions[feature])
  }
  if (Object.prototype.hasOwnProperty.call(defaults, feature)) {
    return Boolean(defaults[feature])
  }
  return false
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function setAuth(token: string, user: AuthUser) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
