import { Pencil } from 'lucide-react'
import { useSession } from '../store/session'
import { LIMITS } from '../lib/validation'

/**
 * Mobile-only title strip. The desktop header is roomy enough to host the
 * session title inline beside the wordmark, but on a 375px phone that input
 * collapsed to ~125px wide — far too small for the average split name, no
 * touch target, and zero affordance signalling "this is editable."
 *
 * This strip sits at the top of `main`, above the panel grid, only on mobile
 * (`md:hidden`). It's just an italic-display input with a dashed underline
 * + pencil — no "TITLE" label above, because a real receipt doesn't write
 * "TITLE:" above its own title; it just sets it in distinctive type. The
 * placeholder + italic treatment + pencil carry the affordance.
 */
export function TitleStrip() {
  const title = useSession((s) => s.title)
  const setTitle = useSession((s) => s.setTitle)

  return (
    <div className="group relative pb-5 md:hidden">
      <input
        aria-label="session title"
        placeholder="Untitled split"
        value={title ?? ''}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={LIMITS.sessionTitle}
        className="h-display h-11 w-full border-b border-dashed border-[var(--color-border)] bg-transparent pr-9 text-center text-xl text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-solid focus:border-[var(--color-accent)]"
      />
      <Pencil
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-[14px] text-[var(--color-muted)] opacity-60 transition-opacity group-focus-within:opacity-0"
      />
    </div>
  )
}
