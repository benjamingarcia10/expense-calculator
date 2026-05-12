import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MileageForm } from './MileageForm'
import { resetSession, useSession } from '../../store/session'

beforeEach(() => {
  localStorage.clear()
  resetSession()
  const s = useSession.getState()
  s.addPerson('Alice')
  s.addPerson('Bob')
})

describe('MileageForm', () => {
  it('creates a mileage expense with unit label', async () => {
    const user = userEvent.setup()
    render(<MileageForm editing={null} onDone={() => {}} />)
    await user.type(screen.getByLabelText(/title/i), 'Gas')
    await user.clear(screen.getByLabelText(/^total/i))
    await user.type(screen.getByLabelText(/^total/i), '60')
    await user.clear(screen.getByLabelText(/^unit label/i))
    await user.type(screen.getByLabelText(/^unit label/i), 'miles')
    const inputs = screen.getAllByLabelText(/units for/i)
    await user.clear(inputs[0]!)
    await user.type(inputs[0]!, '100')
    await user.clear(inputs[1]!)
    await user.type(inputs[1]!, '50')
    await user.click(screen.getByRole('button', { name: /save/i }))
    const e = useSession.getState().expenses[0]
    expect(e?.type).toBe('mileage')
    if (e?.type === 'mileage') {
      expect(e.unitLabel).toBe('miles')
      expect(Object.values(e.units).reduce((s, v) => s + v, 0)).toBe(150)
    }
  })
})
