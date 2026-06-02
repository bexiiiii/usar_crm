'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [taskModalSeen, setTaskModalSeen] = useState(false)
  const { user, hydrate } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) router.push('/login')
  }, [router])

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      return
    }
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!user?.id) return
    const seen = sessionStorage.getItem(`tasks-modal-seen:${user.id}`)
    setTaskModalSeen(seen === '1')
  }, [user?.id])

  const { data: pendingTasks } = useQuery({
    queryKey: ['layout', 'pending-tasks', user?.id],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: 'TODO,IN_PROGRESS',
        page: '0',
        size: '10',
        sort: 'dueDate,asc',
      })
      if (user?.id) params.set('assignedTo', user.id)
      const res = await api.get(`/tasks?${params}`)
      return res.data.data?.content ?? []
    },
    enabled: !!user,
    refetchInterval: 60000,
  })

  useEffect(() => {
    if (!user?.id) return
    if ((pendingTasks?.length ?? 0) === 0) {
      sessionStorage.removeItem(`tasks-modal-seen:${user.id}`)
      setTaskModalSeen(false)
      setShowTaskModal(false)
      return
    }
    if ((pendingTasks?.length ?? 0) > 0 && !taskModalSeen) {
      setShowTaskModal(true)
    }
  }, [pendingTasks, taskModalSeen, user?.id])

  function dismissTaskModal() {
    if (user?.id) {
      sessionStorage.setItem(`tasks-modal-seen:${user.id}`, '1')
    }
    setShowTaskModal(false)
    setTaskModalSeen(true)
  }

  if (!user) return null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EEF0F8' }}>
      {/* Fixed sidebar — 240px wide */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area — offset by sidebar width */}
      <div className="main-content flex min-h-screen min-w-0 flex-col">
        <Header
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
          sidebarOpen={sidebarOpen}
        />
        <main
          className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6"
          style={{ backgroundColor: '#EEF0F8' }}
        >
          {children}
        </main>
      </div>

      {showTaskModal && pendingTasks?.length ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" style={{ border: '1px solid #E2E8F4' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#E2E8F4' }}>
              <div>
                <h2 className="text-base font-bold" style={{ color: '#1A2332' }}>Невыполненные задачи</h2>
                <p className="text-xs mt-0.5" style={{ color: '#6B7A9A' }}>
                  У вас {pendingTasks.length} активных задач
                </p>
              </div>
              <button onClick={dismissTaskModal} className="text-gray-400 hover:text-gray-600 text-xl">
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y" style={{ borderColor: '#F1F3F9' }}>
              {pendingTasks.map((task: { id: string; title: string; dueDate?: string; priority?: string; status: string }) => (
                <div key={task.id} className="px-5 py-4">
                  <p className="text-sm font-semibold" style={{ color: '#1A2332' }}>{task.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs" style={{ color: '#6B7A9A' }}>
                    {task.dueDate ? <span>Срок: {formatDate(task.dueDate)}</span> : <span>Без срока</span>}
                    <span>Приоритет: {task.priority || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t" style={{ borderColor: '#E2E8F4' }}>
              <button
                onClick={dismissTaskModal}
                className="rounded-xl border px-4 py-2 text-sm font-medium"
                style={{ borderColor: '#E2E8F4', color: '#6B7A9A' }}
              >
                Закрыть
              </button>
              <button
                onClick={() => { dismissTaskModal(); router.push('/tasks') }}
                className="rounded-xl bg-[#2B5BF0] px-4 py-2 text-sm font-semibold text-white"
              >
                Перейти к задачам
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
