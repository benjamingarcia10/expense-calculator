import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExactForm } from './ExactForm'
import { resetSession, useSession } from '../../store/session'

beforeEach(() => {
  localStorage.clear()
  resetSession()
  const s = useSession.getState()
  s.addPerson('Alice')
  s.addPerson('Bob')
})

describe('ExactForm', () => {
  it('blocks save when delta != 0', async () => {
    const user = userEvent.setup()
    render(<ExactForm editing={null} onDone={() => {}} />)
    await user.type(screen.getByLabelText(/title/i), 'Bill')
    await user.clear(screen.getByLabelText(/^total/i))
    await user.type(screen.getByLabelText(/^total/i), '100')
    const amountInputs = screen.getAllByLabelText(/amount for/i)
    await user.clear(amountInputs[0]!)
    await user.type(amountInputs[0]!, '60')
    await user.clear(amountInputs[1]!)
    await user.type(amountInputs[1]!, '41')
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  it('saves when amounts match total', async () => {
    const user = userEvent.setup()
    render(<ExactForm editing={null} onDone={() => {}} />)
    await user.type(screen.getByLabelText(/title/i), 'Bill')
    await user.clear(screen.getByLabelText(/^total/i))
    await user.type(screen.getByLabelText(/^total/i), '100')
    const amountInputs = screen.getAllByLabelText(/amount for/i)
    await user.clear(amountInputs[0]!)
    await user.type(amountInputs[0]!, '60')
    await user.clear(amountInputs[1]!)
    await user.type(amountInputs[1]!, '40')
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(useSession.getState().expenses).toHaveLength(1)
  })
})
