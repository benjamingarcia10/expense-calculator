import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PeoplePanel } from './PeoplePanel'
import { resetSession, useSession } from '../store/session'

beforeEach(() => {
  localStorage.clear()
  resetSession()
})

describe('PeoplePanel', () => {
  it('adds a person', async () => {
    render(<PeoplePanel />)
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText(/add a name/i), 'Alice')
    await user.click(screen.getByRole('button', { name: /add/i }))
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('removes a person', async () => {
    render(<PeoplePanel />)
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText(/add a name/i), 'Alice')
    await user.click(screen.getByRole('button', { name: /add/i }))
    await user.click(screen.getByRole('button', { name: /remove Alice/i }))
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  })

  it('disables add when at max', () => {
    const { addPerson } = useSession.getState()
    for (let i = 0; i < 25; i++) addPerson(`P${i}`)
    render(<PeoplePanel />)
    expect(screen.getByRole('button', { name: /add/i })).toBeDisabled()
  })
})

describe('PeoplePanel — remove confirmation detail', () => {
  function seedTripWithCarol(): { carolId: string } {
    const { addPerson, addExpense } = useSession.getState()
    addPerson('Alice')
    addPerson('Bob')
    addPerson('Carol')
    const [alice, bob, carol] = useSession.getState().people
    // Carol paid for one expense (will be deleted on remove)
    addExpense({
      type: 'equal',
      title: 'Taxi',
      paidById: carol.id,
      total: 30,
      participantIds: [alice.id, bob.id, carol.id],
    })
    // Carol participates in a restaurant expense where one item is Carol-only
    addExpense({
      type: 'restaurant',
      title: 'Dinner',
      paidById: alice.id,
      items: [
        { id: 'i1', name: 'Pizza', price: 24, assignedIds: [alice.id, bob.id] },
        { id: 'i2', name: 'Wine', price: 18, assignedIds: [carol.id] },
      ],
      tax: 0,
      tip: 0,
      serviceFee: 0,
    })
    return { carolId: carol.id }
  }

  it('shows nothing destructive when removing an unreferenced person', async () => {
    const { addPerson } = useSession.getState()
    addPerson('Alice')
    render(<PeoplePanel />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /remove alice/i }))
    // No confirm — silent remove
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  })

  it('breaks the impact into paid, participant, and orphan-item counts', async () => {
    seedTripWithCarol()
    render(<PeoplePanel />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /remove carol/i }))

    const dialog = screen.getByRole('dialog')
    // paidCount — Carol paid for Taxi
    expect(dialog).toHaveTextContent(/1 expense they paid for/i)
    // participantCount — Carol is a participant in Dinner only (Taxi is deleted)
    expect(dialog).toHaveTextContent(/removed from 1 other expense/i)
    // orphanedItemCount — Wine is Carol-only
    expect(dialog).toHaveTextContent(/1 item.*left unassigned/i)
    expect(within(dialog).getByRole('alert')).toBeInTheDocument()
  })

  it('pluralizes counts and omits the orphan warning when there are no orphans', async () => {
    const { addPerson, addExpense } = useSession.getState()
    addPerson('Alice')
    addPerson('Bob')
    const [alice, bob] = useSession.getState().people
    // Bob just participates in two equal expenses — no orphan risk, no paid
    addExpense({
      type: 'equal',
      title: 'Coffee',
      paidById: alice.id,
      total: 10,
      participantIds: [alice.id, bob.id],
    })
    addExpense({
      type: 'equal',
      title: 'Lunch',
      paidById: alice.id,
      total: 20,
      participantIds: [alice.id, bob.id],
    })
    render(<PeoplePanel />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /remove bob/i }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent(/removed from 2 other expenses/i)
    expect(dialog).not.toHaveTextContent(/expense they paid for/i)
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('cancels without removing anyone', async () => {
    seedTripWithCarol()
    render(<PeoplePanel />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /remove carol/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Carol')).toBeInTheDocument()
  })
})
