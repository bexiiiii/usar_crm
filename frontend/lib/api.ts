import axios from 'axios'
import toast from 'react-hot-toast'

let authRedirectInProgress = false
let lastForbiddenToastAt = 0

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
})

function redirectToLogin() {
  if (typeof window === 'undefined' || authRedirectInProgress) return
  authRedirectInProgress = true
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.replace('/login')
}

function shouldRedirectToLogin(status?: number, errorData?: { error?: string } | null) {
  if (status === 401) return true
  if (status !== 403) return false

  const message = errorData?.error?.toLowerCase() ?? ''
  return !message || message.includes('jwt') || message.includes('token') || message.includes('сессия')
}

function showForbiddenToast(message: string) {
  const now = Date.now()
  if (now - lastForbiddenToastAt < 1500) return
  lastForbiddenToastAt = now
  toast.error(message)
}

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const errorData = error.response?.data

    if (shouldRedirectToLogin(status, errorData)) {
      redirectToLogin()
    } else if (status === 403) {
      showForbiddenToast(errorData?.error || 'Нет доступа — недостаточно прав')
    } else if (status >= 500) {
      toast.error('Ошибка при сохранении')
    } else if (errorData?.error) {
      toast.error(errorData.error)
    }
    return Promise.reject(error)
  }
)

export default api
