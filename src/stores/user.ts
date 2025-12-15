import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApiError } from '../composables/useApiError'
import api from '../api/axios'
import type { MeResponse, User } from '../types/auth'

export const useUserStore = defineStore('user', () => {
  const { throwApiError } = useApiError()

  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const me = async (): Promise<User> => {
    loading.value = true
    error.value = null

    try {
      const res = await api.get<MeResponse>('/users/me', { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
      user.value = res.data.user
      return res.data.user
    } catch (err: unknown) {
      user.value = null
      throw throwApiError(err, 'Fetching of your profile failed')
    } finally {
      loading.value = false
    }
  }

  const clearUser = () => {
    user.value = null
  }

  return {
    user,
    loading,
    error,
    me,
    clearUser,
  }
})
