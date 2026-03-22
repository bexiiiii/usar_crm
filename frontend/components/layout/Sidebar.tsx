'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { canAccess } from '@/lib/auth'
import {
  LayoutDashboard, Users, UserCircle, BookOpen, CreditCard,
  CheckSquare, BarChart2, Settings, LogOut, TrendingUp, X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  feature?: string
}

const navItems: NavItem[] = [
  { href: '/', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/clients', label: 'Клиенты', icon: UserCircle },
  { href: '/leads', label: 'Лиды', icon: TrendingUp },
  { href: '/bookings', label: 'Брони', icon: BookOpen },
  { href: '/payments', label: 'Платежи', icon: CreditCard },
  { href: '/tasks', label: 'Задачи', icon: CheckSquare },
  { href: '/analytics', label: 'Аналитика', icon: BarChart2 },
  { href: '/admin/users', label: 'Пользователи', icon: Users, feature: 'manage_users' },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  const visible = navItems.filter(item =>
    !item.feature || canAccess(user?.role, item.feature)
  )

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        'sidebar flex flex-col',
        open ? 'open' : ''
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-800 font-bold text-sm">T</span>
            </div>
            <span className="text-white font-bold text-lg">Travel CRM</span>
          </div>
          <button onClick={onClose} className="md:hidden text-blue-300 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {visible.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-6 py-3 text-sm transition-all duration-150 mx-2 rounded-xl mb-1',
                  active
                    ? 'bg-white text-blue-800 font-semibold shadow-sm'
                    : 'text-blue-200 hover:bg-blue-700 hover:text-white'
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-blue-700">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-blue-300 text-xs">{user?.role === 'SUPER_ADMIN' ? 'Супер-админ' : 'Менеджер'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-blue-300 hover:text-white hover:bg-blue-700 rounded-xl text-sm transition-colors"
          >
            <LogOut size={16} />
            Выйти
          </button>
        </div>
      </aside>
    </>
  )
}
