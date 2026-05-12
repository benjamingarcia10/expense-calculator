import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
