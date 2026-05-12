import { describe, it, expect } from 'vitest'
import {
  distributeByWeight,
  computeEqualSplit,
  computeSharesSplit,
  computeExactSplit,
  computeItemizedSplit,
  EmptySplitError,
  ExactSplitMismatchError,
} from './splits'

describe('distributeByWeight', () => {
  it('splits $10 evenly into 3 with no penny loss', () => {
    const result = distributeByWeight(10, { a: 1, b: 1, c: 1 })
    const sum = Object.values(result).reduce((s, v) => s + v, 0)
    expect(sum).toBeCloseTo(10, 10)
    expect(Object.values(result).every((v) => Math.abs(v - 3.33) <= 0.01)).toBe(true)
  })

  it('proportional weights', () => {
    const result = distributeByWeight(100, { a: 1, b: 2, c: 1 })
    expect(result.a).toBe(25)
    expect(result.b).toBe(50)
    expect(result.c).toBe(25)
  })

  it('excludes zero/negative weights', () => {
    const result = distributeByWeight(100, { a: 1, b: 0, c: -5 })
    expect(result).toEqual({ a: 100 })
  })

  it('returns empty for all-zero weights', () => {
    expect(distributeByWeight(100, { a: 0, b: 0 })).toEqual({})
  })

  it('deterministic tiebreak by key', () => {
    const a = distributeByWeight(10, { z: 1, a: 1, m: 1 })
    const b = distributeByWeight(10, { a: 1, m: 1, z: 1 })
    expect(a).toEqual(b)
  })
})

describe('computeEqualSplit', () => {
  it('splits 100 among 3', () => {
    const r = computeEqualSplit({ total: 100, participantKeys: ['a', 'b', 'c'] })
    expect(r.a + r.b + r.c).toBeCloseTo(100, 10)
  })
  it('throws on empty', () => {
    expect(() => computeEqualSplit({ total: 100, participantKeys: [] })).toThrow(EmptySplitError)
  })
})

describe('computeSharesSplit', () => {
  it('weights apply', () => {
    const r = computeSharesSplit({ total: 90, multipliers: { a: 1, b: 2 } })
    expect(r.a).toBe(30)
    expect(r.b).toBe(60)
  })
  it('throws when all zero', () => {
    expect(() => computeSharesSplit({ total: 100, multipliers: { a: 0, b: 0 } })).toThrow(EmptySplitError)
  })
})

describe('computeExactSplit', () => {
  it('accepts exact sum', () => {
    const r = computeExactSplit({ total: 100, amounts: { a: 60, b: 40 } })
    expect(r).toEqual({ a: 60, b: 40 })
  })
  it('throws on mismatch', () => {
    expect(() => computeExactSplit({ total: 100, amounts: { a: 60, b: 41 } })).toThrow(
      ExactSplitMismatchError
    )
  })
})

describe('computeItemizedSplit', () => {
  it('splits items and prorates tax/tip', () => {
    const r = computeItemizedSplit({
      items: [
        { price: 20, assignedKeys: ['a'] },
        { price: 30, assignedKeys: ['b'] },
      ],
      tax: 5,
      tip: 10,
      serviceFee: 0,
    })
    // Total = 65. a's food: 20 (40% of 50). a gets 20 + 40% of 15 = 26.
    // b's food: 30 (60%). b gets 30 + 60% of 15 = 39.
    expect(r.a).toBeCloseTo(26, 1)
    expect(r.b).toBeCloseTo(39, 1)
    expect(r.a + r.b).toBeCloseTo(65, 10)
  })

  it('splits an item among multiple assignees per-head', () => {
    const r = computeItemizedSplit({
      items: [{ price: 30, assignedKeys: ['a', 'b', 'c'] }],
      tax: 0,
      tip: 0,
      serviceFee: 0,
    })
    expect(r.a + r.b + r.c).toBeCloseTo(30, 10)
  })

  it('ignores items with no assignees', () => {
    const r = computeItemizedSplit({
      items: [
        { price: 10, assignedKeys: ['a'] },
        { price: 50, assignedKeys: [] },
      ],
      tax: 0,
      tip: 0,
      serviceFee: 0,
    })
    expect(r).toEqual({ a: 10 })
  })
})
