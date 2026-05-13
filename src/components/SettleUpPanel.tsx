import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Handshake } from 'lucide-react'
import { useSession } from '../store/session'
import { computeBalances } from '../lib/compute-balances'
import { simplifyDebts } from '../lib/simplify-debts'
import { formatMoney } from '../lib/format'
import type { CurrencyCode } from '../lib/currencies'
import { SectionHeading } from './ui'

export function SettleUpPanel() {
  const people = useSession((s) => s.people)
  const expenses = useSession((s) => s.expenses)
  const currency = useSession((s) => s.currency) as CurrencyCode
  const debts = useMemo(() => simplifyDebts(computeBalances(people, expenses)), [people, expenses])

  return (
    <section className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-[var(--color-accent)]/40 bg-[var(--color-surface)] p-5 shadow-lg">
      {/* Accent atmosphere — Settle Up is the destination, the answer the user
       * came for, so it gets a slightly elevated treatment over the other cards. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-[var(--color-accent)] opacity-10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--color-accent-soft)] to-transparent"
      />
      <div className="relative">
        <SectionHeading
          title="Settle Up"
          action={
            debts.length > 0 ? (
              <span className="tag">
                {String(debts.length).padStart(2, '0')} {debts.length === 1 ? 'tx' : 'txs'}
              </span>
            ) : null
          }
        />
      </div>
      <div className="relative">
        {debts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-6 text-center text-sm text-[var(--color-muted)]">
            <Handshake className="size-5 opacity-60" aria-hidden="true" />
            <p className="h-display text-base text-[var(--color-ink)]">All even.</p>
            <p className="text-xs">Add expenses to see who owes whom.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {debts.map((d) => (
                <motion.li
                  key={`${d.fromMemberId}-${d.toMemberId}`}
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-baseline gap-2"
                >
                  <span className="text-sm font-medium">{d.fromName}</span>
                  <ArrowRight className="size-3 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
                  <span className="text-sm font-medium">{d.toName}</span>
                  <span className="leaders mx-1 flex-1" aria-hidden="true" style={{ height: '1em' }} />
                  <span className="font-mono text-base font-semibold tabular-nums">
                    {formatMoney(d.amount, currency)}
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </section>
  )
}
