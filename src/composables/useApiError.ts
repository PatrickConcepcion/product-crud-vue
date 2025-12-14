import type { BackendErrorPayload, FieldErrors } from '../types/errors'
import { RequestError } from '../lib/requestError'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function firstString(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) return value[0] ?? null
  return null
}

function coerceFieldErrorsMap(value: unknown): FieldErrors | null {
  if (!isRecord(value)) return null
  const out: FieldErrors = {}
  for (const [key, v] of Object.entries(value)) {
    const message = firstString(v)
    if (message) out[key] = message
  }
  return Object.keys(out).length ? out : null
}

function getPayload(err: unknown): BackendErrorPayload | null {
  // Axios: err.response.data
  if (isRecord(err) && isRecord(err.response) && 'data' in err.response) {
    const data = (err.response as any).data
    return isRecord(data) ? (data as BackendErrorPayload) : null
  }

  // Fetch wrapper (older): err.data
  if (isRecord(err) && isRecord(err.data)) return err.data as BackendErrorPayload

  return null
}

/**
 * Centralized client-side parsing of backend errors.
 * Works with the Nest `HttpExceptionFilter` payload:
 * `{ success:false, status:number, message:string, code?:string, errors?: Record<string, string[]> }`
 */
export function useApiError() {
  const extractMessage = (err: unknown, fallback: string): string => {
    const payload = getPayload(err)
    const message = payload ? firstString(payload.message) : null
    if (message) return message
    if (err instanceof Error) return err.message
    return fallback
  }

  const extractFieldErrors = (err: unknown, allowedFields?: string[]): FieldErrors | null => {
    const payload = getPayload(err)
    if (!payload) return null

    // Preferred backend shape.
    const fromErrors = coerceFieldErrorsMap(payload.errors)
    if (fromErrors) {
      if (!allowedFields?.length) return fromErrors
      const filtered = Object.fromEntries(Object.entries(fromErrors).filter(([k]) => allowedFields.includes(k)))
      return Object.keys(filtered).length ? filtered : null
    }

    // Back-compat with Nest default ValidationPipe `{ message: string[] }`.
    const fromMessageArray = Array.isArray(payload.message)
      ? coerceFieldErrorsMap(
          Object.fromEntries(
            payload.message
              .filter((m): m is string => typeof m === 'string')
              .map((m) => {
                const field = m.split(' ')[0] ?? ''
                return [field, m]
              }),
          ),
        )
      : null

    if (!fromMessageArray) return null
    if (!allowedFields?.length) return fromMessageArray
    const filtered = Object.fromEntries(Object.entries(fromMessageArray).filter(([k]) => allowedFields.includes(k)))
    return Object.keys(filtered).length ? filtered : null
  }

  /**
   * Parses an API error and throws a RequestError with fieldErrors or message.
   */
  const throwApiError = (err: unknown, fallback: string): never => {
    const fieldErrors = extractFieldErrors(err)
    if (fieldErrors) throw new RequestError(fallback, { fieldErrors })
    throw new RequestError(extractMessage(err, fallback))
  }

  return { extractMessage, extractFieldErrors, throwApiError }
}
