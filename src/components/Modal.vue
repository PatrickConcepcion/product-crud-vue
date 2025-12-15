<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    closeOnBackdrop?: boolean
    closeOnEsc?: boolean
  }>(),
  {
    closeOnBackdrop: true,
    closeOnEsc: true,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

const isOpen = computed(() => props.modelValue)
const dialogEl = ref<HTMLDivElement | null>(null)

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onBackdropClick() {
  if (props.closeOnBackdrop) close()
}

async function focusDialog() {
  await nextTick()
  dialogEl.value?.focus()
}

function onKeydown(e: KeyboardEvent) {
  if (!isOpen.value) return
  if (e.key === 'Escape' && props.closeOnEsc) {
    e.preventDefault()
    close()
  }
}

watch(
  () => isOpen.value,
  (open) => {
    if (!open) return
    focusDialog()
  },
  { immediate: true },
)

window.addEventListener('keydown', onKeydown)
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="onBackdropClick" />

      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref="dialogEl"
          class="w-full max-w-md rounded-xl bg-white p-5 shadow-lg outline-none"
          role="dialog"
          aria-modal="true"
          :aria-label="title || 'Dialog'"
          tabindex="-1"
          @click.stop
        >
          <header v-if="title" class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-900">{{ title }}</h2>
            <button
              type="button"
              class="rounded-md px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
              @click="close"
            >
              Close
            </button>
          </header>

          <div :class="title ? 'mt-4' : ''">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

