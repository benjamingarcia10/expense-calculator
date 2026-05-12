import { describe, it, expect } from 'vitest'
import { buildSummaryText } from './exports'
import { SCHEMA_VERSION, type Session } from '../../types'

const session: Session = {
  v: SCHEMA_VERSION,
  currency: 'USD',
  title: 'Tahoe',
  people: [
    { id: 'a', name: 'Alice' },
    { id: 'b', name: 'Bob' },
  ],
  expenses: [
    {
      id: 'e1',
      type: 'equal',
      title: 'Dinner',
      total: 100,
      paidById: 'a',
      participantIds: ['a', 'b'],
    },
  ],
  createdAt: '2026-03-08T00:00:00.000Z',
}

describe('buildSummaryText', () => {
  it('includes total and settle-up lines', () => {
    const text = buildSummaryText(session)
    expect(text).toContain('Tahoe')
    expect(text).toContain('Settle up')
    expect(text).toMatch(/Bob.*Alice.*\$50/)
  })

  it('handles empty settle-up', () => {
    const empty: Session = { ...session, expenses: [] }
    const text = buildSummaryText(empty)
    expect(text).toContain('All even')
  })
})
