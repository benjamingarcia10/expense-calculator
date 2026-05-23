import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ShareDialog } from './ShareDialog'
import { resetSession, useSession } from '../../store/session'

beforeEach(() => {
  localStorage.clear()
  resetSession()
})

describe('ShareDialog QR code', () => {
  it('renders a QR for the share URL on small sessions', async () => {
    const { addPerson, addExpense } = useSession.getState()
    addPerson('Alice')
    const [alice] = useSession.getState().people
    addExpense({
      type: 'equal',
      title: 'Dinner',
      paidById: alice.id,
      total: 20,
      participantIds: [alice.id],
    })

    render(<ShareDialog open onClose={() => {}} />)

    // `qrcode.react` is now code-split via React.lazy, so the QR mounts after
    // the Suspense boundary resolves — `findByLabelText` waits for it.
    const qr = await screen.findByLabelText(/QR code for this share link/i)
    expect(qr).toBeInTheDocument()
    expect(qr.tagName.toLowerCase()).toBe('svg')
  })
})
