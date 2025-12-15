<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { z } from 'zod'
import { useAuthStore } from '../stores/auth'
import FormInput from '../components/FormInput.vue'
import { zodErrorToFieldErrors } from '../lib/zod'
import { RequestError } from '../lib/requestError'
import type { FieldErrors } from '../types/errors'
import { createZodBlurValidator } from '../lib/fieldValidation'

const router = useRouter()
const authStore = useAuthStore()

const registerSchema = z
  .object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .min(1, 'Email is required')
      .email('Enter a valid email'),
    firstName: z.string({ required_error: 'First name is required' }).trim().min(1, 'First name is required'),
    lastName: z.string({ required_error: 'Last name is required' }).trim().min(1, 'Last name is required'),
    password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
    confirmPassword: z
      .string({ required_error: 'Confirm password is required' })
      .min(6, 'Confirm password must be at least 6 characters'),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      })
    }
  })

const submitLabel = computed(() => (authStore.loading ? 'Creating account…' : 'Create account'))

const values = reactive({
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: '',
})

const fieldErrors = ref<FieldErrors>({})
const validateField = createZodBlurValidator(registerSchema, values, fieldErrors)

const handleRegister = async () => {
  fieldErrors.value = {}
  authStore.error = null

  const parsed = registerSchema.safeParse(values)
  if (!parsed.success) {
    fieldErrors.value = zodErrorToFieldErrors(parsed.error)
    return
  }

  try {
    await authStore.register(parsed.data)
    await router.push('/login')
  } catch (err: unknown) {
    if (err instanceof RequestError && err.fieldErrors) {
      fieldErrors.value = err.fieldErrors
    }
  }
}
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <h1 class="text-xl font-semibold tracking-tight">Register</h1>
    <p class="mt-1 text-sm text-slate-600">Create your account.</p>

    <form class="mt-6 space-y-4" @submit.prevent="handleRegister">
      <p
        v-if="authStore.error"
        class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
      >
        {{ authStore.error }}
      </p>

      <FormInput
        v-model="values.email"
        name="email"
        label="Email"
        type="email"
        autocomplete="email"
        :disabled="authStore.loading"
        :errors="fieldErrors"
        @blur="validateField('email')"
      />

      <FormInput
        v-model="values.firstName"
        name="firstName"
        label="First name"
        autocomplete="given-name"
        :disabled="authStore.loading"
        :errors="fieldErrors"
        @blur="validateField('firstName')"
      />

      <FormInput
        v-model="values.lastName"
        name="lastName"
        label="Last name"
        autocomplete="family-name"
        :disabled="authStore.loading"
        :errors="fieldErrors"
        @blur="validateField('lastName')"
      />

      <FormInput
        v-model="values.password"
        name="password"
        label="Password"
        type="password"
        autocomplete="new-password"
        :disabled="authStore.loading"
        :errors="fieldErrors"
        @blur="validateField('password')"
      />

      <FormInput
        v-model="values.confirmPassword"
        name="confirmPassword"
        label="Confirm password"
        type="password"
        autocomplete="new-password"
        :disabled="authStore.loading"
        :errors="fieldErrors"
        @blur="validateField('confirmPassword')"
      />

      <button
        type="submit"
        :disabled="authStore.loading"
        class="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {{ submitLabel }}
      </button>

      <p class="text-center text-sm text-slate-600">
        Already have an account?
        <RouterLink to="/login" class="font-medium text-slate-900 underline">Login</RouterLink>
      </p>
    </form>
  </section>
</template>
