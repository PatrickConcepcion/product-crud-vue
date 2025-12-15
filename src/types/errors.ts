export type FieldErrors = Record<string, string | undefined>

export type BackendErrorPayload = {
  success?: false
  message?: unknown
  status?: unknown
  code?: unknown
  errors?: unknown
}

