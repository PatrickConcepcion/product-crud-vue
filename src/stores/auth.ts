import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApiError } from '../composables/useApiError'
import api from '../api/axios'
import type { LoginPayload, LoginResponse, LogoutResponse, RegisterPayload, RegisterResponse } from '../types/auth'
import { useUserStore } from './user'

export const useAuthStore = defineStore('auth', () => {
  const { throwApiError } = useApiError()
  const userStore = useUserStore()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const flashSuccess = ref<string | null>(null)
  const initialized = ref(false)
  let initializePromise: Promise<void> | null = null

  const isAuthenticated = computed(() => Boolean(userStore.user))

  const initialize = async () => {
    if (initialized.value) return
    initializePromise ??= userStore
      .me()
      .catch(() => userStore.clearUser())
      .then(() => undefined)
      .finally(() => {
        initialized.value = true
        initializePromise = null
      })
    return initializePromise
  }

  const clearSession = () => {
    userStore.clearUser()
    initialized.value = true
  }

  const login = async (payload: LoginPayload): Promise<LoginResponse> => {
    loading.value = true
    error.value = null

    try {
      const res = await api.post<LoginResponse>(`/auth/login`, payload)
      await userStore.me()
      initialized.value = true
      return res.data
    } catch (err: unknown) {
      throw throwApiError(err, 'Login failed')
    } finally {
      loading.value = false
    }
  }

  const register = async (payload: RegisterPayload): Promise<RegisterResponse> => {
    loading.value = true
    error.value = null

    try {
      const res = await api.post<RegisterResponse>(`/auth/register`, payload)
      flashSuccess.value = 'Account created successfully!'
      return res.data
    } catch (err: unknown) {
      throw throwApiError(err, 'Registration failed')
    } finally {
      loading.value = false
    }
  }

  const consumeFlashSuccess = (): string | null => {
    const message = flashSuccess.value
    flashSuccess.value = null
    return message
  }

  const logout = async (): Promise<LogoutResponse | undefined> => {
    clearSession()
    error.value = null

    try {
      const res = await api.post<LogoutResponse>(`/auth/logout`)
      return res.data
    } catch (err: unknown){
      throw throwApiError(err, 'Logout failed')
    }
  }

  return {
    loading,
    error,
    flashSuccess,
    isAuthenticated,
    initialize,
    clearSession,
    login,
    register,
    consumeFlashSuccess,
    logout,
  }
})
