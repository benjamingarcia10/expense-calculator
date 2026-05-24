import { useEffect, useRef, useState } from 'react'
import { HelpCircle, MoreVertical, Pencil, RotateCcw } from 'lucide-react'
import { useSession } from '../store/session'
import { CURRENCIES, isCurrencyCode, type CurrencyCode } from '../lib/currencies'
import { APP_FULL_TITLE, APP_NAME } from '../lib/branding'
import { Button, CurrencyPicker, Dialog, Wordmark } from './ui'
import { LIMITS } from '../lib/validation'

export function Header({
  onOpenSummary,
  onOpenShare,
  onReplayTour,
}: {
  onOpenSummary: () => void
  onOpenShare: () => void
  onReplayTour: () => void
}) {
  const currency = useSession((s) => s.currency)
  const setCurrency = useSession((s) => s.setCurrency)
  const title = useSession((s) => s.title)
  const setTitle = useSession((s) => s.setTitle)
  const reset = useSession((s) => s.reset)
  const [confirming, setConfirming] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Mobile overflow menu: close on outside click + Escape.
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  function withMenuClose(fn: () => void) {
    return () => {
      setMenuOpen(false)
      fn()
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg)]/85 backdrop-blur-md [padding-top:env(safe-area-inset-top)]">
      {/* Visually-hidden h1 satisfies the page heading hierarchy (the section
        cards use h2). The visible title is the editable input below — h1
        announces the current session to assistive tech. */}
      <h1 className="sr-only">{title?.trim() ? `${APP_NAME} — ${title.trim()}` : APP_FULL_TITLE}</h1>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
          <Wordmark />
          {/* Title editor lives in the header on desktop where the row has
            real estate. On mobile it's promoted to its own strip (TitleStrip)
            below the header so it gets a proper 44pt touch target and a
            visible affordance instead of disappearing as chromeless text
            squeezed between the wordmark and the Share button. */}
          <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
            <span aria-hidden="true" className="text-[var(--color-rule)]">
              ⁄
            </span>
            {/* max-w-md caps the dashed underline at a designed length so it
              doesn't stretch across hundreds of empty pixels on wide viewports.
              The wrapper still flex-1 so a long title fills up to the cap. */}
            <div className="group relative min-w-0 max-w-md flex-1">
              <input
                aria-label="session title"
                placeholder="Untitled split"
                value={title ?? ''}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={LIMITS.sessionTitle}
                // Dashed underline by default signals "this is editable" without
                // shouting; solidifies + colors on hover/focus. The trailing
                // pencil reinforces the affordance for users who haven't yet
                // learned the dashed-underline convention.
                className="w-full min-w-0 border-b border-dashed border-[var(--color-border)] bg-transparent pr-6 pb-0.5 text-base font-medium tracking-tight text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-muted)] hover:border-solid hover:border-[var(--color-muted)] focus:border-solid focus:border-[var(--color-accent)]"
              />
              <Pencil
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-1 size-3.5 -translate-y-1/2 text-[var(--color-muted)] opacity-60 transition-opacity group-focus-within:opacity-0"
              />
            </div>
          </div>
        </div>

        {/* Desktop chrome: full controls inline */}
        <div className="hidden items-center gap-1.5 md:flex">
          <CurrencyPicker value={currency as CurrencyCode} onChange={(next) => setCurrency(next)} />
          <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-[var(--color-border)]" />
          <Button variant="ghost" size="sm" onClick={onOpenSummary}>
            Summary
          </Button>
          <Button size="sm" onClick={onOpenShare}>
            Share
          </Button>
          <button
            onClick={onReplayTour}
            aria-label="replay tour"
            title="Replay the tour"
            className="grid size-9 place-items-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]/40 hover:text-[var(--color-ink)]"
          >
            <HelpCircle className="size-4" />
          </button>
          <button
            onClick={() => setConfirming(true)}
            aria-label="reset session"
            title="Reset session"
            className="grid size-9 place-items-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]/40 hover:text-[var(--color-ink)]"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>

        {/* Mobile chrome: Share remains primary; everything else collapses into ⋯ */}
        <div ref={menuRef} className="relative flex items-center gap-2 md:hidden">
          <Button size="sm" onClick={onOpenShare}>
            Share
          </Button>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="more options"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="grid size-11 place-items-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]/40 hover:text-[var(--color-ink)]"
          >
            <MoreVertical className="size-5" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute top-full right-0 z-40 mt-2 min-w-56 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-xl"
            >
              <button
                role="menuitem"
                onClick={withMenuClose(onOpenSummary)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[var(--color-ink)] transition-colors hover:bg-[var(--color-accent-soft)]"
              >
                Summary
              </button>
              <button
                role="menuitem"
                onClick={withMenuClose(onReplayTour)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[var(--color-ink)] transition-colors hover:bg-[var(--color-accent-soft)]"
              >
                <HelpCircle className="size-4 text-[var(--color-muted)]" aria-hidden="true" />
                Replay tour
              </button>
              <div className="border-t border-[var(--color-border)] px-4 py-3">
                <label
                  htmlFor="currency-mobile"
                  className="mb-1.5 block text-[10px] tracking-[0.18em] text-[var(--color-muted)] uppercase"
                >
                  Currency
                </label>
                {/* Native <select> opens the iOS wheel picker / Android dropdown —
                  a better mobile UX than nesting our custom listbox inside the
                  menu, where the absolute-positioned dropdown would clip. */}
                <select
                  id="currency-mobile"
                  value={currency}
                  onChange={(e) => isCurrencyCode(e.target.value) && setCurrency(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 font-mono text-base text-[var(--color-ink)]"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} · {c.symbol} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="border-t border-[var(--color-border)]" />
              <button
                role="menuitem"
                onClick={withMenuClose(() => setConfirming(true))}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 transition-colors hover:bg-red-600/10"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Reset session
              </button>
            </div>
          )}
        </div>
      </div>
      <Dialog open={confirming} onClose={() => setConfirming(false)} title="Reset session?">
        <div className="flex flex-col gap-3">
          <p className="text-sm">This clears all people and expenses. This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                reset()
                setConfirming(false)
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Dialog>
    </header>
  )
}
