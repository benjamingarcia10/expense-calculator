import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { ManageLibrarySheet } from './ManageLibrarySheet'
import { useLibrary } from '../../store/library'

describe('ManageLibrarySheet', () => {
  beforeEach(() => {
    localStorage.clear()
    useLibrary.getState().wipeAndSeed()
  })

  it('renders the library usage indicator', () => {
    render(<ManageLibrarySheet open={true} onClose={() => {}} />)
    expect(screen.getByText(/used of/i)).toBeInTheDocument()
  })

  it('lists each library entry', () => {
    useLibrary.getState().setTitle('Berlin')
    useLibrary.getState().createEntry()
    useLibrary.getState().setTitle('Tokyo')
    render(<ManageLibrarySheet open={true} onClose={() => {}} />)
    expect(screen.getByText('Berlin')).toBeInTheDocument()
    expect(screen.getByText('Tokyo')).toBeInTheDocument()
  })

  it('inline-renames an entry via the pencil button', async () => {
    const user = userEvent.setup()
    useLibrary.getState().setTitle('Berlin')
    const id = useLibrary.getState().activeId
    render(<ManageLibrarySheet open={true} onClose={() => {}} />)
    await user.click(screen.getByLabelText(/Rename Berlin/i))
    const input = await screen.findByDisplayValue('Berlin')
    await user.clear(input)
    await user.type(input, 'Berlin May{enter}')
    expect(useLibrary.getState().entries.find((e) => e.entryId === id)!.session.title).toBe('Berlin May')
  })

  it('delete shows confirm; confirm removes the entry', async () => {
    const user = userEvent.setup()
    useLibrary.getState().setTitle('Berlin')
    const id = useLibrary.getState().createEntry()
    useLibrary.getState().setTitle('Tokyo')
    render(<ManageLibrarySheet open={true} onClose={() => {}} />)
    await user.click(screen.getAllByLabelText(/More actions for Tokyo/i)[0]!)
    await user.click(screen.getByRole('menuitem', { name: /Delete/i }))
    await user.click(screen.getByRole('button', { name: /^Delete$/i }))
    expect(useLibrary.getState().entries.find((e) => e.entryId === id)).toBeUndefined()
  })

  it('duplicate adds a new entry with " (copy)" suffix', async () => {
    const user = userEvent.setup()
    useLibrary.getState().setTitle('Berlin')
    const before = useLibrary.getState().entries.length
    render(<ManageLibrarySheet open={true} onClose={() => {}} />)
    await user.click(screen.getAllByLabelText(/More actions for Berlin/i)[0]!)
    await user.click(screen.getByRole('menuitem', { name: /Duplicate/i }))
    expect(useLibrary.getState().entries.length).toBe(before + 1)
    expect(useLibrary.getState().entries.some((e) => e.session.title === 'Berlin (copy)')).toBe(true)
  })

  it('copy link mints a sessionId and toasts', async () => {
    const user = userEvent.setup()
    const toastSpy = vi.spyOn(toast, 'success').mockImplementation(() => '')
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    })
    useLibrary.getState().setTitle('Berlin')
    render(<ManageLibrarySheet open={true} onClose={() => {}} />)
    await user.click(screen.getAllByLabelText(/More actions for Berlin/i)[0]!)
    await user.click(screen.getByRole('menuitem', { name: /Copy share link/i }))
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('#d='))
    expect(toastSpy).toHaveBeenCalledWith(expect.stringMatching(/Link copied/i))
    toastSpy.mockRestore()
  })
})
