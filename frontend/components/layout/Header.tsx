'use client'

import { usePathname } from 'next/navigation'
import {
  Search01Icon,
  Notification03Icon,
  Settings01Icon,
  ArrowDown01Icon,
  Menu01Icon,
  Message01Icon,
} from 'hugeicons-react'
import { useAuthStore } from '@/store/authStore'

const routeLabels: Record<string, string> = {
  '/':               'Дашборд',
  '/clients':        'Клиенты',
  '/leads':          'Лиды',
  '/tours':          'Каталог туров',
  '/bookings':       'Бронирования',
  '/payments':       'Платежи',
  '/tasks':          'Задачи',
  '/invoices':       'Счета',
  '/documents':      'Документы',
  '/calendar':       'Календарь',
  '/analytics':      'Аналитика',
  '/reports':        'Отчёты',
  '/communications': 'Коммуникации',
  '/settings':       'Настройки',
  '/admin/users':    'Сотрудники',
}

function getPageLabel(pathname: string): string {
  if (pathname === '/') return 'Дашборд'
  for (const [route, label] of Object.entries(routeLabels)) {
    if (route !== '/' && pathname.startsWith(route)) return label
  }
  return 'Дашборд'
}

interface HeaderProps {
  onMenuClick: () => void
  title?: string
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  const user = useAuthStore((s) => s.user)
  const pathname = usePathname()
  const pageLabel = title || getPageLabel(pathname)

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 bg-white border-b"
      style={{
        height: '64px',
        borderColor: '#E2E8F4',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.06)',
      }}
    >
      {/* Left: mobile menu + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: '#6B7A9A' }}
        >
          <Menu01Icon size={20} />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <span style={{ color: '#6B7A9A' }}>Usar Travel CRM</span>
          <span style={{ color: '#C4CCDB' }}>/</span>
          <span className="font-semibold" style={{ color: '#1A2332' }}>
            {pageLabel}
          </span>
        </div>
      </div>

      {/* Right: actions + user */}
      <div className="flex items-center gap-1">
        {/* Search */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: '#6B7A9A' }}
          aria-label="Поиск"
        >
          <Search01Icon size={18} />
        </button>

        {/* Messages */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: '#6B7A9A' }}
          aria-label="Сообщения"
        >
          <Message01Icon size={18} />
        </button>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: '#6B7A9A' }}
          aria-label="Уведомления"
        >
          <Notification03Icon size={18} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: '#EF4444' }}
          />
        </button>

        {/* Settings */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: '#6B7A9A' }}
          aria-label="Настройки"
        >
          <Settings01Icon size={18} />
        </button>

        {/* Separator */}
        <div
          className="w-px h-6 mx-2"
          style={{ backgroundColor: '#E2E8F4' }}
        />

        {/* User */}
        <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
            style={{ backgroundColor: '#2B63EB' }}
          >
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold leading-tight" style={{ color: '#1A2332' }}>
              {user?.fullName}
            </p>
            <p className="text-xs leading-tight" style={{ color: '#6B7A9A' }}>
              {user?.role === 'SUPER_ADMIN' ? 'Супер-админ' : 'Менеджер'}
            </p>
          </div>
          <ArrowDown01Icon size={16} style={{ color: '#6B7A9A' }} className="hidden sm:block" />
        </button>
      </div>
    </header>
  )
}
