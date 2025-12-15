import { describe, it, expect, beforeEach } from 'vitest'
import { ref, reactive, type Ref } from 'vue'
import { z } from 'zod'
import { createZodBlurValidator } from '../lib/fieldValidation'
import type { FieldErrors } from '../types/errors'

describe('createZodBlurValidator', () => {
  const schema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  })

  let values: { email: string; password: string }
  let fieldErrors: Ref<FieldErrors>
  let validateField: (fieldName: string) => void

  beforeEach(() => {
    values = reactive({ email: '', password: '' })
    fieldErrors = ref<FieldErrors>({})
    validateField = createZodBlurValidator(schema, values, fieldErrors)
  })

  it('sets error for invalid field', () => {
    values.email = 'not-an-email'
    validateField('email')

    expect(fieldErrors.value.email).toBe('Invalid email')
  })

  it('clears error when field becomes valid', () => {
    values.email = 'not-an-email'
    validateField('email')
    expect(fieldErrors.value.email).toBe('Invalid email')

    values.email = 'valid@example.com'
    values.password = 'validpassword123'
    validateField('email')
    expect(fieldErrors.value.email).toBeUndefined()
  })

  it('only updates the requested field error', () => {
    values.email = 'not-an-email'
    values.password = 'short'

    validateField('email')

    expect(fieldErrors.value.email).toBe('Invalid email')
    expect(fieldErrors.value.password).toBeUndefined()
  })

  it('clears field error when there is no error for that field', () => {
    fieldErrors.value = { email: 'Previous error' }
    values.email = 'valid@example.com'
    values.password = 'validpassword123'

    validateField('email')

    expect(fieldErrors.value.email).toBeUndefined()
  })

  it('preserves other field errors when validating one field', () => {
    fieldErrors.value = { password: 'Existing error' }
    values.email = 'invalid'

    validateField('email')

    expect(fieldErrors.value.email).toBe('Invalid email')
    expect(fieldErrors.value.password).toBe('Existing error')
  })

  it('handles cross-field validation', () => {
    const passwordSchema = z
      .object({
        password: z.string().min(8, 'Password too short'),
        confirmPassword: z.string(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      })

    const pwValues = reactive({ password: 'password123', confirmPassword: 'different' })
    const pwErrors = ref<FieldErrors>({})
    const validatePwField = createZodBlurValidator(passwordSchema, pwValues, pwErrors)

    validatePwField('confirmPassword')

    expect(pwErrors.value.confirmPassword).toBe('Passwords do not match')
  })

  it('clears error for field not in schema errors', () => {
    fieldErrors.value = { email: 'Old error' }
    values.email = 'valid@example.com'
    values.password = 'validpassword123'

    validateField('email')

    expect(fieldErrors.value.email).toBeUndefined()
  })
})
