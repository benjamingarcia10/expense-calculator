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

  it('rejects unsupported currency code', () => {
    const result = validateSession({ ...valid, currency: 'XXX' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/currency/i)
  })

  it('rejects expense referencing unknown payer', () => {
    const result = validateSession({
      ...valid,
      expenses: [
        {
          id: 'e1',
          title: 'd',
          type: 'equal' as const,
          total: 10,
          paidById: 'ghost',
          participantIds: ['p1'],
        },
      ],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/payer/i)
  })

  it('rejects expense referencing unknown participant', () => {
    const result = validateSession({
      ...valid,
      expenses: [
        {
          id: 'e1',
          title: 'd',
          type: 'equal' as const,
          total: 10,
          paidById: 'p1',
          participantIds: ['p1', 'ghost'],
        },
      ],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/person/i)
  })

  it('rejects restaurant expense with unknown assigned id', () => {
    const result = validateSession({
      ...valid,
      expenses: [
        {
          id: 'e1',
          title: 'Pizza',
          type: 'restaurant' as const,
          paidById: 'p1',
          items: [{ id: 'i1', name: 'Pizza', price: 30, assignedIds: ['p1', 'ghost'] }],
          tax: 0,
          tip: 0,
          serviceFee: 0,
        },
      ],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/person/i)
  })

  it('rejects lodging expense with unknown nights key', () => {
    const result = validateSession({
      ...valid,
      expenses: [
        {
          id: 'e1',
          title: 'Airbnb',
          type: 'lodging' as const,
          total: 100,
          paidById: 'p1',
          mode: 'simple' as const,
          nights: { p1: 2, ghost: 1 },
        },
      ],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/person/i)
  })

  it('accepts a complete valid restaurant + lodging session', () => {
    const result = validateSession({
      ...valid,
      people: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
      ],
      expenses: [
        {
          id: 'e1',
          title: 'Pizza',
          type: 'restaurant' as const,
          paidById: 'p1',
          items: [{ id: 'i1', name: 'Pizza', price: 30, assignedIds: ['p1', 'p2'] }],
          tax: 3,
          tip: 6,
          serviceFee: 0,
        },
      ],
    })
    expect(result.success).toBe(true)
  })
})
