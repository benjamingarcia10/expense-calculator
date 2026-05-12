import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useSession } from '../store/session'
import { computeBalances } from '../lib/compute-balances'
import { formatSigned } from '../lib/format'
import type { CurrencyCode } from '../lib/currencies'

export function BalancesPanel() {
  const people = useSession((s) => s.people)
  const expenses = useSession((s) => s.expenses)
  const currency = useSession((s) => s.currency) as CurrencyCode

  const balances = useMemo(() => computeBalances(people, expenses), [people, expenses])
  const max = Math.max(1, ...balances.map((b) => Math.abs(b.net)))

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="font-semibold">Balances</h2>
      {balances.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">Add people and expenses to see balances.</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {balances.map((b) => {
            const pct = (Math.abs(b.net) / max) * 100
            const positive = b.net > 0
            return (
              <li key={b.memberId} className="flex flex-col gap-1">
                <div className="flex justify-between font-mono">
                  <span className="font-sans">{b.name}</span>
                  <span className={positive ? 'text-emerald-600' : 'text-rose-600'}>
                    {formatSigned(b.net, currency)}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[var(--color-border)]/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className={`h-full rounded-full ${positive ? 'bg-emerald-500' : 'bg-rose-500'}`}
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
