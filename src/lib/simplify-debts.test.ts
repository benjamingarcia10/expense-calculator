import { describe, it, expect } from 'vitest'
import { simplifyDebts } from './simplify-debts'

describe('simplifyDebts', () => {
  it('two-person settlement', () => {
    const r = simplifyDebts([
      { memberId: 'a', name: 'A', net: 50 },
      { memberId: 'b', name: 'B', net: -50 },
    ])
    expect(r).toEqual([{ fromMemberId: 'b', fromName: 'B', toMemberId: 'a', toName: 'A', amount: 50 }])
  })

  it('three-person reduces to 2 transactions', () => {
    const r = simplifyDebts([
      { memberId: 'a', name: 'A', net: 60 },
      { memberId: 'b', name: 'B', net: -40 },
      { memberId: 'c', name: 'C', net: -20 },
    ])
    expect(r.length).toBe(2)
    expect(r.every((t) => t.toMemberId === 'a')).toBe(true)
  })
})
