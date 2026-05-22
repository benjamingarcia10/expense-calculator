import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImportDialog } from './ImportDialog'
import { resetSession, useSession } from '../store/session'
import { SCHEMA_VERSION, type Session } from '../types'

function makeSession(over: Partial<Session> = {}): Session {
  return {
    v: SCHEMA_VERSION,
    currency: 'USD',
    title: 'Shared Trip',
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

beforeEach(() => {
  localStorage.clear()
  resetSession()
})

describe('ImportDialog', () => {
  it('renders nothing when there is no pending import', () => {
    render(<ImportDialog pending={null} onAccept={() => {}} onReject={() => {}} />)
    expect(screen.queryByText('Import shared session?')).not.toBeInTheDocument()
  })

  it('summarizes the incoming session for a fresh import', () => {
    render(
      <ImportDialog
        pending={{ kind: 'fresh', session: makeSession() }}
        onAccept={() => {}}
        onReject={() => {}}
      />
    )
    expect(screen.getByText('Import shared session?')).toBeInTheDocument()
    expect(screen.getByText('Shared Trip')).toBeInTheDocument()
    expect(screen.getByText(/2 people · 1 expense/)).toBeInTheDocument()
    expect(screen.getByText('From the shared link')).toBeInTheDocument()
    // No current-session card for a fresh import.
    expect(screen.queryByText(/saved as a backup/i)).not.toBeInTheDocument()
  })

  it('shows both the incoming and the current session for an overwrite', () => {
    const { addPerson, setTitle } = useSession.getState()
    setTitle('My Current Trip')
    addPerson('Carol')

    render(
      <ImportDialog
        pending={{ kind: 'overwrite', session: makeSession({ title: 'Imported Trip' }) }}
        onAccept={() => {}}
        onReject={() => {}}
      />
    )
    expect(screen.getByText('Imported Trip')).toBeInTheDocument()
    expect(screen.getByText('My Current Trip')).toBeInTheDocument()
    expect(screen.getByText(/saved as a backup/i)).toBeInTheDocument()
  })

  it('fires onAccept and onReject from the action buttons', async () => {
    const onAccept = vi.fn()
    const onReject = vi.fn()
    render(
      <ImportDialog
        pending={{ kind: 'fresh', session: makeSession() }}
        onAccept={onAccept}
        onReject={onReject}
      />
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Import' }))
    expect(onAccept).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: 'Keep current' }))
    expect(onReject).toHaveBeenCalledOnce()
  })
})
