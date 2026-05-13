import { describe, it, expect } from 'vitest'
import { currencyDecimals, isCurrencyCode } from './currencies'

describe('currencyDecimals', () => {
  it('returns 2 for USD/EUR/GBP and other major currencies', () => {
    expect(currencyDecimals('USD')).toBe(2)
    expect(currencyDecimals('EUR')).toBe(2)
    expect(currencyDecimals('GBP')).toBe(2)
    expect(currencyDecimals('CAD')).toBe(2)
  })

  it('returns 0 for currencies without minor units (JPY, KRW, VND)', () => {
    expect(currencyDecimals('JPY')).toBe(0)
    expect(currencyDecimals('KRW')).toBe(0)
    expect(currencyDecimals('VND')).toBe(0)
  })
})

describe('isCurrencyCode', () => {
  it('accepts known codes', () => {
    expect(isCurrencyCode('USD')).toBe(true)
    expect(isCurrencyCode('JPY')).toBe(true)
  })
  it('rejects unknown codes', () => {
    expect(isCurrencyCode('XYZ')).toBe(false)
    expect(isCurrencyCode('')).toBe(false)
  })
})
