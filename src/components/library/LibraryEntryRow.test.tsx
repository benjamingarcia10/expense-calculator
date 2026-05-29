import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LibraryEntryRow } from './LibraryEntryRow'
import type { LibraryEntry } from '../../types'

function buildEntry(overrides: Partial<LibraryEntry['session']> = {}): LibraryEntry {
  return {
    entryId: 's_xxxxxxxx',
    session: {
      v: 1,
      sessionId: null,
      currency: 'USD',
      title: 'Berlin',
      people: [
        { id: 'p_a', name: 'A' },
        { id: 'p_b', name: 'B' },
      ],
      expenses: [
        {
          id: 'e_1',
          type: 'equal',
          title: 'Coffee',
          total: 5,
          paidById: 'p_a',
          participantIds: ['p_a', 'p_b'],
        },
      ],
      createdAt: '2026-05-28T00:00:00.000Z',
      ...overrides,
    },
    meta: { lastEditedAt: '2026-05-28T00:00:00.000Z' },
  }
}

describe('LibraryEntryRow', () => {
  it('renders title, people, and expense counts', () => {
    render(<LibraryEntryRow entry={buildEntry()} active={false} onSelect={() => {}} />)
    expect(screen.getByText('Berlin')).toBeInTheDocument()
    expect(screen.getByText(/2 people/)).toBeInTheDocument()
    expect(screen.getByText(/1 expense/)).toBeInTheDocument()
  })

  it('falls back to people names when title is null', () => {
    render(<LibraryEntryRow entry={buildEntry({ title: null })} active={false} onSelect={() => {}} />)
    // Fixture has A and B as people; helper renders them as "A & B".
    expect(screen.getByText('A & B')).toBeInTheDocument()
  })

  it('falls back to "Untitled split" when title and people are both empty', () => {
    render(
      <LibraryEntryRow entry={buildEntry({ title: null, people: [] })} active={false} onSelect={() => {}} />
    )
    expect(screen.getByText('Untitled split')).toBeInTheDocument()
  })

  it('marks active rows with a check indicator', () => {
    const { container } = render(<LibraryEntryRow entry={buildEntry()} active={true} onSelect={() => {}} />)
    expect(container.querySelector('[data-active="true"]')).toBeInTheDocument()
  })

  it('calls onSelect when clicked', async () => {
    const fn = vi.fn()
    const user = userEvent.setup()
    render(<LibraryEntryRow entry={buildEntry()} active={false} onSelect={fn} />)
    await user.click(screen.getByRole('button', { name: /Berlin/ }))
    expect(fn).toHaveBeenCalled()
  })
})
