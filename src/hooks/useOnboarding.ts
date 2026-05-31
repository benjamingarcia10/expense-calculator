import { useCallback, useState } from 'react'
import { useLibrary } from '../store/library'
import { hasSeenOnboarding, markOnboardingSeen } from '../lib/onboarding'

export type OnboardingView = 'tour' | 'welcome-back' | null

function initialView(): OnboardingView {
  // A share link owns the first-load experience: useUrlImport shows the import
  // dialog, and someone who arrived via a link doesn't need the first-run tour.
  if (typeof window !== 'undefined' && window.location.hash.startsWith('#d=')) {
    return null
  }
  if (hasSeenOnboarding()) return null
  // "Has data" is library-wide so an empty active entry next to a populated
  // sibling still routes to welcome-back, not the first-run tour.
  const hasAny = useLibrary
    .getState()
    .entries.some((e) => e.session.people.length > 0 || e.session.expenses.length > 0)
  if (hasAny) return 'welcome-back'
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
