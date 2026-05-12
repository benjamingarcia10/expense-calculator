import { describe, it, expect } from 'vitest'
import { computeLodgingSplit } from './lodging'

describe('computeLodgingSplit — simple', () => {
  it('proportional by nights', () => {
    const r = computeLodgingSplit({
      total: 600,
      mode: 'simple',
      nights: { a: 3, b: 3 },
    })
    expect(r.a).toBe(300)
    expect(r.b).toBe(300)
  })

  it('uneven nights', () => {
    const r = computeLodgingSplit({
      total: 600,
      mode: 'simple',
      nights: { a: 4, b: 2 },
    })
    expect(r.a).toBe(400)
    expect(r.b).toBe(200)
  })

  it('penny-exact', () => {
    const r = computeLodgingSplit({
      total: 100,
      mode: 'simple',
      nights: { a: 1, b: 1, c: 1 },
    })
    const sum = Object.values(r).reduce((s, v) => s + v, 0)
    expect(sum).toBeCloseTo(100, 10)
  })

  it('excludes zero-night participants', () => {
    const r = computeLodgingSplit({
      total: 100,
      mode: 'simple',
      nights: { a: 5, b: 0 },
    })
    expect(r).toEqual({ a: 100 })
  })
})

describe('computeLodgingSplit — tiered', () => {
  it('weights by room rate × nights', () => {
    const r = computeLodgingSplit({
      total: 600,
      mode: 'tiered',
      nights: { a: 3, b: 3 },
      rooms: [
        { id: 'r1', name: 'Master', nightlyRate: 200 },
        { id: 'r2', name: 'Twin', nightlyRate: 100 },
      ],
      assignments: { a: 'r1', b: 'r2' },
    })
    // a: 200*3=600 weight, b: 100*3=300 weight, total=900. a's share=600*(600/900)=400, b=200
    expect(r.a).toBe(400)
    expect(r.b).toBe(200)
  })

  it('prorates discrepancy when room totals do not equal total', () => {
    const r = computeLodgingSplit({
      total: 1000, // includes cleaning fee
      mode: 'tiered',
      nights: { a: 3, b: 3 },
      rooms: [
        { id: 'r1', name: 'Master', nightlyRate: 200 },
        { id: 'r2', name: 'Twin', nightlyRate: 100 },
      ],
      assignments: { a: 'r1', b: 'r2' },
    })
    expect(r.a + r.b).toBeCloseTo(1000, 10)
    expect(r.a).toBeGreaterThan(r.b)
  })

  it('falls back to simple if any assignment missing', () => {
    const r = computeLodgingSplit({
      total: 100,
      mode: 'tiered',
      nights: { a: 1, b: 1 },
      rooms: [{ id: 'r1', name: 'Master', nightlyRate: 100 }],
      assignments: { a: 'r1' },
    })
    expect(r.a + r.b).toBeCloseTo(100, 10)
  })
})
