import type { LibraryEntry, Session } from '../types'

const UNTITLED_FALLBACK = 'Untitled split'

/**
 * Human-readable label for a session. Falls back through:
 *   1. The user-set title (if non-blank).
 *   2. The first one or two people's names, joined.
 *   3. "Untitled split" as a final fallback when there's no signal.
 *
 * Used by the SessionSwitcher dropdown, ManageLibrarySheet rows, and the
 * silent-import toast so a fresh library with three blank entries doesn't
 * show three identical-looking "Untitled split" rows.
 */
export function sessionDisplayTitle(session: Pick<Session, 'title' | 'people'>): string {
  const t = session.title?.trim()
  if (t && t.length > 0) return t
  const names = session.people.map((p) => p.name.trim()).filter(Boolean)
  if (names.length === 1) return `${names[0]}'s split`
  if (names.length === 2) return `${names[0]} & ${names[1]}`
  if (names.length >= 3) return `${names[0]}, ${names[1]} +${names.length - 2}`
  return UNTITLED_FALLBACK
}

/** Convenience wrapper for a LibraryEntry. Delegates to sessionDisplayTitle. */
export function entryDisplayTitle(entry: LibraryEntry): string {
  return sessionDisplayTitle(entry.session)
}

/**
 * True iff the entry has no user-set title, used to render the label in the
 * placeholder/muted style so users can tell at a glance which entries are
 * still un-named.
 */
export function entryHasGivenTitle(entry: LibraryEntry): boolean {
  return !!entry.session.title?.trim()
}

/**
 * Compact relative time formatter — "just now", "3h ago", "yesterday",
 * "May 28". Used in the manage sheet's row metadata so users can tell at a
 * glance which entry they touched most recently.
 */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const diff = now.getTime() - t
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return 'just now'
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`
  if (diff < day) return `${Math.floor(diff / hour)}h ago`
  if (diff < 2 * day) return 'yesterday'
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`
  // Older than a week — show a short calendar date.
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
