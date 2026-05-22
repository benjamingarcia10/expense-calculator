// First-run onboarding flag. Kept in its own localStorage key — separate from
// the session — so resetting or clearing a session never re-triggers the tour,
// and importing a share link doesn't depend on it.
const ONBOARDING_KEY = 'expense-calculator-onboarding'

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === '1'
  } catch {
    // localStorage blocked (private mode / disabled) — treat as not-seen.
    return false
  }
}

export function markOnboardingSeen(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, '1')
  } catch {
    // localStorage unavailable — the tour may reappear next visit, which is a
    // benign degradation rather than something worth surfacing to the user.
  }
}
