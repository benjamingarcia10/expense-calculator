import { useCallback, useState } from 'react'
import { useSession } from '../store/session'
import { hasSeenOnboarding, markOnboardingSeen } from '../lib/onboarding'

export type OnboardingView = 'tour' | 'welcome-back' | null

function initialView(): OnboardingView {
  // A share link owns the first-load experience: useUrlImport shows the import
  // dialog, and someone who arrived via a link doesn't need the first-run tour.
  if (typeof window !== 'undefined' && window.location.hash.startsWith('#d=')) {
    return null
  }
  if (hasSeenOnboarding()) return null
  const { people, expenses } = useSession.getState()
  // Has real work but never completed onboarding — e.g. data arrived through an
  // earlier share import. Greet them rather than dropping a tour over live data.
  if (people.length > 0 || expenses.length > 0) return 'welcome-back'
  return 'tour'
}

export function useOnboarding(): {
  view: OnboardingView
  dismiss: () => void
  startTour: () => void
} {
  const [view, setView] = useState<OnboardingView>(initialView)

  const dismiss = useCallback(() => {
    markOnboardingSeen()
    setView(null)
  }, [])

  const startTour = useCallback(() => {
    setView('tour')
  }, [])

  return { view, dismiss, startTour }
}
