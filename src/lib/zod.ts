import type { ZodError } from 'zod'
import type { FieldErrors } from '../types/errors'

export function zodErrorToFieldErrors(error: ZodError): FieldErrors {
  const out: FieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key !== 'string') continue
    if (out[key]) continue
    out[key] = issue.message
  }
  return out
}

