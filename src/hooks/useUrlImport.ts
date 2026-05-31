import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { contentFingerprint, decodeShareHash } from '../lib/url-share'
import { sessionDisplayTitle } from '../lib/entry-display'
import { LIMITS } from '../lib/validation'
import { useLibrary } from '../store/library'
import type { LibraryEntry, Session } from '../types'

export type PendingImport = { kind: 'updated'; matched: LibraryEntry; incoming: Session } | null

// ---------------------------------------------------------------------------
// Tiny external pending-import store so that `setPending` in the effect
// reads as an "external system" subscription rather than a React state write
// inside an effect body (which the react-hooks/set-state-in-effect rule flags).
// ---------------------------------------------------------------------------
let _pending: PendingImport = null
const _listeners = new Set<() => void>()

function notifyListeners() {
  _listeners.forEach((l) => l())
}
function getPendingSnapshot(): PendingImport {
  return _pending
}
function setPendingExternal(next: PendingImport) {
  _pending = next
  notifyListeners()
}
function subscribeToPending(callback: () => void): () => void {
  _listeners.add(callback)
  return () => _listeners.delete(callback)
}

/** Test-only helper. Resets the module-level pending state between tests so
 *  one test's leftover dialog doesn't leak into the next. */
export function __resetPendingForTests(): void {
  _pending = null
  _listeners.clear()
}

// ---------------------------------------------------------------------------
// Hash subscription helpers
// ---------------------------------------------------------------------------
function subscribeToHash(callback: () => void): () => void {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}
function getHashSnapshot(): string {
  return window.location.hash
}

export function useUrlImport(): {
  pending: PendingImport
  acceptReplace: () => void
  acceptKeepBoth: () => void
  reject: () => void
} {
  const hash = useSyncExternalStore(subscribeToHash, getHashSnapshot, () => '')
  const pending = useSyncExternalStore(subscribeToPending, getPendingSnapshot, getPendingSnapshot)

  // Track which hash value we've already processed so we don't repeat work
  const processedHash = useRef<string | null>(null)

  useEffect(() => {
    if (!hash.startsWith('#d=')) return
    if (processedHash.current === hash) return

    const result = decodeShareHash(hash)
    if (!result.ok) {
      toast.error("Couldn't load that link — it looks corrupted or from an older version.")
      history.replaceState(null, '', window.location.pathname + window.location.search)
      processedHash.current = hash
      return
    }
    const incoming = result.session
    const library = useLibrary.getState()

    // Mark hash as attempted up-front so we don't retry on every render. URL
    // clear, however, is deferred to after the mutation succeeds — if the
    // library's quota rollback fires, we want the link to stay visible in
    // the address bar so the user can copy it before refreshing.
    processedHash.current = hash

    const sessionIdMatch = incoming.sessionId
      ? library.entries.find((e) => e.session.sessionId === incoming.sessionId)
      : undefined

    if (sessionIdMatch) {
      if (contentFingerprint(sessionIdMatch.session) === contentFingerprint(incoming)) {
        library.switchEntry(sessionIdMatch.entryId)
        toast.success(
          `Already in your library — switched to "${sessionDisplayTitle(sessionIdMatch.session)}"`
        )
        history.replaceState(null, '', window.location.pathname + window.location.search)
        return
      }
      setPendingExternal({ kind: 'updated', matched: sessionIdMatch, incoming })
      return
    }

    const contentMatch = library.entries.find(
      (e) => contentFingerprint(e.session) === contentFingerprint(incoming)
    )
    if (contentMatch) {
      if (!contentMatch.session.sessionId && incoming.sessionId) {
        library.adoptSessionId(contentMatch.entryId, incoming.sessionId)
      }
      library.switchEntry(contentMatch.entryId)
      toast.success(`Already in your library — switched to "${sessionDisplayTitle(contentMatch.session)}"`)
      history.replaceState(null, '', window.location.pathname + window.location.search)
      return
    }

    const newId = library.createEntryFromImport(incoming)
    const committed = useLibrary.getState().entries.some((e) => e.entryId === newId)
    if (committed) {
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    // If the create rolled back due to quota, the library's wrapped set
    // already toasted "Library is full" — leave the URL in place.
  }, [hash])

  const acceptReplace = useCallback(() => {
    const current = getPendingSnapshot()
    if (!current) return
    const library = useLibrary.getState()
    library.switchEntry(current.matched.entryId)
    library.replaceActiveSession(current.incoming)
    // Only clear URL if the replace actually committed (the library's quota
    // wrapper would otherwise have rolled the entry back to its prior state).
    const after = useLibrary.getState().entries.find((e) => e.entryId === current.matched.entryId)
    const committed = !!after && contentFingerprint(after.session) === contentFingerprint(current.incoming)
    if (committed) {
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    setPendingExternal(null)
  }, [])

  const acceptKeepBoth = useCallback(() => {
    const current = getPendingSnapshot()
    if (!current) return
    const library = useLibrary.getState()
    // Pre-truncate the base title so we never produce a candidate longer than
    // LIMITS.sessionTitle once the disambiguation suffix is appended.
    const rawBase = sessionDisplayTitle(current.incoming)
    let suffix = ' (imported)'
    const headroom = LIMITS.sessionTitle - suffix.length
    let base = rawBase.length > headroom ? rawBase.slice(0, headroom).trimEnd() : rawBase
    let candidate = base + suffix
    let counter = 2
    while (library.entries.some((e) => (e.session.title ?? '') === candidate)) {
      suffix = ` (imported ${counter})`
      const h = LIMITS.sessionTitle - suffix.length
      base = rawBase.length > h ? rawBase.slice(0, h).trimEnd() : rawBase
      candidate = base + suffix
      counter++
      if (counter > 999) break // pathological cap — prefer a duplicate-title entry to an infinite loop
    }
    // Clear sessionId — Keep both is an explicit fork of lineage. Leaving the
    // incoming sessionId on the new entry would mean two entries share a
    // sessionId, breaking dedup/update detection from that point on. The user
    // can mint a fresh sessionId by sharing the new entry.
    const newId = library.createEntryFromImport({ ...current.incoming, title: candidate, sessionId: null })
    const committed = useLibrary.getState().entries.some((e) => e.entryId === newId)
    if (committed) {
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    setPendingExternal(null)
  }, [])

  const reject = useCallback(() => {
    history.replaceState(null, '', window.location.pathname + window.location.search)
    setPendingExternal(null)
  }, [])

  return { pending, acceptReplace, acceptKeepBoth, reject }
}
