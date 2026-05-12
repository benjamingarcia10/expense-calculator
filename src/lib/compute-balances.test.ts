import { describe, it, expect } from 'vitest'
import { computeBalances } from './compute-balances'
import type { Expense, Person } from '../types'

const people: Person[] = [
  { id: 'a', name: 'Alice' },
  { id: 'b', name: 'Bob' },
]

describe('computeBalances', () => {
  it('one expense — payer owed nothing, others owe', () => {
    const expenses: Expense[] = [
      { id: 'e1', type: 'equal', title: 'd', total: 100, paidById: 'a', participantIds: ['a', 'b'] },
    ]
    const r = computeBalances(people, expenses)
    expect(r.find((b) => b.memberId === 'a')!.net).toBeCloseTo(50, 2)
    expect(r.find((b) => b.memberId === 'b')!.net).toBeCloseTo(-50, 2)
  })

  it('zero net when alice pays for bob and bob pays for alice equally', () => {
    const expenses: Expense[] = [
      { id: 'e1', type: 'equal', title: 'd', total: 50, paidById: 'a', participantIds: ['a', 'b'] },
      { id: 'e2', type: 'equal', title: 'd', total: 50, paidById: 'b', participantIds: ['a', 'b'] },
    ]
    const r = computeBalances(people, expenses)
    // Both should net to 0 — filtered out
    expect(r).toEqual([])
  })
})
