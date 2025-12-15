import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '../../stores/user'
import { RequestError } from '../../lib/requestError'
import type { User } from '../../types/auth'

// Mock the API module
vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(),
  },
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
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

const mockUser: User = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
}

describe('useUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  describe('initial state', () => {
    it('has correct initial values', () => {
      const store = useUserStore()

      expect(store.user).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('me', () => {
    it('fetches and stores current user', async () => {
      localStorageMock.getItem.mockReturnValue('test-token')
      vi.mocked(api.get).mockResolvedValueOnce({
        data: { user: mockUser },
      })

      const store = useUserStore()
      const result = await store.me()

      expect(result).toEqual(mockUser)
      expect(store.user).toEqual(mockUser)
    })

    it('sends authorization header', async () => {
      localStorageMock.getItem.mockReturnValue('my-token')
      vi.mocked(api.get).mockResolvedValueOnce({
        data: { user: mockUser },
      })

      const store = useUserStore()
      await store.me()

      expect(api.get).toHaveBeenCalledWith('/users/me', {
        headers: { Authorization: 'Bearer my-token' },
      })
    })

    it('sets loading state', async () => {
      let resolveGet: (value: unknown) => void
      vi.mocked(api.get).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveGet = resolve
        }),
      )

      const store = useUserStore()
      const promise = store.me()

      expect(store.loading).toBe(true)

      resolveGet!({ data: { user: mockUser } })
      await promise

      expect(store.loading).toBe(false)
    })

    it('clears user and throws on error', async () => {
      vi.mocked(api.get).mockRejectedValueOnce({
        response: { data: { message: 'Unauthorized' } },
      })

      const store = useUserStore()
      store.user = mockUser

      await expect(store.me()).rejects.toThrow(RequestError)
      expect(store.user).toBeNull()
    })

    it('resets loading on error', async () => {
      vi.mocked(api.get).mockRejectedValueOnce({
        response: { data: { message: 'Error' } },
      })

      const store = useUserStore()

      try {
        await store.me()
      } catch {
        // Expected
      }

      expect(store.loading).toBe(false)
    })
  })

  describe('clearUser', () => {
    it('clears user state', () => {
      const store = useUserStore()
      store.user = mockUser

      store.clearUser()

      expect(store.user).toBeNull()
    })
  })
})