import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionSummaryCard, type SummarizableSession } from './SessionSummaryCard'

function makeSession(over: Partial<SummarizableSession> = {}): SummarizableSession {
  return {
    currency: 'USD',
    title: 'Beach Weekend',
    people: [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ],
    expenses: [
      {
        id: 'e1',
        type: 'equal',
        title: 'Dinner',
        paidById: 'p1',
        total: 50,
        participantIds: ['p1', 'p2'],
      },
    ],
    createdAt: '2026-05-01T00:00:00.000Z',
    ...over,
  }
}

describe('SessionSummaryCard', () => {
  it('shows the title, total, and pluralized counts', () => {
    render(<SessionSummaryCard session={makeSession()} />)
    expect(screen.getByText('Beach Weekend')).toBeInTheDocument()
    expect(screen.getByText('$50.00')).toBeInTheDocument()
    expect(screen.getByText(/2 people · 1 expense/)).toBeInTheDocument()
  })

  it('falls back to "Untitled split" and singular nouns', () => {
    render(
      <SessionSummaryCard
        session={makeSession({ title: null, people: [{ id: 'p1', name: 'Alice' }], expenses: [] })}
      />
    )
    expect(screen.getByText('Untitled split')).toBeInTheDocument()
    expect(screen.getByText(/1 person · 0 expenses/)).toBeInTheDocument()
  })

  it('renders an optional label', () => {
    render(<SessionSummaryCard session={makeSession()} label="From the shared link" />)
    expect(screen.getByText('From the shared link')).toBeInTheDocument()
  })
})
