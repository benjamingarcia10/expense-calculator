import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { SCHEMA_VERSION, type Expense, type ExpenseInput, type Session } from '../types'
import {
  sanitizeName,
  sanitizeTitle,
  sanitizeItemName,
  sanitizeUnitLabel,
  sanitizeSessionTitle,
  LIMITS,
} from '../lib/validation'
import { DEFAULT_CURRENCY, isCurrencyCode } from '../lib/currencies'

function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function freshSession(): Session {
  return {
    v: SCHEMA_VERSION,
    currency: DEFAULT_CURRENCY,
    title: null,
    people: [],
    expenses: [],
    createdAt: new Date().toISOString(),
  }
}

type SessionStore = Session & {
  addPerson: (name: string) => void
  renamePerson: (id: string, name: string) => void
  removePerson: (id: string) => void
  setCurrency: (code: string) => void
  setTitle: (title: string) => void
  addExpense: (input: ExpenseInput) => string
  updateExpense: (id: string, patch: Partial<Expense>) => void
  removeExpense: (id: string) => void
  replaceSession: (next: Session) => void
  reset: () => void
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

export const useSession = create<SessionStore>()(
  persist(
    (set, get) => ({
      ...freshSession(),

      addPerson: (name) => {
        const sanitized = sanitizeName(name)
        if (!sanitized) return
        if (get().people.length >= LIMITS.maxPeople) return
        set({ people: [...get().people, { id: newId('p'), name: sanitized }] })
      },

      renamePerson: (id, name) => {
        const sanitized = sanitizeName(name)
        if (!sanitized) return
        set({ people: get().people.map((p) => (p.id === id ? { ...p, name: sanitized } : p)) })
      },

      removePerson: (id) => {
        const next: Expense[] = []
        for (const e of get().expenses) {
          const cleaned = cleanupExpenseAfterPersonRemoval(e, id)
          if (cleaned) next.push(cleaned)
        }
        set({ people: get().people.filter((p) => p.id !== id), expenses: next })
      },

      setCurrency: (code) => {
        if (isCurrencyCode(code)) set({ currency: code })
      },

      setTitle: (title) => set({ title: sanitizeSessionTitle(title) || null }),

      addExpense: (input) => {
        if (get().expenses.length >= LIMITS.maxExpenses) return ''
        const id = newId('e')
        const sanitized: Expense = { ...input, id, title: sanitizeTitle(input.title) } as Expense
        if (sanitized.type === 'restaurant') {
          sanitized.items = sanitized.items.map((i) => ({ ...i, name: sanitizeItemName(i.name) }))
        }
        if (sanitized.type === 'mileage') {
          sanitized.unitLabel = sanitizeUnitLabel(sanitized.unitLabel)
        }
        set({ expenses: [...get().expenses, sanitized] })
        return id
      },

      updateExpense: (id, patch) => {
        set({
          expenses: get().expenses.map((e) => {
            if (e.id !== id) return e
            const merged = { ...e, ...patch } as Expense
            if (patch.title !== undefined) merged.title = sanitizeTitle(patch.title)
            return merged
          }),
        })
      },

      removeExpense: (id) => set({ expenses: get().expenses.filter((e) => e.id !== id) }),

      replaceSession: (next) => set({ ...next }),

      reset: () => set({ ...freshSession() }),
    }),
    {
      name: 'expense-calculator-session',
      storage: createJSONStorage(() => localStorage),
      version: SCHEMA_VERSION,
      migrate: (persisted, version) => {
        // No migrations needed yet — accept any prior version as-is.
        // When a breaking change ships, add a migration here instead of letting Zustand wipe state.
        if (version !== SCHEMA_VERSION) {
          console.warn(`Loaded session with schema v${version}, current is v${SCHEMA_VERSION}`)
        }
        return persisted as never
      },
    }
  )
)

export function resetSession(): void {
  useSession.getState().reset()
}
