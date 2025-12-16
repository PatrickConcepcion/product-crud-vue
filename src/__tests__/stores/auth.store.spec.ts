import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../../stores/auth'
import { useUserStore } from '../../stores/user'
import { RequestError } from '../../lib/requestError'

vi.mock('../../api/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

import api from '../../api/axios'

const mockUser = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'test@test.com',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
}

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has correct initial values', () => {
      const store = useAuthStore()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.flashSuccess).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('isAuthenticated', () => {
    it('returns true when user exists', () => {
      const store = useAuthStore()
      const userStore = useUserStore()
      userStore.user = mockUser
      expect(store.isAuthenticated).toBe(true)
    })
  })

  describe('initialize', () => {
    it('fetches current user when authenticated', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: { user: mockUser } })

      const store = useAuthStore()
      await store.initialize()

      expect(store.isAuthenticated).toBe(true)
    })

    it('stays unauthenticated on error', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Unauthorized'))

      const store = useAuthStore()
      await store.initialize()

      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('login', () => {
    it('sets authenticated state on successful login', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: { message: 'Login successful' } })
      vi.mocked(api.get).mockResolvedValueOnce({ data: { user: mockUser } })

      const store = useAuthStore()
      const result = await store.login({ email: 'test@test.com', password: 'password123' })

      expect(store.isAuthenticated).toBe(true)
      expect(result.message).toBe('Login successful')
    })

    it('sets loading state during login', async () => {
      let resolveLogin: (value: unknown) => void
      vi.mocked(api.post).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveLogin = resolve
        }),
      )

      const store = useAuthStore()
      const loginPromise = store.login({ email: 'test@test.com', password: 'password' })

      expect(store.loading).toBe(true)

      resolveLogin!({ data: { message: 'Success' } })
      vi.mocked(api.get).mockResolvedValueOnce({ data: { user: mockUser } })

      await loginPromise
      expect(store.loading).toBe(false)
    })

    it('throws RequestError with field errors on validation failure', async () => {
      vi.mocked(api.post).mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            errors: { email: ['Email is invalid'] },
          },
        },
      })

      const store = useAuthStore()

      try {
        await store.login({ email: 'bad', password: 'password' })
        expect.fail('Should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(RequestError)
        expect((err as RequestError).fieldErrors).toEqual({ email: 'Email is invalid' })
      }
    })
  })

  describe('register', () => {
    it('sets flashSuccess on successful registration', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          message: 'User created',
          data: mockUser,
        },
      })

      const store = useAuthStore()
      await store.register({
        email: 'test@test.com',
        password: 'password',
        confirmPassword: 'password',
        firstName: 'John',
        lastName: 'Doe',
      })

      expect(store.flashSuccess).toBe('Account created successfully!')
    })
  })

  describe('consumeFlashSuccess', () => {
    it('returns and clears flash message', () => {
      const store = useAuthStore()
      store.flashSuccess = 'Success message'

      const message = store.consumeFlashSuccess()

      expect(message).toBe('Success message')
      expect(store.flashSuccess).toBeNull()
    })
  })

  describe('logout', () => {
    it('calls logout API', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: { message: 'Logged out' } })

      const store = useAuthStore()
      await store.logout()

      expect(api.post).toHaveBeenCalledWith('/auth/logout')
    })

    it('clears session even if API fails', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Network error'))

      const store = useAuthStore()
      const userStore = useUserStore()
      userStore.user = mockUser

      await expect(store.logout()).rejects.toThrow(RequestError)
      expect(store.isAuthenticated).toBe(false)
    })
  })
})

