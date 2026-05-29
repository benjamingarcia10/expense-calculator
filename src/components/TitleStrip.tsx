import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useSession } from '../store/session'
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
  const [editing, setEditing] = useState(false)
  const displayTitle = title?.trim() || UNTITLED
  const isPlaceholder = !title?.trim()

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
        aria-label="open library"
        className={`h-display h-11 flex-1 border-b border-dashed border-[var(--color-border)] bg-transparent pr-9 text-center text-xl outline-none transition-colors ${
          isPlaceholder ? 'text-[var(--color-muted)]' : 'text-[var(--color-ink)]'
        }`}
      >
        {displayTitle}
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
