import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingOverlay } from './OnboardingOverlay'
import { APP_NAME } from '../../lib/branding'
import { resetSession, useSession } from '../../store/session'

const WELCOME = `Welcome to ${APP_NAME}`

beforeEach(() => {
  localStorage.clear()
  resetSession()
})

function seedSession() {
  const { addPerson, addExpense, setTitle } = useSession.getState()
  setTitle('Ski Trip')
  addPerson('Alice')
  addPerson('Bob')
  const [alice, bob] = useSession.getState().people
  addExpense({
    type: 'equal',
    title: 'Dinner',
    paidById: alice.id,
    total: 40,
    participantIds: [alice.id, bob.id],
  })
}

describe('OnboardingOverlay — tour', () => {
  it('renders nothing when view is null', () => {
    render(<OnboardingOverlay view={null} onDismiss={() => {}} onStartTour={() => {}} />)
    expect(screen.queryByText(WELCOME)).not.toBeInTheDocument()
  })

  it('steps through every step and finishes with Get started', async () => {
    const onDismiss = vi.fn()
    render(<OnboardingOverlay view="tour" onDismiss={onDismiss} onStartTour={() => {}} />)
    const user = userEvent.setup()

    expect(screen.getByRole('heading', { name: WELCOME })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByRole('heading', { name: 'Start with the people' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByRole('heading', { name: 'Settle up, then share' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Get started' }))

    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('Skip dismisses immediately', async () => {
    const onDismiss = vi.fn()
    render(<OnboardingOverlay view="tour" onDismiss={onDismiss} onStartTour={() => {}} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Skip' }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})

describe('OnboardingOverlay — welcome back', () => {
  it('shows a summary of the saved session', () => {
    seedSession()
    render(<OnboardingOverlay view="welcome-back" onDismiss={() => {}} onStartTour={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByText('Ski Trip')).toBeInTheDocument()
    expect(screen.getByText(/2 people · 1 expense/)).toBeInTheDocument()
  })

  it('Continue dismisses without touching the session', async () => {
    seedSession()
    const onDismiss = vi.fn()
    render(<OnboardingOverlay view="welcome-back" onDismiss={onDismiss} onStartTour={() => {}} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Continue' }))
    expect(onDismiss).toHaveBeenCalledOnce()
    expect(useSession.getState().people).toHaveLength(2)
  })

  it('Start fresh asks for confirmation before erasing the session', async () => {
    seedSession()
    const onDismiss = vi.fn()
    render(<OnboardingOverlay view="welcome-back" onDismiss={onDismiss} onStartTour={() => {}} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Start fresh' }))
    // Session is untouched until the confirmation is accepted.
    expect(useSession.getState().people).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Erase everything' }))
    expect(useSession.getState().people).toHaveLength(0)
    expect(useSession.getState().expenses).toHaveLength(0)
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('offers the tour to someone who is actually new', async () => {
    seedSession()
    const onStartTour = vi.fn()
    render(<OnboardingOverlay view="welcome-back" onDismiss={() => {}} onStartTour={onStartTour} />)
    await userEvent.setup().click(screen.getByRole('button', { name: /take the quick tour/i }))
    expect(onStartTour).toHaveBeenCalledOnce()
  })
})
