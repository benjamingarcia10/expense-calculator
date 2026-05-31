import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UpdatedImportDialog } from './UpdatedImportDialog'
import type { PendingImport } from '../hooks/useUrlImport'
import type { LibraryEntry, Session } from '../types'

function buildPending(): NonNullable<PendingImport> {
  const session: Session = {
    v: 1,
    sessionId: '11111111-2222-4333-8444-555555555555',
    currency: 'USD',
    title: 'Berlin',
    people: [],
    expenses: [],
    createdAt: '2026-05-28T00:00:00.000Z',
  }
  const matched: LibraryEntry = {
    entryId: 's_aaaaaaaa',
    session,
    meta: { lastEditedAt: '2026-05-28T00:00:00.000Z' },
  }
  return { kind: 'updated', matched, incoming: { ...session, title: 'Berlin updated' } }
}

describe('UpdatedImportDialog', () => {
  it('renders title with the matched entry name', () => {
    render(
      <UpdatedImportDialog
        pending={buildPending()}
        onReplace={() => {}}
        onKeepBoth={() => {}}
        onReject={() => {}}
      />
    )
    expect(screen.getByText(/Updated version of "Berlin"/)).toBeInTheDocument()
  })

  it('falls back to "Untitled split" when matched title is empty', () => {
    const p = buildPending()
    p.matched.session.title = null
    render(<UpdatedImportDialog pending={p} onReplace={() => {}} onKeepBoth={() => {}} onReject={() => {}} />)
    expect(screen.getByText(/Updated version of "Untitled split"/)).toBeInTheDocument()
  })

  it('calls onReplace when Replace clicked', async () => {
    const fn = vi.fn()
    const user = userEvent.setup()
    render(
      <UpdatedImportDialog
        pending={buildPending()}
        onReplace={fn}
        onKeepBoth={() => {}}
        onReject={() => {}}
      />
    )
    await user.click(screen.getByRole('button', { name: /^Replace$/ }))
    expect(fn).toHaveBeenCalled()
  })

  it('calls onKeepBoth when Keep both clicked', async () => {
    const fn = vi.fn()
    const user = userEvent.setup()
    render(
      <UpdatedImportDialog
        pending={buildPending()}
        onReplace={() => {}}
        onKeepBoth={fn}
        onReject={() => {}}
      />
    )
    await user.click(screen.getByRole('button', { name: /^Keep both$/ }))
    expect(fn).toHaveBeenCalled()
  })

  it('renders nothing when pending is null', () => {
    render(
      <UpdatedImportDialog pending={null} onReplace={() => {}} onKeepBoth={() => {}} onReject={() => {}} />
    )
    expect(screen.queryByText(/Updated version/)).not.toBeInTheDocument()
  })
})
