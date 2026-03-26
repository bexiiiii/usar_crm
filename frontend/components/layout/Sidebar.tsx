'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { canAccess } from '@/lib/auth'
import {
  DashboardSquare01Icon,
  UserGroupIcon,
  Target01Icon,
  Ticket01Icon,
  Money01Icon,
  CheckmarkSquare01Icon,
  Invoice01Icon,
  Analytics01Icon,
  UserEdit01Icon,
  Logout01Icon,
  AirplaneLanding01Icon,
  Cancel01Icon,
  AirplaneTakeOff01Icon,
  Calendar01Icon,
  File01Icon,
  ChartLineData01Icon,
  Settings01Icon,
  Message01Icon,
  ArrowDown01Icon,
} from 'hugeicons-react'
import { cn } from '@/lib/utils'

interface SubItem {
  href: string
  label: string
  feature?: string
}

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  feature?: string
  children?: SubItem[]
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Дашборд',
    icon: DashboardSquare01Icon,
    children: [
      { href: '/analytics', label: 'Аналитика' },
      { href: '/reports', label: 'Отчёты', feature: 'view_reports' },
    ],
  },
  { href: '/clients',        label: 'Клиенты',       icon: UserGroupIcon },
  { href: '/leads',          label: 'Лиды',          icon: Target01Icon },
  { href: '/tours',          label: 'Каталог туров', icon: AirplaneTakeOff01Icon },
  {
    href: '/bookings',
    label: 'Бронирования',
    icon: Ticket01Icon,
    children: [
      { href: '/bookings', label: 'Все брони' },
      { href: '/calendar', label: 'Календарь' },
    ],
  },
  { href: '/payments',       label: 'Платежи',       icon: Money01Icon,          feature: 'view_payments' },
  { href: '/invoices',       label: 'Счета',         icon: Invoice01Icon },
  { href: '/tasks',          label: 'Задачи',        icon: CheckmarkSquare01Icon },
  { href: '/documents',      label: 'Документы',     icon: File01Icon },
  { href: '/communications', label: 'Коммуникации',  icon: Message01Icon },
  { href: '/settings',       label: 'Настройки',     icon: Settings01Icon,       feature: 'manage_settings' },
  { href: '/admin/users',    label: 'Сотрудники',    icon: UserEdit01Icon,       feature: 'manage_users' },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const [expandedItems, setExpandedItems] = useState<string[]>(['/'])

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  function toggleExpand(href: string) {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    )
  }

  const visible = navItems.filter(item =>
    !item.feature || canAccess(user?.role, item.feature)
  )

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn('sidebar flex flex-col', open ? 'open' : '')}
        style={{ background: 'linear-gradient(180deg, #0B1426 0%, #1B3B82 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(43, 99, 235, 0.7)' }}
            >
              <AirplaneLanding01Icon size={20} color="#FFFFFF" />
            </div>
            <span className="text-white font-bold text-base leading-tight">
              Usar Travel CRM
            </span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-white/50 hover:text-white transition-colors"
          >
            <Cancel01Icon size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto px-3">
          {visible.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href)) ||
              (item.children?.some((c) => pathname.startsWith(c.href)) ?? false)
            const isExpanded = expandedItems.includes(item.href)
            const hasChildren = item.children && item.children.length > 0

            return (
              <div key={item.href}>
                <div
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl mb-0.5 transition-all duration-150',
                    isActive
                      ? 'text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  )}
                  style={isActive && !hasChildren ? { backgroundColor: '#2B63EB' } : isActive ? { backgroundColor: 'rgba(43,99,235,0.3)' } : undefined}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 flex-1"
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                  {hasChildren && (
                    <button
                      onClick={() => toggleExpand(item.href)}
                      className="p-0.5 rounded transition-colors hover:bg-white/10"
                    >
                      <ArrowDown01Icon
                        size={14}
                        className="transition-transform"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      />
                    </button>
                  )}
                </div>

                {/* Sub-items */}
                {hasChildren && isExpanded && (
                  <div className="ml-4 mb-1 space-y-0.5">
                    {item.children!.filter(c => !c.feature || canAccess(user?.role, c.feature)).map((child) => {
                      const childActive = pathname === child.href || (child.href !== '/' && child.href !== item.href && pathname.startsWith(child.href))
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-all duration-150"
                          style={
                            childActive
                              ? { backgroundColor: '#2B63EB', color: '#fff' }
                              : { color: 'rgba(255,255,255,0.5)' }
                          }
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 mb-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
              style={{ background: '#2B63EB' }}
            >
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate leading-tight">
                {user?.fullName}
              </p>
              <p className="text-white/50 text-xs leading-tight mt-0.5">
                {user?.role === 'SUPER_ADMIN' ? 'Супер-админ' : 'Менеджер'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl text-sm font-medium transition-all duration-150"
          >
            <Logout01Icon size={18} />
            Выйти
          </button>
        </div>
      </aside>
    </>
  )
}
