import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
})

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
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    } else if (error.response?.status === 403) {
      toast.error('Нет доступа — недостаточно прав')
    } else if (error.response?.status >= 500) {
      toast.error('Ошибка при сохранении')
    } else if (error.response?.data?.error) {
      toast.error(error.response.data.error)
    }
    return Promise.reject(error)
  }
)

export default api
