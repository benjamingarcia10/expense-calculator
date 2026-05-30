import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionSwitcher } from './SessionSwitcher'
import { useLibrary } from '../../store/library'

describe('SessionSwitcher', () => {
  beforeEach(() => {
    localStorage.clear()
    useLibrary.getState().wipeAndSeed()
  })

  it('shows the active title and a chevron', () => {
    useLibrary.getState().setTitle('Berlin')
    render(<SessionSwitcher onOpenManage={() => {}} />)
    expect(screen.getByRole('button', { name: /Berlin/ })).toBeInTheDocument()
  })

  it('opens the dropdown on click and lists all entries', async () => {
    const user = userEvent.setup()
    useLibrary.getState().setTitle('First')
    useLibrary.getState().createEntry()
    useLibrary.getState().setTitle('Second')
    render(<SessionSwitcher onOpenManage={() => {}} />)
    await user.click(screen.getByRole('button', { name: /Second/ }))
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getAllByText('Second').length).toBeGreaterThan(0)
  })

  it('selecting an entry switches the active id and closes the dropdown', async () => {
    const user = userEvent.setup()
    const firstId = useLibrary.getState().activeId
    useLibrary.getState().setTitle('First')
    useLibrary.getState().createEntry()
    useLibrary.getState().setTitle('Second')
    render(<SessionSwitcher onOpenManage={() => {}} />)
    await user.click(screen.getByRole('button', { name: /Second/ }))
    // Rows inside the listbox have role="option" (not button).
    await user.click(screen.getByRole('option', { name: /First/ }))
    expect(useLibrary.getState().activeId).toBe(firstId)
  })

  it('"New session" creates a fresh entry and switches to it', async () => {
    const user = userEvent.setup()
    render(<SessionSwitcher onOpenManage={() => {}} />)
    await user.click(screen.getByRole('button', { name: /Untitled split/i }))
    const before = useLibrary.getState().entries.length
    await user.click(screen.getByRole('button', { name: /New session/ }))
    expect(useLibrary.getState().entries.length).toBe(before + 1)
  })

  it('"Manage library…" calls onOpenManage', async () => {
    const onOpenManage = vi.fn()
    const user = userEvent.setup()
    render(<SessionSwitcher onOpenManage={onOpenManage} />)
    await user.click(screen.getByRole('button', { name: /Untitled split/i }))
    await user.click(screen.getByRole('button', { name: /Manage library/ }))
    expect(onOpenManage).toHaveBeenCalled()
  })

  it('pencil button opens an inline rename for the active entry', async () => {
    const user = userEvent.setup()
    useLibrary.getState().setTitle('Old name')
    render(<SessionSwitcher onOpenManage={() => {}} />)
    await user.click(screen.getByRole('button', { name: /rename session/i }))
    const input = await screen.findByDisplayValue('Old name')
    await user.clear(input)
    await user.type(input, 'Berlin May{enter}')
    const active = useLibrary.getState().entries.find((e) => e.entryId === useLibrary.getState().activeId)!
    expect(active.session.title).toBe('Berlin May')
  })

  it('renders options with proper ARIA semantics', async () => {
    const user = userEvent.setup()
    useLibrary.getState().setTitle('First')
    render(<SessionSwitcher onOpenManage={() => {}} />)
    await user.click(screen.getByRole('button', { name: /First/ }))
    const listbox = screen.getByRole('listbox')
    expect(listbox).toBeInTheDocument()
    const options = screen.getAllByRole('option')
    expect(options.length).toBe(1)
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
  })
})
