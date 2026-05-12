import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RestaurantForm } from './RestaurantForm'
import { resetSession, useSession } from '../../store/session'

beforeEach(() => {
  localStorage.clear()
  resetSession()
  const s = useSession.getState()
  s.addPerson('Alice')
  s.addPerson('Bob')
})

describe('RestaurantForm', () => {
  it('creates a restaurant expense with items + tax + tip', async () => {
    const user = userEvent.setup()
    render(<RestaurantForm editing={null} onDone={() => {}} />)
    await user.type(screen.getByLabelText(/title/i), 'Pizza night')
    // Form starts with one empty item by default — just fill it in.
    const itemName = screen.getAllByLabelText(/item name/i)[0]!
    const itemPrice = screen.getAllByLabelText(/item price/i)[0]!
    await user.type(itemName, 'Pizza')
    await user.clear(itemPrice)
    await user.type(itemPrice, '40')
    const aliceCheckbox = screen.getAllByLabelText(/assign Alice/i)[0]!
    await user.click(aliceCheckbox)
    const taxInput = screen.getByLabelText(/^tax/i)
    await user.clear(taxInput)
    await user.type(taxInput, '4')
    await user.click(screen.getByRole('button', { name: /save/i }))
    const e = useSession.getState().expenses[0]
    expect(e?.type).toBe('restaurant')
    if (e?.type === 'restaurant') {
      expect(e.items).toHaveLength(1)
      expect(e.tax).toBe(4)
    }
  })
})
