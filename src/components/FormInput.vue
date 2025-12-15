<script setup lang="ts">
import { computed } from 'vue'
import type { FieldErrors } from '../types/errors'

const props = defineProps<{
  name: string
  label: string
  modelValue: string
  errors?: FieldErrors | null
  type?: string
  inputmode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
  autocomplete?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur'): void
}>()

const error = computed(() => props.errors?.[props.name])
const inputClasses = computed(() =>
  [
    'w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2',
    error.value
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-slate-300 focus:border-slate-400 focus:ring-slate-200',
  ].join(' '),
)
</script>

<template>
  <div class="space-y-1">
    <label class="text-sm font-medium text-slate-700" :for="name">{{ label }}</label>
    <input
      :id="name"
      :name="name"
      :type="type ?? 'text'"
      :inputmode="inputmode"
      :autocomplete="autocomplete"
      :disabled="disabled"
      :value="modelValue"
      :class="inputClasses"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @blur="emit('blur')"
    />
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>
