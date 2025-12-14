import type { FieldErrors } from '../types/errors'

export class RequestError extends Error {
  fieldErrors?: FieldErrors

  constructor(message: string, opts?: { fieldErrors?: FieldErrors }) {
    super(message)
    this.name = 'RequestError'
    this.fieldErrors = opts?.fieldErrors
  }
}

