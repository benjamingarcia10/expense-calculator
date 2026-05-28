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

describe('ExpensesPanel — unassigned items warning', () => {
  it('shows the row tag and breakdown banner when a restaurant has unassigned items', async () => {
    const { addPerson, addExpense } = useSession.getState()
    addPerson('Alice')
    addPerson('Bob')
    const [alice, bob] = useSession.getState().people
    addExpense({
      type: 'restaurant',
      title: 'Dinner',
      paidById: alice.id,
      items: [
        { id: 'i1', name: 'Pizza', price: 24, assignedIds: [alice.id, bob.id] },
        // Wine has no assignees — orphan
        { id: 'i2', name: 'Wine', price: 18, assignedIds: [] },
      ],
      tax: 0,
      tip: 0,
      serviceFee: 0,
    })
    renderPanel()
    const user = userEvent.setup()

    // Row tag is visible without expanding
    expect(screen.getByLabelText(/1 unassigned item/i)).toBeInTheDocument()

    // Expand the breakdown — the alert banner should appear
    await user.click(screen.getByRole('button', { name: /expand dinner/i }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/1 item/i)
    expect(alert).toHaveTextContent(/\$18\.00/)
    expect(alert).toHaveTextContent(/alice ends up covering it/i)
  })

  it('does not show the warning when all items are assigned', () => {
    const { addPerson, addExpense } = useSession.getState()
    addPerson('Alice')
    addPerson('Bob')
    const [alice, bob] = useSession.getState().people
    addExpense({
      type: 'restaurant',
      title: 'Dinner',
      paidById: alice.id,
      items: [{ id: 'i1', name: 'Pizza', price: 24, assignedIds: [alice.id, bob.id] }],
      tax: 0,
      tip: 0,
      serviceFee: 0,
    })
    renderPanel()
    expect(screen.queryByLabelText(/unassigned item/i)).not.toBeInTheDocument()
  })
})

describe('ExpensesPanel — guard against the no-people dead-end', () => {
  it('disables "Add expense" and guides the user when there are no people', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: /add expense/i })).toBeDisabled()
    expect(screen.getByText(/add the people first/i)).toBeInTheDocument()
  })

  it('enables "Add expense" once at least one person exists', () => {
    useSession.getState().addPerson('Alice')
    renderPanel()
    expect(screen.getByRole('button', { name: /add expense/i })).toBeEnabled()
  })
})
