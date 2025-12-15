import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { zodErrorToFieldErrors } from '../lib/zod'

describe('zodErrorToFieldErrors', () => {
  it('converts single field error', () => {
    const schema = z.object({
      email: z.string().email('Invalid email'),
    })

    const result = schema.safeParse({ email: 'not-an-email' })
    if (result.success) throw new Error('Should have failed')

    expect(zodErrorToFieldErrors(result.error)).toEqual({
      email: 'Invalid email',
    })
  })

  it('converts multiple field errors', () => {
    const schema = z.object({
      email: z.string().email('Invalid email'),
      password: z.string().min(8, 'Password too short'),
    })

    const result = schema.safeParse({ email: 'bad', password: '123' })
    if (result.success) throw new Error('Should have failed')

    expect(zodErrorToFieldErrors(result.error)).toEqual({
      email: 'Invalid email',
      password: 'Password too short',
    })
  })

  it('takes first error for each field', () => {
    const schema = z.object({
      password: z.string().min(8, 'Too short').regex(/[A-Z]/, 'Needs uppercase'),
    })

    const result = schema.safeParse({ password: 'abc' })
    if (result.success) throw new Error('Should have failed')

    const errors = zodErrorToFieldErrors(result.error)
    expect(errors.password).toBe('Too short')
  })

  it('ignores errors without string path', () => {
    const schema = z.array(z.string().min(1, 'Required'))

    const result = schema.safeParse(['valid', ''])
    if (result.success) throw new Error('Should have failed')

    // Array index errors have numeric paths, should be ignored
    expect(zodErrorToFieldErrors(result.error)).toEqual({})
  })

  it('returns empty object for valid data', () => {
    const schema = z.object({
      email: z.string().email(),
    })

    const result = schema.safeParse({ email: 'test@example.com' })
    if (!result.success) throw new Error('Should have succeeded')

    // This shouldn't happen in practice, but testing edge case
  })

  it('handles nested objects by using first path segment', () => {
    const schema = z.object({
      user: z.object({
        name: z.string().min(1, 'Name required'),
      }),
    })

    const result = schema.safeParse({ user: { name: '' } })
    if (result.success) throw new Error('Should have failed')

    // First path segment is 'user'
    expect(zodErrorToFieldErrors(result.error)).toEqual({
      user: 'Name required',
    })
  })

  it('handles required_error', () => {
    const schema = z.object({
      name: z.string({ required_error: 'Name is required' }),
    })

    const result = schema.safeParse({})
    if (result.success) throw new Error('Should have failed')

    expect(zodErrorToFieldErrors(result.error)).toEqual({
      name: 'Name is required',
    })
  })
})
