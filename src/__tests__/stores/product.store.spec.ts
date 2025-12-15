import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductStore } from '../../stores/product'
import { RequestError } from '../../lib/requestError'
import type { Product } from '../../types/products'

// Mock the API module
vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '../../api/axios'

const mockProduct: Product = {
  id: 1,
  name: 'Test Product',
  price: 99.99,
  description: 'A test product',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
}

describe('useProductStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has correct initial values', () => {
      const store = useProductStore()

      expect(store.items).toEqual([])
      expect(store.selectedItem).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.page).toBe(1)
      expect(store.limit).toBe(10)
      expect(store.total).toBe(0)
      expect(store.totalPages).toBe(1)
    })
  })

  describe('getAll', () => {
    it('fetches and stores products', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          data: [mockProduct],
          page: 1,
          total: 1,
          totalPages: 1,
        },
      })

      const store = useProductStore()
      const result = await store.getAll()

      expect(result).toEqual([mockProduct])
      expect(store.items).toEqual([mockProduct])
      expect(store.total).toBe(1)
    })

    it('sends pagination params', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: { data: [], page: 2, total: 0, totalPages: 1 },
      })

      const store = useProductStore()
      await store.getAll(2, 20)

      expect(api.get).toHaveBeenCalledWith('/products', {
        params: { page: 2, limit: 20 },
      })
    })

    it('updates pagination state', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          data: [mockProduct],
          page: 3,
          total: 50,
          totalPages: 5,
        },
      })

      const store = useProductStore()
      await store.getAll(3, 10)

      expect(store.page).toBe(3)
      expect(store.limit).toBe(10)
      expect(store.total).toBe(50)
      expect(store.totalPages).toBe(5)
    })

    it('sets loading state', async () => {
      let resolveGet: (value: unknown) => void
      vi.mocked(api.get).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveGet = resolve
        }),
      )

      const store = useProductStore()
      const promise = store.getAll()

      expect(store.loading).toBe(true)

      resolveGet!({ data: { data: [], page: 1, total: 0, totalPages: 1 } })
      await promise

      expect(store.loading).toBe(false)
    })

    it('throws RequestError on API failure', async () => {
      vi.mocked(api.get).mockRejectedValueOnce({
        response: { data: { message: 'Server error' } },
      })

      const store = useProductStore()

      await expect(store.getAll()).rejects.toThrow(RequestError)
    })
  })

  describe('create', () => {
    it('creates product and adds to items', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { message: 'Created', data: mockProduct },
      })

      const store = useProductStore()
      const result = await store.create({
        name: 'Test Product',
        price: 99.99,
        description: 'A test product',
      })

      expect(result).toEqual(mockProduct)
      expect(store.items).toContainEqual(mockProduct)
    })

    it('throws on malformed response', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { message: 'Created' },
      })

      const store = useProductStore()

      await expect(
        store.create({ name: 'Test', price: 10, description: null }),
      ).rejects.toThrow(RequestError)
    })

    it('throws RequestError with field errors', async () => {
      vi.mocked(api.post).mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            errors: { name: ['Name is required'] },
          },
        },
      })

      const store = useProductStore()

      try {
        await store.create({ name: '', price: 10, description: null })
        expect.fail('Should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(RequestError)
        expect((err as RequestError).fieldErrors).toEqual({ name: 'Name is required' })
      }
    })
  })

  describe('getOne', () => {
    it('fetches single product', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: { data: mockProduct },
      })

      const store = useProductStore()
      const result = await store.getOne(1)

      expect(result).toEqual(mockProduct)
      expect(api.get).toHaveBeenCalledWith('/products/1')
    })

    it('throws RequestError on failure', async () => {
      vi.mocked(api.get).mockRejectedValueOnce({
        response: { data: { message: 'Not found' } },
      })

      const store = useProductStore()

      await expect(store.getOne(999)).rejects.toThrow(RequestError)
    })
  })

  describe('update', () => {
    it('updates product and updates items array', async () => {
      const updatedProduct = { ...mockProduct, name: 'Updated Name' }
      vi.mocked(api.put).mockResolvedValueOnce({
        data: { message: 'Updated', data: updatedProduct },
      })

      const store = useProductStore()
      store.items = [mockProduct]

      const result = await store.update(1, {
        name: 'Updated Name',
        price: 99.99,
        description: 'A test product',
      })

      expect(result.name).toBe('Updated Name')
      expect(store.items[0]!.name).toBe('Updated Name')
    })

    it('does not fail if product not in items array', async () => {
      vi.mocked(api.put).mockResolvedValueOnce({
        data: { message: 'Updated', data: mockProduct },
      })

      const store = useProductStore()
      store.items = []

      const result = await store.update(1, {
        name: 'Test',
        price: 10,
        description: null,
      })

      expect(result).toEqual(mockProduct)
    })

    it('throws on malformed response', async () => {
      vi.mocked(api.put).mockResolvedValueOnce({
        data: { message: 'Updated' },
      })

      const store = useProductStore()

      await expect(
        store.update(1, { name: 'Test', price: 10, description: null }),
      ).rejects.toThrow(RequestError)
    })
  })

  describe('deleteItem', () => {
    it('removes product from items array', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({
        data: { message: 'Deleted' },
      })

      const store = useProductStore()
      store.items = [mockProduct, { ...mockProduct, id: 2, name: 'Second' }]

      await store.deleteItem(1)

      expect(store.items).toHaveLength(1)
      expect(store.items[0]!.id).toBe(2)
    })

    it('throws RequestError on failure', async () => {
      vi.mocked(api.delete).mockRejectedValueOnce({
        response: { data: { message: 'Forbidden' } },
      })

      const store = useProductStore()

      await expect(store.deleteItem(1)).rejects.toThrow(RequestError)
    })
  })

  describe('selectItem', () => {
    it('sets selected item', () => {
      const store = useProductStore()
      store.selectItem(mockProduct)

      expect(store.selectedItem).toEqual(mockProduct)
    })

    it('can set to null', () => {
      const store = useProductStore()
      store.selectItem(mockProduct)
      store.selectItem(null)

      expect(store.selectedItem).toBeNull()
    })
  })

  describe('clearSelection', () => {
    it('clears selected item', () => {
      const store = useProductStore()
      store.selectedItem = mockProduct

      store.clearSelection()

      expect(store.selectedItem).toBeNull()
    })
  })
})
