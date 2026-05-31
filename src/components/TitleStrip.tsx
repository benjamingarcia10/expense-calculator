import { useState } from 'react'
import { ChevronDown, Pencil } from 'lucide-react'
import { useSession } from '../store/session'
import { useLibrary } from '../store/library'
import { entryDisplayTitle, entryHasGivenTitle } from '../lib/entry-display'
import { LIMITS } from '../lib/validation'

const UNTITLED = 'Untitled split'

/**
 * Mobile-only title strip. Tapping the title opens the library manage sheet
 * (the mobile equivalent of the desktop SessionSwitcher dropdown). A small
 * pencil button at the trailing edge switches the strip into inline-edit
 * mode for renaming the active session in place. No long-press — both
 * affordances are explicit and discoverable.
 */
export function TitleStrip({ onOpenManage }: { onOpenManage: () => void }) {
  const title = useSession((s) => s.title)
  const setTitle = useSession((s) => s.setTitle)
  // Read the active entry separately so we can use the shared display helper —
  // when the title is null we fall back to the first person's name (e.g.
  // "Alice's split") instead of "Untitled split" so the strip stays informative
  // before the user gets around to naming their split.
  const activeEntry = useLibrary((s) => s.entries.find((e) => e.entryId === s.activeId))
  const [editing, setEditing] = useState(false)
  const displayTitle = activeEntry ? entryDisplayTitle(activeEntry) : UNTITLED
  const isPlaceholder = !activeEntry || !entryHasGivenTitle(activeEntry)

  if (editing) {
    return (
      <div className="group relative pb-5 md:hidden">
        <input
          autoFocus
          aria-label="session title"
          placeholder={UNTITLED}
          value={title ?? ''}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === 'Escape') && setEditing(false)}
          maxLength={LIMITS.sessionTitle}
          className="h-display h-11 w-full border-b border-dashed border-[var(--color-border)] bg-transparent pr-9 text-center text-xl text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-solid focus:border-[var(--color-accent)]"
        />
      </div>
    )
  }

  return (
    <div className="relative flex items-center pb-5 md:hidden">
      <button
        type="button"
        onClick={onOpenManage}
        aria-label="open session library"
        className={`h-display h-11 flex-1 border-b border-dashed border-[var(--color-border)] bg-transparent pr-16 pl-3 text-center text-xl outline-none transition-colors ${
          isPlaceholder ? 'text-[var(--color-muted)]' : 'text-[var(--color-ink)]'
        }`}
      >
        <span className="inline-flex items-center gap-1.5">
          {displayTitle}
          <ChevronDown className="size-3.5 text-[var(--color-muted)]" aria-hidden="true" />
        </span>
      </button>
      <button
        type="button"
        aria-label="rename session"
        onClick={() => setEditing(true)}
        className="absolute top-1/2 right-2 grid size-9 -translate-y-[14px] place-items-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]/40 hover:text-[var(--color-ink)]"
      >
        <Pencil className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
