import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EqualForm } from './EqualForm'
import { resetSession, useSession } from '../../store/session'

beforeEach(() => {
  localStorage.clear()
  resetSession()
  const s = useSession.getState()
  s.addPerson('Alice')
  s.addPerson('Bob')
})

describe('EqualForm', () => {
  it('creates an equal expense', async () => {
    const user = userEvent.setup()
    render(<EqualForm editing={null} onDone={() => {}} />)
    await user.type(screen.getByLabelText(/title/i), 'Dinner')
    await user.clear(screen.getByLabelText(/total/i))
    await user.type(screen.getByLabelText(/total/i), '100')
    await user.click(screen.getByRole('button', { name: /save/i }))
    const expenses = useSession.getState().expenses
    expect(expenses).toHaveLength(1)
    expect(expenses[0]?.type).toBe('equal')
    if (expenses[0]?.type === 'equal') expect(expenses[0].total).toBe(100)
  })

  it('does not save when title is empty', async () => {
    const user = userEvent.setup()
    render(<EqualForm editing={null} onDone={() => {}} />)
    await user.clear(screen.getByLabelText(/total/i))
    await user.type(screen.getByLabelText(/total/i), '50')
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(useSession.getState().expenses).toHaveLength(0)
  })
})
