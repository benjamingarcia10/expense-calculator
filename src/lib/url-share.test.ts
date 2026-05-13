import { describe, it, expect } from 'vitest'
import { encodeSession, decodeShareHash, URL_WARN_LENGTH, buildShareUrl } from './url-share'
import { SCHEMA_VERSION, type Session } from '../types'

const fixture: Session = {
  v: SCHEMA_VERSION,
  currency: 'USD',
  title: 'Tahoe',
  people: [{ id: 'p0', name: 'Alice' }],
  expenses: [
    {
      id: 'e0',
      type: 'equal',
      title: 'Gas',
      total: 50,
      paidById: 'p0',
      participantIds: ['p0'],
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

  it('round-trips a session with non-canonical input ids (cuid-style)', () => {
    // The encoder strips IDs to indices; the decoder regenerates them as
    // p0, p1, ... — so the input person ids don't need to match the output.
    const cuidish: Session = {
      ...fixture,
      people: [{ id: 'clxyz123abc', name: 'Alice' }],
      expenses: [
        {
          id: 'clxyz999xyz',
          type: 'equal',
          title: 'Gas',
          total: 50,
          paidById: 'clxyz123abc',
          participantIds: ['clxyz123abc'],
        },
      ],
    }
    const result = decodeShareHash(`#d=${encodeSession(cuidish)}`)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.session.people).toEqual([{ id: 'p0', name: 'Alice' }])
      expect(result.session.expenses[0].paidById).toBe('p0')
    }
  })

  it('round-trips every expense type together', () => {
    const complex: Session = {
      v: SCHEMA_VERSION,
      currency: 'EUR',
      title: 'Europe Roadtrip',
      people: [
        { id: 'p0', name: 'Alice' },
        { id: 'p1', name: 'Bob' },
        { id: 'p2', name: 'Charlie' },
      ],
      expenses: [
        {
          id: 'e0',
          type: 'equal',
          title: 'Gas',
          total: 100,
          paidById: 'p0',
          participantIds: ['p0', 'p1', 'p2'],
        },
        {
          id: 'e1',
          type: 'shares',
          title: 'Groceries',
          total: 60,
          paidById: 'p1',
          shares: { p0: 2, p1: 1, p2: 1 },
        },
        {
          id: 'e2',
          type: 'exact',
          title: 'Concert',
          total: 90,
          paidById: 'p0',
          amounts: { p0: 30, p1: 30, p2: 30 },
        },
        {
          id: 'e3',
          type: 'mileage',
          title: 'Road trip',
          total: 120,
          paidById: 'p2',
          unitLabel: 'miles',
          units: { p0: 100, p1: 50, p2: 200 },
        },
        {
          id: 'e4',
          type: 'restaurant',
          title: 'Dinner',
          paidById: 'p1',
          items: [
            { id: 'i4-0', name: 'Pizza', price: 20, assignedIds: ['p0', 'p1'] },
            { id: 'i4-1', name: 'Pasta', price: 18, assignedIds: ['p2'] },
          ],
          tax: 8,
          tip: 5,
          serviceFee: 0,
        },
        {
          id: 'e5',
          type: 'lodging',
          title: 'Hotel',
          total: 800,
          paidById: 'p0',
          mode: 'tiered',
          nights: { p0: 3, p1: 3, p2: 2 },
          rooms: [
            { id: 'r5-0', name: 'King', nightlyRate: 200 },
            { id: 'r5-1', name: 'Twin', nightlyRate: 150 },
          ],
          assignments: { p0: 'r5-0', p1: 'r5-1', p2: 'r5-1' },
        },
      ],
      createdAt: '2026-05-12T00:00:00.000Z',
    }
    const result = decodeShareHash(`#d=${encodeSession(complex)}`)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.session).toEqual(complex)
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

  it('rejects invalid base64url payload', () => {
    const result = decodeShareHash('#d=invalidbase64url')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('malformed')
  })
})
