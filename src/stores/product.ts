import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApiError } from '../composables/useApiError'
import api from '../api/axios'
import type { Product, ProductPayload } from '../types/products'
import type { PaginatedResponse } from '../types/pagination'

export const useProductStore = defineStore('product', () => {
    const { throwApiError } = useApiError()

    const items = ref<Product[]>([])
    const selectedItem = ref<Product | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const page = ref(1)
    const limit = ref(10)
    const total = ref(0)
    const totalPages = ref(1)

    const getAll = async (nextPage = 1, nextLimit = 10): Promise<Product[]> => {
        loading.value = true
        error.value = null

        try {
            const res = await api.get<PaginatedResponse<Product>>('/products', {
                params: { page: nextPage, limit: nextLimit },
            })
            items.value = res.data.data
            page.value = res.data.page
            limit.value = nextLimit
            total.value = res.data.total
            totalPages.value = res.data.totalPages
            return items.value
        } catch (err: unknown) {
            throw throwApiError(err, 'Failed to fetch products')
        } finally {
            loading.value = false
        }
    }

    const create = async (payload: ProductPayload): Promise<Product> => {
        loading.value = true
        error.value = null

        try {
            const res = await api.post<{ message: string; data: Product }>('/products', payload)
            const created = res.data?.data
            if (!created) {
                throw new Error('Malformed response: missing product data')
            }
            items.value.push(created)
            return created
        } catch (err: unknown) {
            throw throwApiError(err, 'Failed to create product')
        } finally {
            loading.value = false
        }
    }

    const getOne = async (id: number): Promise<Product> => {
        loading.value = true
        error.value = null

        try {
            const res = await api.get<{ data: Product }>(`/products/${id}`)
            return res.data.data
        } catch (err: unknown) {
            throw throwApiError(err, 'Failed to fetch product')
        } finally {
            loading.value = false
        }
    }

    const update = async (id: number, payload: ProductPayload): Promise<Product> => {
        loading.value = true
        error.value = null

        try {
            const res = await api.put<{ message: string; data: Product }>(`/products/${id}`, payload)
            const updated = res.data?.data
            if (!updated) {
                throw new Error('Malformed response: missing product data')
            }
            const index = items.value.findIndex((p) => p.id === id)
            if (index !== -1) {
                items.value[index] = updated
            }
            return updated
        } catch (err: unknown) {
            throw throwApiError(err, 'Failed to update product')
        } finally {
            loading.value = false
        }
    }

    const deleteItem = async (id: number): Promise<void> => {
        loading.value = true
        error.value = null

        try {
            await api.delete<{ message: string; data: Product }>(`/products/${id}`)
            items.value = items.value.filter((p) => p.id !== id)
        } catch (err: unknown) {
            throw throwApiError(err, 'Failed to delete product')
        } finally {
            loading.value = false
        }
    }

    const selectItem = (item: Product | null) => {
        selectedItem.value = item
    }

    const clearSelection = () => {
        selectedItem.value = null
    }

    return {
        items,
        selectedItem,
        loading,
        error,
        page,
        limit,
        total,
        totalPages,
        getAll,
        create,
        getOne,
        update,
        deleteItem,
        selectItem,
        clearSelection,
    }
})
