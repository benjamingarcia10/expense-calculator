import { describe, it, expect } from 'vitest'
import { distributeByWeight } from './splits'

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
