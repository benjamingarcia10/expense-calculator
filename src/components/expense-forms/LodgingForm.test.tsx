import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LodgingForm } from './LodgingForm'
import { resetSession, useSession } from '../../store/session'

beforeEach(() => {
  localStorage.clear()
  resetSession()
  const s = useSession.getState()
  s.addPerson('Alice')
  s.addPerson('Bob')
})

describe('LodgingForm', () => {
  it('creates a simple lodging expense', async () => {
    const user = userEvent.setup()
    render(<LodgingForm editing={null} onDone={() => {}} />)
    await user.type(screen.getByLabelText(/title/i), 'Airbnb')
    await user.clear(screen.getByLabelText(/^total/i))
    await user.type(screen.getByLabelText(/^total/i), '600')
    const nightInputs = screen.getAllByLabelText(/nights for/i)
    await user.clear(nightInputs[0]!)
    await user.type(nightInputs[0]!, '3')
    await user.clear(nightInputs[1]!)
    await user.type(nightInputs[1]!, '3')
    await user.click(screen.getByRole('button', { name: /save/i }))
    const e = useSession.getState().expenses[0]
    expect(e?.type).toBe('lodging')
    if (e?.type === 'lodging') {
      expect(e.mode).toBe('simple')
      expect(e.total).toBe(600)
    }
  })
})
