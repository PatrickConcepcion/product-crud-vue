import type { Ref } from 'vue'
import type { ZodTypeAny } from 'zod'
import { zodErrorToFieldErrors } from './zod'
import type { FieldErrors } from '../types/errors'

/**
 * Creates a simple "validate on blur" helper for a form.
 *
 * It validates using the full schema so cross-field rules (e.g. confirmPassword match)
 * are respected, but only updates the error message for the requested field.
 */
export function createZodBlurValidator(
  schema: ZodTypeAny,
  values: unknown,
  fieldErrors: Ref<FieldErrors>,
) {
  return (fieldName: string) => {
    const result = schema.safeParse(values)

    if (result.success) {
      delete fieldErrors.value[fieldName]
      return
    }

    const nextErrors = zodErrorToFieldErrors(result.error)
    const message = nextErrors[fieldName]

    if (!message) {
      delete fieldErrors.value[fieldName]
      return
    }

    fieldErrors.value[fieldName] = message
  }
}
