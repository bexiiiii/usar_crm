'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useAuthStore } from '@/store/authStore'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, hydrate } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) router.push('/login')
  }, [router])

  if (!user) return null

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#EEF0F8' }}>
      {/* Fixed sidebar — 240px wide */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area — offset by sidebar width */}
      <div
        className="flex flex-col flex-1 min-h-screen"
        style={{ marginLeft: '240px' }}
      >
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main
          className="flex-1 p-6"
          style={{ backgroundColor: '#EEF0F8' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
