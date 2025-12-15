<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  totalPages: number
  disabled?: boolean
  pageSize?: number
  pageSizeOptions?: readonly number[]
}>()

const emit = defineEmits<{
  (e: 'update:page', value: number): void
  (e: 'update:pageSize', value: number): void
}>()

type PageItem = number | '…'

const pages = computed<PageItem[]>(() => {
  const current = Math.max(1, Math.min(props.page, props.totalPages))
  const total = Math.max(1, props.totalPages)

  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const items: PageItem[] = []
  const add = (item: PageItem) => items.push(item)

  add(1)

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) add('…')
  for (let p = start; p <= end; p += 1) add(p)
  if (end < total - 1) add('…')

  add(total)
  return items
})

const canPrev = computed(() => props.page > 1 && !props.disabled)
const canNext = computed(() => props.page < props.totalPages && !props.disabled)

const goTo = (next: number) => {
  if (props.disabled) return
  if (next < 1 || next > props.totalPages) return
  if (next === props.page) return
  emit('update:page', next)
}

const onPageSizeChange = (e: Event) => {
  const next = Number((e.target as HTMLSelectElement).value)
  if (!Number.isFinite(next)) return
  emit('update:pageSize', next)
}
</script>

<template>
  <nav class="flex flex-col justify-center items-center gap-3 sm:flex-row" aria-label="Pagination">
    <div class="flex items-center justify-center gap-2">
      <button
        type="button"
        class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 disabled:opacity-50"
        :disabled="!canPrev"
        @click="goTo(page - 1)"
      >
        Prev
      </button>

      <div class="flex items-center gap-1">
        <template v-for="(item, idx) in pages" :key="`${item}-${idx}`">
          <span v-if="item === '…'" class="px-2 text-sm text-slate-500">…</span>
          <button
            v-else
            type="button"
            class="min-w-9 rounded-md px-3 py-1.5 text-sm disabled:opacity-50"
            :class="
              item === page
                ? 'bg-slate-900 text-white'
                : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
            "
            :disabled="disabled"
            @click="goTo(item)"
          >
            {{ item }}
          </button>
        </template>
      </div>

      <button
        type="button"
        class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 disabled:opacity-50"
        :disabled="!canNext"
        @click="goTo(page + 1)"
      >
        Next
      </button>
    </div>

    <div v-if="pageSize && pageSizeOptions?.length" class="flex items-center gap-2">
      <label for="pageSize" class="text-sm text-slate-600">Per page</label>
      <select
        id="pageSize"
        :value="pageSize"
        class="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 disabled:opacity-50"
        :disabled="disabled"
        @change="onPageSizeChange"
      >
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}</option>
      </select>
    </div>
  </nav>
</template>
