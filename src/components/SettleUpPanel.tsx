import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useSession } from '../store/session'
import { computeBalances } from '../lib/compute-balances'
import { simplifyDebts } from '../lib/simplify-debts'
import { formatMoney } from '../lib/format'
import type { CurrencyCode } from '../lib/currencies'

export function SettleUpPanel() {
  const people = useSession((s) => s.people)
  const expenses = useSession((s) => s.expenses)
  const currency = useSession((s) => s.currency) as CurrencyCode
  const debts = useMemo(() => simplifyDebts(computeBalances(people, expenses)), [people, expenses])

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[--color-border] bg-[--color-surface] p-4">
      <h2 className="font-semibold">Settle Up</h2>
      {debts.length === 0 ? (
        <p className="text-sm text-[--color-muted]">All even. Add expenses to see who owes whom.</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          <AnimatePresence initial={false}>
            {debts.map((d) => (
              <motion.li
                key={`${d.fromMemberId}-${d.toMemberId}`}
                layout
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between rounded-md px-2 py-1"
              >
                <span className="flex items-center gap-2">
                  <span>{d.fromName}</span>
                  <ArrowRight className="size-3 text-[--color-muted]" />
                  <span>{d.toName}</span>
                </span>
                <span className="font-mono tabular-nums">{formatMoney(d.amount, currency)}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      {debts.length > 0 && (
        <p className="text-xs text-[--color-muted]">
          {debts.length} transaction{debts.length === 1 ? '' : 's'}
        </p>
      )}
    </section>
  )
}
