import { describe, it, expect } from 'vitest'
import { RequestError } from '../lib/requestError'

describe('RequestError', () => {
  it('creates error with message only', () => {
    const error = new RequestError('Something went wrong')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(RequestError)
    expect(error.message).toBe('Something went wrong')
    expect(error.name).toBe('RequestError')
    expect(error.fieldErrors).toBeUndefined()
  })

  it('creates error with fieldErrors', () => {
    const fieldErrors = {
      email: 'Email is invalid',
      password: 'Password is required',
    }
    const error = new RequestError('Validation failed', { fieldErrors })

    expect(error.message).toBe('Validation failed')
    expect(error.fieldErrors).toEqual(fieldErrors)
  })

  it('creates error with empty fieldErrors', () => {
    const error = new RequestError('Error', { fieldErrors: {} })

    expect(error.fieldErrors).toEqual({})
  })

  it('can be caught as Error', () => {
    try {
      throw new RequestError('Test error')
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      expect((err as Error).message).toBe('Test error')
    }
  })

  it('has correct stack trace', () => {
    const error = new RequestError('Test')
    expect(error.stack).toBeDefined()
    expect(error.stack).toContain('RequestError')
  })
})
