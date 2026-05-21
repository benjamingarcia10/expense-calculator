import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toaster } from 'sonner'
import { ExpensesPanel } from './ExpensesPanel'
import { resetSession, useSession } from '../store/session'

beforeEach(() => {
  localStorage.clear()
  resetSession()
})

function renderPanel() {
  return render(
    <>
      <ExpensesPanel />
      <Toaster />
    </>
  )
}

function seed(): { aliceId: string } {
  const { addPerson, addExpense } = useSession.getState()
  addPerson('Alice')
  addPerson('Bob')
  const [alice, bob] = useSession.getState().people
  addExpense({
    type: 'equal',
    title: 'Dinner',
    paidById: alice.id,
    total: 40,
    participantIds: [alice.id, bob.id],
  })
  return { aliceId: alice.id }
}

describe('ExpensesPanel — delete & undo', () => {
  it('deletes immediately (no confirm dialog) and shows an undo toast', async () => {
    seed()
    renderPanel()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /delete dinner/i }))

    // No "Delete?" confirm dialog appears
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // Expense is gone from the list
    expect(screen.queryByText('Dinner')).not.toBeInTheDocument()
    // Toast announces the deletion with an Undo action
    const toast = await screen.findByText(/deleted "dinner"/i)
    expect(toast).toBeInTheDocument()
    expect(
      within(toast.closest('li, [data-sonner-toast]') ?? document.body).getByRole('button', { name: /undo/i })
    ).toBeInTheDocument()
  })

  it('restores the expense at its original index when Undo is clicked', async () => {
    const { aliceId } = seed()
    const { addExpense } = useSession.getState()
    addExpense({
      type: 'equal',
      title: 'Coffee',
      paidById: aliceId,
      total: 10,
      participantIds: [aliceId],
    })
    // Order: [Dinner, Coffee]
    renderPanel()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /delete dinner/i }))
    expect(useSession.getState().expenses.map((e) => e.title)).toEqual(['Coffee'])

    const undo = await screen.findByRole('button', { name: /undo/i })
    await user.click(undo)

    expect(useSession.getState().expenses.map((e) => e.title)).toEqual(['Dinner', 'Coffee'])
  })
})
