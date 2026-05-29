import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import {
  SCHEMA_VERSION,
  type Expense,
  type ExpenseInput,
  type Library,
  type LibraryEntry,
  type Session,
} from '../types'
import {
  sanitizeName,
  sanitizeTitle,
  sanitizeItemName,
  sanitizeUnitLabel,
  sanitizeSessionTitle,
  LIMITS,
} from '../lib/validation'
import { DEFAULT_CURRENCY, isCurrencyCode } from '../lib/currencies'
import { newEntryId, newSessionId } from '../lib/ids'

const PERSIST_KEY = 'expense-calculator-library'

function freshSession(): Session {
  return {
    v: SCHEMA_VERSION,
    sessionId: null,
    currency: DEFAULT_CURRENCY,
    title: null,
    people: [],
    expenses: [],
    createdAt: new Date().toISOString(),
  }
}

function freshEntry(): LibraryEntry {
  return {
    entryId: newEntryId(),
    session: freshSession(),
    meta: { lastEditedAt: new Date().toISOString() },
  }
}

function initialLibrary(): Library {
  const entry = freshEntry()
  return { entries: [entry], activeId: entry.entryId }
}

function mostRecentNotMatching(entries: LibraryEntry[], excludeId: string): LibraryEntry | undefined {
  return entries
    .filter((e) => e.entryId !== excludeId)
    .slice()
    .sort((a, b) => b.meta.lastEditedAt.localeCompare(a.meta.lastEditedAt))[0]
}

function newExpenseId(): string {
  return 'e_' + Math.random().toString(36).slice(2, 10).padEnd(8, '0')
}

function cleanupExpenseAfterPersonRemoval(expense: Expense, removedId: string): Expense | null {
  if (expense.paidById === removedId) return null
  switch (expense.type) {
    case 'equal':
      return { ...expense, participantIds: expense.participantIds.filter((id) => id !== removedId) }
    case 'shares': {
      const shares = { ...expense.shares }
      delete shares[removedId]
      return { ...expense, shares }
    }
    case 'exact': {
      const amounts = { ...expense.amounts }
      delete amounts[removedId]
      return { ...expense, amounts }
    }
    case 'mileage': {
      const units = { ...expense.units }
      delete units[removedId]
      return { ...expense, units }
    }
    case 'restaurant':
      return {
        ...expense,
        items: expense.items.map((i) => ({
          ...i,
          assignedIds: i.assignedIds.filter((id) => id !== removedId),
        })),
      }
    case 'lodging': {
      const nights = { ...expense.nights }
      delete nights[removedId]
      if (expense.assignments) {
        const assignments = { ...expense.assignments }
        delete assignments[removedId]
        return { ...expense, nights, assignments }
      }
      return { ...expense, nights }
    }
  }
}

type LibraryStore = Library & {
  // entry mutations (Task 6)
  createEntry: () => string
  switchEntry: (entryId: string) => void
  deleteEntry: (entryId: string) => void
  wipeAndSeed: () => void

  // active-routed mutations (Task 7)
  addPerson: (name: string) => void
  renamePerson: (id: string, name: string) => void
  removePerson: (id: string) => void
  setCurrency: (code: string) => void
  setTitle: (title: string) => void
  addExpense: (input: ExpenseInput) => string
  updateExpense: (id: string, patch: Partial<Expense>) => void
  removeExpense: (id: string) => void
  restoreExpense: (expense: Expense, atIndex: number) => void

  // sessionId + import mutations (Task 8)
  ensureSessionId: (entryId: string) => string
  adoptSessionId: (entryId: string, sessionId: string) => void
  renameEntry: (entryId: string, title: string) => void
  duplicateEntry: (entryId: string) => string
  replaceActiveSession: (next: Session) => void
  createEntryFromImport: (session: Session) => string
}

type GetFn = () => LibraryStore
type SetFn = (partial: Partial<LibraryStore>) => void

function updateActive(get: GetFn, set: SetFn, fn: (s: Session) => Session): void {
  const { entries, activeId } = get()
  const next = entries.map((e) =>
    e.entryId === activeId
      ? { ...e, session: fn(e.session), meta: { ...e.meta, lastEditedAt: new Date().toISOString() } }
      : e
  )
  set({ entries: next })
}

const quotaSafeStorage: StateStorage = {
  getItem: (k) => localStorage.getItem(k),
  setItem: (k, v) => localStorage.setItem(k, v),
  removeItem: (k) => localStorage.removeItem(k),
}

