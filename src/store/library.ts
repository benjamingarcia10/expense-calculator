import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { SCHEMA_VERSION, type Library, type LibraryEntry, type Session } from '../types'
import { DEFAULT_CURRENCY } from '../lib/currencies'
import { newEntryId } from '../lib/ids'

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

type LibraryStore = Library & {
  createEntry: () => string
  switchEntry: (entryId: string) => void
  deleteEntry: (entryId: string) => void
  wipeAndSeed: () => void
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
    }),
    {
      name: PERSIST_KEY,
      storage: createJSONStorage(() => quotaSafeStorage),
      partialize: (s) => ({ entries: s.entries, activeId: s.activeId }) as Library,
    }
  )
)
