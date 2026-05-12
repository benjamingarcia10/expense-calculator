import { useState, useSyncExternalStore } from 'react'
import { decodeShareHash } from '../lib/url-share'
import { useSession } from '../store/session'
import type { Session } from '../types'

export type PendingImport =
  | { kind: 'overwrite'; session: Session }
  | { kind: 'fresh'; session: Session }
  | null

// Read the URL hash via useSyncExternalStore so React's hash-driven import dialog
// computes the pending value during render rather than after-mount in an effect.
function subscribeToHash(callback: () => void): () => void {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}
function getHashSnapshot(): string {
  return window.location.hash
}
function getServerHashSnapshot(): string {
  return ''
}

function computePendingFromHash(hash: string): PendingImport {
  if (!hash.startsWith('#d=')) return null
  const result = decodeShareHash(hash)
  if (!result.ok) return null
  const existing = useSession.getState()
  const hasWork = existing.people.length > 0 || existing.expenses.length > 0
  return hasWork ? { kind: 'overwrite', session: result.session } : { kind: 'fresh', session: result.session }
}

export function useUrlImport(): {
  pending: PendingImport
  accept: () => void
  reject: () => void
} {
  const hash = useSyncExternalStore(subscribeToHash, getHashSnapshot, getServerHashSnapshot)
  const [dismissed, setDismissed] = useState(false)
  const pending = dismissed ? null : computePendingFromHash(hash)

  function accept() {
    if (!pending) return
    if (pending.kind === 'overwrite') {
      const state = useSession.getState()
      const backup = JSON.stringify({
        v: state.v,
        currency: state.currency,
        title: state.title,
        people: state.people,
        expenses: state.expenses,
        createdAt: state.createdAt,
      })
      try {
        localStorage.setItem(`expense-calculator-backup-${Date.now()}`, backup)
      } catch {
        // localStorage quota exceeded — proceed with import anyway
      }
    }
    useSession.getState().replaceSession(pending.session)
    history.replaceState(null, '', window.location.pathname + window.location.search)
    setDismissed(true)
  }

  function reject() {
    history.replaceState(null, '', window.location.pathname + window.location.search)
    setDismissed(true)
  }

  return { pending, accept, reject }
}
