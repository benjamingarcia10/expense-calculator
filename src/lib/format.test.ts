import { describe, it, expect } from 'vitest'
import { formatMoney, formatSigned, formatDate } from './format'

describe('formatMoney', () => {
  it('formats USD with 2 decimals', () => {
    expect(formatMoney(1234.5, 'USD')).toBe('$1,234.50')
  })
  it('formats EUR', () => {
    expect(formatMoney(99, 'EUR')).toMatch(/€/)
  })
  it('formats JPY with no decimals', () => {
    expect(formatMoney(1000, 'JPY')).toMatch(/1,000/)
    expect(formatMoney(1000, 'JPY')).not.toMatch(/\./)
  })
})

describe('formatSigned', () => {
  it('positives get +', () => {
    expect(formatSigned(50, 'USD')).toMatch(/^\+/)
  })
  it('negatives get -', () => {
    expect(formatSigned(-50, 'USD')).toMatch(/^-/)
  })
  it('zero has no sign', () => {
    expect(formatSigned(0, 'USD')).not.toMatch(/^[+-]/)
  })
})

describe('formatDate', () => {
  it('formats as Mon D, YYYY', () => {
    expect(formatDate('2026-03-08T00:00:00.000Z')).toMatch(/Mar (7|8|9), 2026/)
  })
})
