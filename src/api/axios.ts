import axios, { AxiosError, type AxiosInstance } from 'axios'
import { pinia } from '../pinia'
import { useAuthStore } from '../stores/auth'
import type { CustomAxiosRequestConfig } from '../types/axios'
import type { RefreshResponse } from '../types/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
if (!API_BASE_URL) {
  throw new Error('Missing required env var: VITE_API_BASE_URL')
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use(
  (config: CustomAxiosRequestConfig) => {
    const authStore = useAuthStore(pinia)
    const token = authStore.token ?? localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(currentToken: string): Promise<string | null> {
  try {
    const res = await axios.post<RefreshResponse>(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { headers: { Authorization: `Bearer ${currentToken}` } },
    )
    return res.data?.data?.accessToken ?? null
  } catch {
    return null
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
      const currentToken = authStore.token ?? localStorage.getItem('accessToken')

      if (currentToken) {
        refreshPromise ??= refreshAccessToken(currentToken).finally(() => {
          refreshPromise = null
        })

        const newToken = await refreshPromise
        if (newToken) {
          authStore.setToken(newToken)
          originalRequest.headers = originalRequest.headers ?? {}
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }
      }

      authStore.setToken(null)
      window.location.href = '/login'
    }

    return Promise.reject(error)
  },
)

export default api
