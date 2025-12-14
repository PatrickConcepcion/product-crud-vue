import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useApiError } from '../composables/useApiError'
import api from '../api/axios'
import type { LoginPayload, LoginResponse, LogoutResponse, RegisterPayload, RegisterResponse } from '../types/auth'
import type { FieldErrors } from '../types/errors'
import { RequestError } from '../lib/requestError'

export const useAuthStore = defineStore('auth', () => {
  const { throwApiError } = useApiError()

  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const flashSuccess = ref<string | null>(null)

  const isAuthenticated = computed(() => Boolean(token.value))

  function initialize() {
    token.value = localStorage.getItem('accessToken')
  }

  function setToken(nextToken: string | null) {
    token.value = nextToken
    if (nextToken) localStorage.setItem('accessToken', nextToken)
    else localStorage.removeItem('accessToken')
  }

  async function login(payload: LoginPayload): Promise<LoginResponse> {
    loading.value = true
    error.value = null

    try {
      const res = await api.post<LoginResponse>(`/auth/login`, payload)
      const accessToken = res.data?.data?.accessToken
      if (!accessToken) {
        error.value = 'Login failed'
        throw new RequestError('Login failed')
      }
      setToken(accessToken)
      return res.data
    } catch (err: unknown) {
      throw throwApiError(err, 'Login failed')
    } finally {
      loading.value = false
    }
  }

  async function register(
    payload: RegisterPayload,
  ): Promise<RegisterResponse> {
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

  function consumeFlashSuccess(): string | null {
    const message = flashSuccess.value
    flashSuccess.value = null
    return message
  }

  async function logout(): Promise<LogoutResponse | undefined> {
    const currentToken = token.value
    setToken(null)
    error.value = null

    if (!currentToken) return

    try {
      const res = await api.post<LogoutResponse>(`/auth/logout`, {}, { headers: { Authorization: `Bearer ${currentToken}` } })
      return res.data
    } catch {
      // Ignore; token already cleared locally.
      return
    }
  }

  return {
    token,
    loading,
    error,
    flashSuccess,
    isAuthenticated,
    initialize,
    setToken,
    login,
    register,
    consumeFlashSuccess,
    logout,
  }
})
