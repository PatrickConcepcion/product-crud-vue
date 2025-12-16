import axios, { AxiosError, type AxiosInstance } from 'axios'
import { pinia } from '../pinia'
import { useAuthStore } from '../stores/auth'
import type { CustomAxiosRequestConfig } from '../types/axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
if (!API_BASE_URL) {
  throw new Error('Missing required env var: VITE_API_BASE_URL')
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

let refreshPromise: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  try {
    await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    )
    return true
  } catch {
    return false
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig | undefined

    const status = error.response?.status
    const url = originalRequest?.url ?? ''
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true

      const authStore = useAuthStore(pinia)

      refreshPromise ??= refreshSession().finally(() => {
        refreshPromise = null
      })

      const refreshed = await refreshPromise
      if (refreshed) return api(originalRequest)

      authStore.clearSession()
      const path = window.location.pathname
      const isAuthRoute = path === '/login' || path === '/register'
      if (!isAuthRoute) window.location.href = '/login'
    }

    return Promise.reject(error)
  },
)

export default api
