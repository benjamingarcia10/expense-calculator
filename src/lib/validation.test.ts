import { describe, it, expect } from 'vitest'
import { LIMITS, validateSession, sanitizeName, sanitizeTitle } from './validation'

describe('LIMITS', () => {
  it('enforces person name max 30 chars', () => {
    expect(LIMITS.personName).toBe(30)
  })
  it('enforces expense title max 60', () => {
    expect(LIMITS.expenseTitle).toBe(60)
  })
})

describe('sanitizeName', () => {
  it('trims whitespace', () => {
    expect(sanitizeName('  Alice  ')).toBe('Alice')
  })
  it('strips zero-width chars', () => {
    expect(sanitizeName('Alice​')).toBe('Alice')
  })
  it('truncates to max length', () => {
    expect(sanitizeName('a'.repeat(50)).length).toBe(30)
  })
})

describe('sanitizeTitle', () => {
  it('truncates to expense title max', () => {
    expect(sanitizeTitle('a'.repeat(100)).length).toBe(60)
  })
})

describe('validateSession', () => {
  const valid = {
    v: 1,
    currency: 'USD',
    title: null,
    people: [{ id: 'p1', name: 'Alice' }],
    expenses: [],
    createdAt: new Date().toISOString(),
  }

  it('accepts a valid session', () => {
    expect(validateSession(valid).success).toBe(true)
  })

  it('rejects unknown schema version', () => {
    const result = validateSession({ ...valid, v: 99 })
    expect(result.success).toBe(false)
  })

  it('rejects person name longer than 30 chars', () => {
    const session = { ...valid, people: [{ id: 'p1', name: 'a'.repeat(31) }] }
    expect(validateSession(session).success).toBe(false)
  })

  it('rejects more than 25 people', () => {
    const people = Array.from({ length: 26 }, (_, i) => ({ id: `p${i}`, name: `P${i}` }))
    expect(validateSession({ ...valid, people }).success).toBe(false)
  })

  it('rejects more than 100 expenses', () => {
    const expenses = Array.from({ length: 101 }, (_, i) => ({
      id: `e${i}`,
      title: 'x',
      type: 'equal' as const,
      total: 10,
      paidById: 'p1',
      participantIds: ['p1'],
    }))
    expect(validateSession({ ...valid, expenses }).success).toBe(false)
  })
})
