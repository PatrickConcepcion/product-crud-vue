import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../../stores/auth'
import { useUserStore } from '../../stores/user'
import { RequestError } from '../../lib/requestError'

// Mock the API module
vi.mock('../../api/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

import api from '../../api/axios'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  describe('initial state', () => {
    it('has correct initial values', () => {
      const store = useAuthStore()

      expect(store.token).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.flashSuccess).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('isAuthenticated', () => {
    it('returns false when token is null', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })

    it('returns true when token is set', () => {
      const store = useAuthStore()
      store.setToken('test-token')
      expect(store.isAuthenticated).toBe(true)
    })
  })

  describe('setToken', () => {
    it('sets token and saves to localStorage', () => {
      const store = useAuthStore()
      store.setToken('my-token')

      expect(store.token).toBe('my-token')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'my-token')
    })

    it('removes token from localStorage when null', () => {
      const store = useAuthStore()
      store.setToken('my-token')
      store.setToken(null)

      expect(store.token).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken')
    })

    it('clears user store when token is null', () => {
      const authStore = useAuthStore()
      const userStore = useUserStore()
      userStore.user = { id: 1, firstName: 'John', lastName: 'Doe', email: 'test@test.com', createdAt: '', updatedAt: '' }

      authStore.setToken(null)

      expect(userStore.user).toBeNull()
    })
  })

  describe('initialize', () => {
    it('loads token from localStorage', () => {
      localStorageMock.getItem.mockReturnValueOnce('stored-token')
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'))

      const store = useAuthStore()
      store.initialize()

      expect(store.token).toBe('stored-token')
    })

    it('does not set token if localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValueOnce(null)

      const store = useAuthStore()
      store.initialize()

      expect(store.token).toBeNull()
    })
  })

  describe('login', () => {
    it('sets token on successful login', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          message: 'Login successful',
          data: { accessToken: 'new-token' },
        },
      })
      vi.mocked(api.get).mockResolvedValueOnce({
        data: { user: { id: 1, firstName: 'John', lastName: 'Doe', email: 'test@test.com' } },
      })

      const store = useAuthStore()
      const result = await store.login({ email: 'test@test.com', password: 'password123' })

      expect(store.token).toBe('new-token')
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

      resolveLogin!({
        data: { message: 'Success', data: { accessToken: 'token' } },
      })
      vi.mocked(api.get).mockResolvedValueOnce({ data: { user: {} } })

      await loginPromise
      expect(store.loading).toBe(false)
    })

    it('throws RequestError when no accessToken in response', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { message: 'Login successful', data: {} },
      })

      const store = useAuthStore()

      await expect(store.login({ email: 'test@test.com', password: 'password' })).rejects.toThrow(RequestError)
      expect(store.error).toBe('Login failed')
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

    it('resets loading on error', async () => {
      vi.mocked(api.post).mockRejectedValueOnce({
        response: { data: { message: 'Error' } },
      })

      const store = useAuthStore()

      try {
        await store.login({ email: 'test@test.com', password: 'password' })
      } catch {
        // Expected
      }

      expect(store.loading).toBe(false)
    })
  })

  describe('register', () => {
    it('sets flashSuccess on successful registration', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          message: 'User created',
          data: { id: 1, email: 'test@test.com' },
        },
      })

      const store = useAuthStore()
      await store.register({
        email: 'test@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      })

      expect(store.flashSuccess).toBe('Account created successfully!')
    })

    it('does not set token after registration', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { message: 'User created', data: {} },
      })

      const store = useAuthStore()
      await store.register({
        email: 'test@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      })

      expect(store.token).toBeNull()
    })

    it('throws RequestError with field errors on validation failure', async () => {
      vi.mocked(api.post).mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            errors: { email: ['Email already exists'] },
          },
        },
      })

      const store = useAuthStore()

      try {
        await store.register({
          email: 'existing@test.com',
          password: 'password123',
          confirmPassword: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        })
        expect.fail('Should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(RequestError)
        expect((err as RequestError).fieldErrors).toEqual({ email: 'Email already exists' })
      }
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

    it('returns null when no flash message', () => {
      const store = useAuthStore()
      expect(store.consumeFlashSuccess()).toBeNull()
    })
  })

  describe('logout', () => {
    it('clears token immediately', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: { message: 'Logged out' } })

      const store = useAuthStore()
      store.setToken('existing-token')

      await store.logout()

      expect(store.token).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('calls logout API with current token', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: { message: 'Logged out' } })

      const store = useAuthStore()
      store.setToken('my-token')

      await store.logout()

      expect(api.post).toHaveBeenCalledWith(
        '/auth/logout',
        {},
        { headers: { Authorization: 'Bearer my-token' } },
      )
    })

    it('does not call API if no token', async () => {
      const store = useAuthStore()
      await store.logout()

      expect(api.post).not.toHaveBeenCalled()
    })

    it('clears token even if API fails', async () => {
      vi.mocked(api.post).mockRejectedValueOnce({
        response: { data: { message: 'Error' } },
      })

      const store = useAuthStore()
      store.setToken('my-token')

      // logout throws on API error now
      try {
        await store.logout()
      } catch {
        // Expected
      }

      expect(store.token).toBeNull()
    })
  })
})