export const useLibrary = create<LibraryStore>()(
  persist(
    (set, get) => ({
      ...initialLibrary(),

      createEntry: () => {
        const entry = freshEntry()
        set({ entries: [...get().entries, entry], activeId: entry.entryId })
        return entry.entryId
      },

      switchEntry: (entryId) => {
        if (get().entries.some((e) => e.entryId === entryId)) set({ activeId: entryId })
      },

      deleteEntry: (entryId) => {
        const { entries, activeId } = get()
        const remaining = entries.filter((e) => e.entryId !== entryId)
        if (remaining.length === 0) {
          const seed = freshEntry()
          set({ entries: [seed], activeId: seed.entryId })
          return
        }
        let nextActive = activeId
        if (activeId === entryId) {
          const fallback = mostRecentNotMatching(entries, entryId)!
          nextActive = fallback.entryId
        }
        set({ entries: remaining, activeId: nextActive })
      },

      wipeAndSeed: () => {
        const seed = freshEntry()
        set({ entries: [seed], activeId: seed.entryId })
      },

      addPerson: (name) => {
        const sanitized = sanitizeName(name)
        if (!sanitized) return
        updateActive(get, set, (s) => {
          if (s.people.length >= LIMITS.maxPeople) return s
          const id = 'p_' + Math.random().toString(36).slice(2, 10).padEnd(8, '0')
          return { ...s, people: [...s.people, { id, name: sanitized }] }
        })
      },

      renamePerson: (id, name) => {
        const sanitized = sanitizeName(name)
        if (!sanitized) return
        updateActive(get, set, (s) => ({
          ...s,
          people: s.people.map((p) => (p.id === id ? { ...p, name: sanitized } : p)),
        }))
      },

      removePerson: (id) => {
        updateActive(get, set, (s) => {
          const next: Expense[] = []
          for (const e of s.expenses) {
            const cleaned = cleanupExpenseAfterPersonRemoval(e, id)
            if (cleaned) next.push(cleaned)
          }
          return { ...s, people: s.people.filter((p) => p.id !== id), expenses: next }
        })
      },

      setCurrency: (code) => {
        if (!isCurrencyCode(code)) return
        updateActive(get, set, (s) => ({ ...s, currency: code }))
      },

      setTitle: (title) => {
        const sanitized = sanitizeSessionTitle(title) || null
        updateActive(get, set, (s) => ({ ...s, title: sanitized }))
      },

      addExpense: (input) => {
        let createdId = ''
        updateActive(get, set, (s) => {
          if (s.expenses.length >= LIMITS.maxExpenses) return s
          const id = newExpenseId()
          createdId = id
          const sanitized: Expense = { ...input, id, title: sanitizeTitle(input.title) } as Expense
          if (sanitized.type === 'restaurant') {
            sanitized.items = sanitized.items.map((i) => ({ ...i, name: sanitizeItemName(i.name) }))
          }
          if (sanitized.type === 'mileage') {
            sanitized.unitLabel = sanitizeUnitLabel(sanitized.unitLabel)
          }
          return { ...s, expenses: [...s.expenses, sanitized] }
        })
        return createdId
      },

      updateExpense: (id, patch) => {
        updateActive(get, set, (s) => ({
          ...s,
          expenses: s.expenses.map((e) => {
            if (e.id !== id) return e
            const merged = { ...e, ...patch } as Expense
            if (patch.title !== undefined) merged.title = sanitizeTitle(patch.title)
            return merged
          }),
        }))
      },

      removeExpense: (id) => {
        updateActive(get, set, (s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }))
      },

      restoreExpense: (expense, atIndex) => {
        updateActive(get, set, (s) => {
          if (s.expenses.some((e) => e.id === expense.id)) return s
          if (s.expenses.length >= LIMITS.maxExpenses) return s
          const idx = Math.max(0, Math.min(atIndex, s.expenses.length))
          return { ...s, expenses: [...s.expenses.slice(0, idx), expense, ...s.expenses.slice(idx)] }
        })
      },

      ensureSessionId: (entryId) => {
        const found = get().entries.find((e) => e.entryId === entryId)
        if (!found) return ''
        if (found.session.sessionId) {
          set({
            entries: get().entries.map((e) =>
              e.entryId === entryId
                ? { ...e, meta: { ...e.meta, lastSharedAt: new Date().toISOString() } }
                : e
            ),
          })
          return found.session.sessionId
        }
        const sid = newSessionId()
        set({
          entries: get().entries.map((e) =>
            e.entryId === entryId
              ? {
                  ...e,
                  session: { ...e.session, sessionId: sid },
                  meta: { ...e.meta, lastSharedAt: new Date().toISOString() },
                }
              : e
          ),
        })
        return sid
      },

      adoptSessionId: (entryId, sessionId) => {
        set({
          entries: get().entries.map((e) =>
            e.entryId === entryId && e.session.sessionId === null
              ? { ...e, session: { ...e.session, sessionId } }
              : e
          ),
        })
      },

      renameEntry: (entryId, title) => {
        const sanitized = sanitizeSessionTitle(title) || null
        set({
          entries: get().entries.map((e) =>
            e.entryId === entryId
              ? {
                  ...e,
                  session: { ...e.session, title: sanitized },
                  meta: { ...e.meta, lastEditedAt: new Date().toISOString() },
                }
              : e
          ),
        })
      },

      duplicateEntry: (entryId) => {
        const src = get().entries.find((e) => e.entryId === entryId)
        if (!src) return ''
        const now = new Date().toISOString()
        const baseTitle = (src.session.title ?? 'Untitled split').trim()
        const dup: LibraryEntry = {
          entryId: newEntryId(),
          session: {
            ...src.session,
            sessionId: null,
            title: `${baseTitle} (copy)`,
            createdAt: now,
          },
          meta: { lastEditedAt: now },
        }
        set({ entries: [...get().entries, dup], activeId: dup.entryId })
        return dup.entryId
      },

      replaceActiveSession: (next) => {
        const { entries, activeId } = get()
        const now = new Date().toISOString()
        set({
          entries: entries.map((e) =>
            e.entryId === activeId
              ? { ...e, session: next, meta: { ...e.meta, lastEditedAt: now, lastImportedAt: now } }
              : e
          ),
        })
      },

      createEntryFromImport: (session) => {
        const now = new Date().toISOString()
        const entry: LibraryEntry = {
          entryId: newEntryId(),
          session,
          meta: { lastEditedAt: now, lastImportedAt: now },
        }
        set({ entries: [...get().entries, entry], activeId: entry.entryId })
        return entry.entryId
      },
    }),
    {
      name: PERSIST_KEY,
      storage: createJSONStorage(() => quotaSafeStorage),
      partialize: (s) => ({ entries: s.entries, activeId: s.activeId }) as Library,
    }
  )
)
