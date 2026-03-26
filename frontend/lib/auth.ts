export type Role = 'SUPER_ADMIN' | 'MANAGER'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: Role
}

const permissions: Record<string, Role[]> = {
  delete_record:     ['SUPER_ADMIN'],
  view_all_managers: ['SUPER_ADMIN'],
  manage_users:      ['SUPER_ADMIN'],
  view_cost_price:   ['SUPER_ADMIN'],
  export_data:       ['SUPER_ADMIN'],
  cancel_booking:    ['SUPER_ADMIN'],
  view_analytics:    ['SUPER_ADMIN', 'MANAGER'],
  view_payments:     ['SUPER_ADMIN'],
  view_reports:      ['SUPER_ADMIN'],
  manage_settings:   ['SUPER_ADMIN'],
}

export function canAccess(role: Role | undefined, feature: string): boolean {
  if (!role) return false
  const allowed = permissions[feature]
  if (!allowed) return true
  return allowed.includes(role)
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
