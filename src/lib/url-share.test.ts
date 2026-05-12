import { describe, it, expect } from 'vitest'
import { encodeSession, decodeShareHash, URL_WARN_LENGTH, buildShareUrl } from './url-share'
import { SCHEMA_VERSION, type Session } from '../types'

const fixture: Session = {
  v: SCHEMA_VERSION,
  currency: 'USD',
  title: 'Tahoe',
  people: [{ id: 'p1', name: 'Alice' }],
  expenses: [
    {
      id: 'e1',
      type: 'equal',
      title: 'Gas',
      total: 50,
      paidById: 'p1',
      participantIds: ['p1'],
    },
  ],
  createdAt: '2026-03-08T00:00:00.000Z',
}

describe('encodeSession / decodeShareHash', () => {
  it('round-trips a session', () => {
    const encoded = encodeSession(fixture)
    const result = decodeShareHash(`#d=${encoded}`)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.session).toEqual(fixture)
  })

  it('produces a URL-safe payload (no + / =)', () => {
    const encoded = encodeSession(fixture)
    expect(encoded).not.toMatch(/[+/=]/)
  })

  it('decodes #d= prefix', () => {
    const encoded = encodeSession(fixture)
    expect(decodeShareHash(`#d=${encoded}`).ok).toBe(true)
  })

  it('returns ok:false for malformed hash', () => {
    expect(decodeShareHash('#d=notvalid').ok).toBe(false)
  })

  it('returns ok:false for missing prefix', () => {
    expect(decodeShareHash('#other=abc').ok).toBe(false)
  })

  it('rejects wrong schema version', () => {
    const old = encodeSession({ ...fixture, v: 99 as 1 })
    expect(decodeShareHash(`#d=${old}`).ok).toBe(false)
  })

  it('exposes a length-warning threshold', () => {
    expect(URL_WARN_LENGTH).toBe(2000)
  })

  it('builds a share URL with hash appended', () => {
    const base = 'https://example.com/app'
    const url = buildShareUrl(base, fixture)
    expect(url).toContain(base)
    expect(url).toContain('#d=')
  })

  it('replaces existing hash in base URL', () => {
    const base = 'https://example.com/app#old=hash'
    const url = buildShareUrl(base, fixture)
    expect(url).toContain('https://example.com/app#d=')
    expect(url).not.toContain('old=hash')
  })

  it('handles complex session with multiple people and expenses', () => {
    const complex: Session = {
      v: SCHEMA_VERSION,
      currency: 'EUR',
      title: 'Europe Roadtrip',
      people: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
        { id: 'p3', name: 'Charlie' },
      ],
      expenses: [
        {
          id: 'e1',
          type: 'equal',
          title: 'Gas',
          total: 100,
          paidById: 'p1',
          participantIds: ['p1', 'p2', 'p3'],
        },
        {
          id: 'e2',
          type: 'restaurant',
          title: 'Dinner',
          paidById: 'p2',
          items: [
            { id: 'i1', name: 'Pizza', price: 20, assignedIds: ['p1', 'p2'] },
            { id: 'i2', name: 'Pasta', price: 18, assignedIds: ['p3'] },
          ],
          tax: 8,
          tip: 5,
          serviceFee: 0,
        },
      ],
      createdAt: '2026-05-12T00:00:00.000Z',
    }
    const encoded = encodeSession(complex)
    const result = decodeShareHash(`#d=${encoded}`)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.session).toEqual(complex)
      expect(result.session.people).toHaveLength(3)
      expect(result.session.expenses).toHaveLength(2)
    }
  })

  it('returns encoded length in result', () => {
    const encoded = encodeSession(fixture)
    const result = decodeShareHash(`#d=${encoded}`)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.encodedLength).toBe(encoded.length)
      expect(result.encodedLength).toBeGreaterThan(0)
    }
  })

  it('handles empty people and expenses', () => {
    const empty: Session = {
      v: SCHEMA_VERSION,
      currency: 'USD',
      title: null,
      people: [],
      expenses: [],
      createdAt: '2026-05-12T00:00:00.000Z',
    }
    const encoded = encodeSession(empty)
    const result = decodeShareHash(`#d=${encoded}`)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.session).toEqual(empty)
  })

  it('rejects invalid JSON after decompression', () => {
    // This will fail at JSON.parse
    const result = decodeShareHash('#d=invalidbase64url')
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('malformed')
  })
})
