import type { Expense, ExpenseInput, Session } from '../types'
import { useLibrary } from './library'

type SessionMutations = {
  addPerson: (name: string) => void
  renamePerson: (id: string, name: string) => void
  removePerson: (id: string) => void
  setCurrency: (code: string) => void
  setTitle: (title: string) => void
  addExpense: (input: ExpenseInput) => string
  updateExpense: (id: string, patch: Partial<Expense>) => void
  removeExpense: (id: string) => void
  restoreExpense: (expense: Expense, atIndex: number) => void
  replaceSession: (next: Session) => void
  reset: () => void
}

type ActiveView = Session & SessionMutations

function activeView(s: ReturnType<typeof useLibrary.getState>): ActiveView {
  const entry = s.entries.find((e) => e.entryId === s.activeId)
  // Defensive: if state is corrupt, fall back to seeding. This should never
  // happen in normal flows because every mutation maintains the invariant.
  if (!entry) {
    s.wipeAndSeed()
    const seeded = useLibrary.getState()
    return activeView(seeded)
  }
  return {
    ...entry.session,
    addPerson: s.addPerson,
    renamePerson: s.renamePerson,
    removePerson: s.removePerson,
    setCurrency: s.setCurrency,
    setTitle: s.setTitle,
    addExpense: s.addExpense,
    updateExpense: s.updateExpense,
    removeExpense: s.removeExpense,
    restoreExpense: s.restoreExpense,
    replaceSession: s.replaceActiveSession,
    reset: s.resetActiveSession,
  }
}

interface UseSessionFn {
  <T>(selector: (v: ActiveView) => T): T
  getState(): ActiveView
}

export const useSession: UseSessionFn = Object.assign(
  <T>(selector: (v: ActiveView) => T): T => useLibrary((s) => selector(activeView(s))),
  {
    getState: (): ActiveView => activeView(useLibrary.getState()),
  }
)

/**
 * Test-only fixture helper. Wipes the entire library and seeds one fresh blank
 * entry so each test starts from a clean slate regardless of how many entries
 * the previous test created. Distinct from the user-facing "Delete this session"
 * action (which calls `deleteEntry(activeId)` and falls back to next-recent).
 */
export function resetSession(): void {
  useLibrary.getState().wipeAndSeed()
}
