<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import Modal from '../components/Modal.vue'
import FormInput from '../components/FormInput.vue'
import Pagination from '../components/Pagination.vue'
import { z } from 'zod'
import { zodErrorToFieldErrors } from '../lib/zod'
import { Icon } from '@iconify/vue'
import type { FieldErrors } from '../types/errors'
import type { Product, ProductPayload } from '../types/products'
import { useProductStore } from '../stores/product'
import { createZodBlurValidator } from '../lib/fieldValidation'

const isModalOpen = ref(false)
const mode = ref<'create' | 'edit'>('create')
const selected = ref<Product | null>(null)

const productStore = useProductStore()
const { page, limit, totalPages, loading } = storeToRefs(productStore)

const fieldErrors = ref<FieldErrors>({})
const submitting = ref(false)

const values = reactive({
  name: '',
  price: '',
  description: '',
})

const schema = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(1, 'Name is required'),
  price: z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return undefined
      if (typeof v === 'number') return v
      if (typeof v === 'string') {
        const num = Number(v)
        return Number.isNaN(num) ? v : num // keep original string if NaN so invalid_type_error triggers
      }
      return v
    },
    z
      .number({ required_error: 'Price is required', invalid_type_error: 'Please enter a valid number' })
      .positive('Price must be greater than 0'),
  ),
  description: z
    .string()
    .trim()
    .transform((v) => (v.length ? v : undefined))
    .optional(),
})
const validateField = createZodBlurValidator(schema, values, fieldErrors)

const openCreate = () => {
  mode.value = 'create'
  selected.value = null
  values.name = ''
  values.price = ''
  values.description = ''
  fieldErrors.value = {}
  isModalOpen.value = true
}

const openEdit = (product: Product) => {
  mode.value = 'edit'
  selected.value = product
  values.name = product.name
  values.price = String(product.price)
  values.description = product.description ?? ''
  fieldErrors.value = {}
  isModalOpen.value = true
}

const close = () => {
  isModalOpen.value = false
}

const resetModalState = () => {
  fieldErrors.value = {}
  submitting.value = false
  selected.value = null
  values.name = ''
  values.price = ''
  values.description = ''
}

const onModalUpdate = (open: boolean) => {
  if (!open) resetModalState()
}

const onSubmit = async () => {
  fieldErrors.value = {}
  submitting.value = true

  const parsed = schema.safeParse(values)
  if (!parsed.success) {
    fieldErrors.value = zodErrorToFieldErrors(parsed.error)
    submitting.value = false
    return
  }

  try {
    if(mode.value === 'edit' && selected.value?.id != null) {
      const payload: ProductPayload = {
        name: parsed.data.name,
        price: parsed.data.price,
        description: parsed.data.description ?? null,
      }
      await productStore.update(selected.value.id, payload)
    } else {
      const payload: ProductPayload = {
        name: parsed.data.name,
        price: parsed.data.price,
        description: parsed.data.description ?? null,
      }
      await productStore.create(payload)
    }

  } catch (e) {
    console.log(e)
  } finally {
    submitting.value = false
    close() 
  }
}



onMounted(async () => {
  await productStore.getAll(1, limit.value)
} )

const onPageChange = async (nextPage: number) => {
  await productStore.getAll(nextPage, limit.value)
}

const pageSizeOptions = [10, 20, 30, 50] as const

const onLimitChange = async () => {
  await productStore.getAll(1, limit.value)
}

const onLimitSelect = async (next: number) => {
  limit.value = next
  await onLimitChange()
}
</script>

<template>
  <section class="bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">Products</h1>
        <p class="mt-1 text-sm text-slate-600">Manage your products here.</p>
      </div>
      <div class="flex items-center gap-3">
      <button
        type="button"
        class="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        @click="openCreate"
      >
        <span class="inline-flex items-center gap-2">
          <Icon icon="mdi:plus" class="h-4 w-4" />
          New Product
        </span>
      </button>
      </div>
    </div>

    <div class="mt-6 flex min-h-[60vh] flex-col">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div
          v-for="product in productStore.items"
          :key="product.id"
          class="relative rounded-md border border-slate-200 bg-white px-3 py-2"
        >
          <div class="pr-20">
            <p class="text-sm font-medium text-slate-900">{{ product.name }}</p>
            <p class="text-sm text-slate-600">${{ product.price }}</p>
            <p v-if="product.description" class="mt-1 line-clamp-2 text-sm text-slate-600">
              {{ product.description }}
            </p>
          </div>
          <div class="absolute right-3 top-2 flex">
            <button
              type="button"
              class="inline-flex items-center rounded-md p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              title="Edit"
              aria-label="Edit product"
              @click="openEdit(product)"
            >
              <Icon icon="mdi:pencil" class="h-5 w-5" />
            </button>
            <button
              type="button"
              class="inline-flex items-center rounded-md p-1 text-slate-600 hover:bg-red-50 hover:text-red-700"
              title="Delete"
              aria-label="Delete product"
              @click=""
            >
              <Icon icon="mdi:delete" class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div class="mt-auto pt-6">
        <Pagination
          :page="page"
          :total-pages="totalPages"
          :disabled="loading"
          :page-size="limit"
          :page-size-options="pageSizeOptions"
          @update:page="onPageChange"
          @update:pageSize="onLimitSelect"
        />
      </div>
    </div>

    <Modal v-model="isModalOpen" :title="mode === 'edit' ? 'Edit product' : 'Create product'" @update:modelValue="onModalUpdate">
      <form class="space-y-4" @submit.prevent="onSubmit">
        <FormInput v-model="values.name" name="name" label="Name" :disabled="submitting" :errors="fieldErrors" />

        <FormInput
          v-model="values.price"
          name="price"
          label="Price"
          inputmode="decimal"
          autocomplete="off"
          :disabled="submitting"
          :errors="fieldErrors"
          @blur="validateField('price')"
        />

        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700" for="description">Description</label>
          <textarea
            id="description"
            v-model="values.description"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            rows="4"
            :disabled="submitting"
          />
          <p v-if="fieldErrors.description" class="text-sm text-red-600">{{ fieldErrors.description }}</p>
        </div>

        <div class="flex gap-2 pt-2">
          <button
            type="button"
            class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 disabled:opacity-60"
            :disabled="submitting"
            @click="close"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            :disabled="submitting"
          >
            {{ mode === 'edit' ? 'Update' : 'Create' }}
          </button>
        </div>
      </form>
    </Modal>
  </section>
</template>
