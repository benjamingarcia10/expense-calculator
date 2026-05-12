import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useSession } from '../store/session'
import { CURRENCIES } from '../lib/currencies'
import { Button, Dialog } from './ui'
import { LIMITS } from '../lib/validation'

export function Header({
  onOpenSummary,
  onOpenShare,
}: {
  onOpenSummary: () => void
  onOpenShare: () => void
}) {
  const currency = useSession((s) => s.currency)
  const setCurrency = useSession((s) => s.setCurrency)
  const title = useSession((s) => s.title)
  const setTitle = useSession((s) => s.setTitle)
  const reset = useSession((s) => s.reset)
  const [confirming, setConfirming] = useState(false)

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3 md:px-6">
      <div className="flex flex-1 items-center gap-2">
        <input
          aria-label="session title"
          placeholder="Session title (optional)"
          value={title ?? ''}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={LIMITS.sessionTitle}
          className="bg-transparent text-lg font-semibold tracking-tight outline-none placeholder:text-[var(--color-muted)] md:text-xl"
        />
      </div>
      <div className="flex items-center gap-2">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm"
          aria-label="currency"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code}
            </option>
          ))}
        </select>
        <Button variant="ghost" size="sm" onClick={onOpenSummary}>
          Summary
        </Button>
        <Button size="sm" onClick={onOpenShare}>
          Share
        </Button>
        <button
          onClick={() => setConfirming(true)}
          aria-label="reset"
          className="grid size-11 place-items-center rounded-md text-[var(--color-muted)] hover:bg-[var(--color-border)]/40 hover:text-[var(--color-ink)]"
        >
          <RotateCcw className="size-4" />
        </button>
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
