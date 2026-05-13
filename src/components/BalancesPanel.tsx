import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Scale } from 'lucide-react'
import { useSession } from '../store/session'
import { computeBalances } from '../lib/compute-balances'
import { formatMoney } from '../lib/format'
import type { CurrencyCode } from '../lib/currencies'
import { SectionHeading } from './ui'

export function BalancesPanel() {
  const people = useSession((s) => s.people)
  const expenses = useSession((s) => s.expenses)
  const currency = useSession((s) => s.currency) as CurrencyCode

  const balances = useMemo(() => computeBalances(people, expenses), [people, expenses])
  const max = Math.max(1, ...balances.map((b) => Math.abs(b.net)))

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <SectionHeading title="Balances" />
      {balances.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-6 text-center text-sm text-[var(--color-muted)]">
          <Scale className="size-5 opacity-60" aria-hidden="true" />
          <p>Balances appear once you add an expense.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {balances.map((b) => {
            const pct = (Math.abs(b.net) / max) * 100
            const positive = b.net > 0
            const sign = positive ? '+' : '−'
            const abs = Math.abs(b.net)
            return (
              <li key={b.memberId} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">{b.name}</span>
                  <span
                    className={`font-mono text-base tabular-nums ${
                      positive ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {sign}
                    {formatMoney(abs, currency)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                    className={`h-full rounded-full ${
                      positive ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
