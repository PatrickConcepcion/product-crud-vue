import { describe, it, expect } from 'vitest'
import { useApiError } from '../composables/useApiError'
import { RequestError } from '../lib/requestError'

describe('useApiError', () => {
  const { extractMessage, extractFieldErrors, throwApiError } = useApiError()

  describe('extractMessage', () => {
    it('returns fallback when error is null', () => {
      expect(extractMessage(null, 'Fallback')).toBe('Fallback')
    })

    it('returns fallback when error is undefined', () => {
      expect(extractMessage(undefined, 'Fallback')).toBe('Fallback')
    })

    it('extracts message from Axios error response', () => {
      const axiosError = {
        response: {
          data: {
            success: false,
            message: 'Invalid credentials',
          },
        },
      }
      expect(extractMessage(axiosError, 'Fallback')).toBe('Invalid credentials')
    })

    it('extracts first message from array', () => {
      const axiosError = {
        response: {
          data: {
            success: false,
            message: ['First error', 'Second error'],
          },
        },
      }
      expect(extractMessage(axiosError, 'Fallback')).toBe('First error')
    })

    it('returns Error.message for native Error', () => {
      const error = new Error('Native error message')
      expect(extractMessage(error, 'Fallback')).toBe('Native error message')
    })

    it('returns fallback for non-object error', () => {
      expect(extractMessage('string error', 'Fallback')).toBe('Fallback')
      expect(extractMessage(123, 'Fallback')).toBe('Fallback')
    })

    it('extracts message from fetch wrapper error shape', () => {
      const fetchError = {
        data: {
          success: false,
          message: 'Fetch error message',
        },
      }
      expect(extractMessage(fetchError, 'Fallback')).toBe('Fetch error message')
    })
  })

  describe('extractFieldErrors', () => {
    it('returns null for null error', () => {
      expect(extractFieldErrors(null)).toBeNull()
    })

    it('returns null for undefined error', () => {
      expect(extractFieldErrors(undefined)).toBeNull()
    })

    it('extracts field errors from errors object', () => {
      const axiosError = {
        response: {
          data: {
            success: false,
            errors: {
              email: ['Email is invalid'],
              password: ['Password is required'],
            },
          },
        },
      }
      expect(extractFieldErrors(axiosError)).toEqual({
        email: 'Email is invalid',
        password: 'Password is required',
      })
    })

    it('extracts field errors from string array values', () => {
      const axiosError = {
        response: {
          data: {
            success: false,
            errors: {
              email: 'Email is invalid',
              password: 'Password is required',
            },
          },
        },
      }
      expect(extractFieldErrors(axiosError)).toEqual({
        email: 'Email is invalid',
        password: 'Password is required',
      })
    })

    it('filters by allowedFields when provided', () => {
      const axiosError = {
        response: {
          data: {
            success: false,
            errors: {
              email: ['Email is invalid'],
              password: ['Password is required'],
              extra: ['Extra field error'],
            },
          },
        },
      }
      expect(extractFieldErrors(axiosError, ['email', 'password'])).toEqual({
        email: 'Email is invalid',
        password: 'Password is required',
      })
    })

    it('returns null when no allowed fields match', () => {
      const axiosError = {
        response: {
          data: {
            success: false,
            errors: {
              email: ['Email is invalid'],
            },
          },
        },
      }
      expect(extractFieldErrors(axiosError, ['password'])).toBeNull()
    })

    it('extracts from Nest ValidationPipe message array format', () => {
      const axiosError = {
        response: {
          data: {
            success: false,
            message: ['email must be an email', 'password should not be empty'],
          },
        },
      }
      const result = extractFieldErrors(axiosError)
      expect(result).toEqual({
        email: 'email must be an email',
        password: 'password should not be empty',
      })
    })

    it('returns null for empty errors object', () => {
      const axiosError = {
        response: {
          data: {
            success: false,
            errors: {},
          },
        },
      }
      expect(extractFieldErrors(axiosError)).toBeNull()
    })
  })

  describe('throwApiError', () => {
    it('throws RequestError with fieldErrors when present', () => {
      const axiosError = {
        response: {
          data: {
            success: false,
            errors: {
              email: ['Email is invalid'],
            },
          },
        },
      }

      try {
        throwApiError(axiosError, 'Operation failed')
        expect.fail('Should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(RequestError)
        expect((err as RequestError).message).toBe('Operation failed')
        expect((err as RequestError).fieldErrors).toEqual({ email: 'Email is invalid' })
      }
    })

    it('throws RequestError with extracted message when no fieldErrors', () => {
      const axiosError = {
        response: {
          data: {
            success: false,
            message: 'Server error occurred',
          },
        },
      }

      try {
        throwApiError(axiosError, 'Fallback')
        expect.fail('Should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(RequestError)
        expect((err as RequestError).message).toBe('Server error occurred')
        expect((err as RequestError).fieldErrors).toBeUndefined()
      }
    })

    it('throws RequestError with fallback when no message extractable', () => {
      try {
        throwApiError({}, 'Fallback message')
        expect.fail('Should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(RequestError)
        expect((err as RequestError).message).toBe('Fallback message')
      }
    })
  })
})
