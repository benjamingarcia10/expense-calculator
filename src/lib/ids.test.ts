import { describe, it, expect } from 'vitest'
import { newEntryId, newSessionId } from './ids'

describe('newEntryId', () => {
  it('returns a string with the s_ prefix', () => {
    const id = newEntryId()
    expect(id).toMatch(/^s_[a-z0-9]{8}$/)
  })

  it('produces unique values across 1000 calls', () => {
    const set = new Set<string>()
    for (let i = 0; i < 1000; i++) set.add(newEntryId())
    expect(set.size).toBe(1000)
  })
})

describe('newSessionId', () => {
  it('returns a canonical UUID v4 string', () => {
    const id = newSessionId()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('produces unique values across 100 calls', () => {
    const set = new Set<string>()
    for (let i = 0; i < 100; i++) set.add(newSessionId())
    expect(set.size).toBe(100)
  })
})
