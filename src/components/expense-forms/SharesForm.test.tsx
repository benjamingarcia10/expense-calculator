import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SharesForm } from './SharesForm'
import { resetSession, useSession } from '../../store/session'

beforeEach(() => {
  localStorage.clear()
  resetSession()
  const s = useSession.getState()
  s.addPerson('Alice')
  s.addPerson('Bob')
})

describe('SharesForm', () => {
  it('creates a shares expense with multipliers', async () => {
    const user = userEvent.setup()
    render(<SharesForm editing={null} onDone={() => {}} />)
    await user.type(screen.getByLabelText(/title/i), 'Groceries')
    await user.clear(screen.getByLabelText(/total/i))
    await user.type(screen.getByLabelText(/total/i), '90')
    const shareInputs = screen.getAllByLabelText(/shares for/i)
    await user.clear(shareInputs[0]!)
    await user.type(shareInputs[0]!, '2')
    await user.clear(shareInputs[1]!)
    await user.type(shareInputs[1]!, '1')
    await user.click(screen.getByRole('button', { name: /save/i }))
    const exp = useSession.getState().expenses[0]
    expect(exp?.type).toBe('shares')
    if (exp?.type === 'shares') {
      expect(Object.values(exp.shares).reduce((s, v) => s + v, 0)).toBe(3)
    }
  })
})
