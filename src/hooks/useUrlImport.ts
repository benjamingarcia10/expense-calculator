import { useEffect, useState } from 'react'
import { decodeShareHash } from '../lib/url-share'
import { useSession } from '../store/session'
import type { Session } from '../types'

export type PendingImport =
  | { kind: 'overwrite'; session: Session }
  | { kind: 'fresh'; session: Session }
  | null

export function useUrlImport(): {
  pending: PendingImport
  accept: () => void
  reject: () => void
} {
  const [pending, setPending] = useState<PendingImport>(null)

  useEffect(() => {
    if (!window.location.hash.startsWith('#d=')) return
    const result = decodeShareHash(window.location.hash)
    if (!result.ok) return
    const existing = useSession.getState()
    const hasWork = existing.people.length > 0 || existing.expenses.length > 0
    setPending(
      hasWork
        ? { kind: 'overwrite', session: result.session }
        : { kind: 'fresh', session: result.session }
    )
  }, [])

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
    setPending(null)
  }

  function reject() {
    history.replaceState(null, '', window.location.pathname + window.location.search)
    setPending(null)
  }

  return { pending, accept, reject }
}
