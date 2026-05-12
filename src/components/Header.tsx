import { useSession } from '../store/session'
import { CURRENCIES } from '../lib/currencies'
import { Button } from './ui'

export function Header({
  onOpenSummary,
  onOpenShare,
}: {
  onOpenSummary: () => void
  onOpenShare: () => void
}) {
  const currency = useSession((s) => s.currency)
  const setCurrency = useSession((s) => s.setCurrency)
  return (
    <header className="flex items-center justify-between gap-3 border-b border-[--color-border] px-4 py-3 md:px-6">
      <h1 className="text-lg font-semibold tracking-tight md:text-xl">Expense Calculator</h1>
      <div className="flex items-center gap-2">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="h-9 rounded-md border border-[--color-border] bg-[--color-surface] px-2 text-sm"
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
      </div>
    </header>
  )
}
