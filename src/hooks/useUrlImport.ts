import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { contentFingerprint, decodeShareHash } from '../lib/url-share'
import { useLibrary } from '../store/library'
import type { LibraryEntry, Session } from '../types'

export type PendingImport = { kind: 'updated'; matched: LibraryEntry; incoming: Session } | null

const UNTITLED = 'Untitled split'
function displayTitle(s: { title: string | null }): string {
  const t = s.title?.trim()
  return t && t.length > 0 ? t : UNTITLED
}

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
      history.replaceState(null, '', window.location.pathname + window.location.search)
      processedHash.current = hash
      return
    }
    const incoming = result.session
    const library = useLibrary.getState()

    const sessionIdMatch = incoming.sessionId
      ? library.entries.find((e) => e.session.sessionId === incoming.sessionId)
      : undefined

    if (sessionIdMatch) {
      if (contentFingerprint(sessionIdMatch.session) === contentFingerprint(incoming)) {
        library.switchEntry(sessionIdMatch.entryId)
        toast.success(`Already in your library — switched to "${displayTitle(sessionIdMatch.session)}"`)
        history.replaceState(null, '', window.location.pathname + window.location.search)
        processedHash.current = hash
        return
      }
      processedHash.current = hash
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
      toast.success(`Already in your library — switched to "${displayTitle(contentMatch.session)}"`)
      history.replaceState(null, '', window.location.pathname + window.location.search)
      processedHash.current = hash
      return
    }

    library.createEntryFromImport(incoming)
    history.replaceState(null, '', window.location.pathname + window.location.search)
    processedHash.current = hash
  }, [hash])

  const acceptReplace = useCallback(() => {
    const current = getPendingSnapshot()
    if (!current) return
    const library = useLibrary.getState()
    library.switchEntry(current.matched.entryId)
    library.replaceActiveSession(current.incoming)
    history.replaceState(null, '', window.location.pathname + window.location.search)
    setPendingExternal(null)
  }, [])

  const acceptKeepBoth = useCallback(() => {
    const current = getPendingSnapshot()
    if (!current) return
    const library = useLibrary.getState()
    const base = displayTitle(current.incoming)
    let suffix = ' (imported)'
    let candidate = base + suffix
    let counter = 2
    while (library.entries.some((e) => (e.session.title ?? '') === candidate)) {
      suffix = ` (imported ${counter})`
      candidate = base + suffix
      counter++
    }
    library.createEntryFromImport({ ...current.incoming, title: candidate })
    history.replaceState(null, '', window.location.pathname + window.location.search)
    setPendingExternal(null)
  }, [])

  const reject = useCallback(() => {
    history.replaceState(null, '', window.location.pathname + window.location.search)
    setPendingExternal(null)
  }, [])

  return { pending, acceptReplace, acceptKeepBoth, reject }
}
