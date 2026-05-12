import { useMemo } from 'react'
import { Receipt } from 'lucide-react'
import { Dialog, Button } from './ui'
import { useSession } from '../store/session'
import { computeExpenseBreakdown } from '../lib/expense-breakdown'
import { formatMoney } from '../lib/format'
import { expenseTotal, type Expense } from '../types'
import type { CurrencyCode } from '../lib/currencies'
import { EXPENSE_TYPE_LABELS } from './summary/exports'

const SUB_COL = 'text-right font-mono tabular-nums'

export function ExpenseDetail({
  expense,
  onClose,
  onEdit,
}: {
  expense: Expense | null
  onClose: () => void
  onEdit: () => void
}) {
  const people = useSession((s) => s.people)
  const currency = useSession((s) => s.currency) as CurrencyCode

  const breakdown = useMemo(
    () => (expense ? computeExpenseBreakdown(expense, people) : null),
    [expense, people]
  )

  const isRestaurant = expense?.type === 'restaurant'
  const isTieredLodging = expense?.type === 'lodging' && expense.mode === 'tiered'
  const total = expense ? expenseTotal(expense) : 0

  return (
    <Dialog open={expense !== null} onClose={onClose} title={expense ? expense.title : 'Expense'}>
      {expense && breakdown && (
        <div className="flex flex-col gap-4">
          <header className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-xs tracking-wide text-[var(--color-muted)] uppercase">
                {EXPENSE_TYPE_LABELS[expense.type]}
              </span>
              <span className="text-sm text-[var(--color-muted)]">
                Paid by <span className="font-medium text-[var(--color-ink)]">{breakdown.payerName}</span>
              </span>
            </div>
            <div className="text-right">
              <div className="text-xs tracking-wide text-[var(--color-muted)] uppercase">Total</div>
              <div className="font-mono text-xl font-semibold tabular-nums">
                {formatMoney(total, currency)}
              </div>
            </div>
          </header>

          {isRestaurant && (
            <section className="overflow-hidden rounded-xl border border-[var(--color-border)]">
              <div className="grid grid-cols-[1fr_repeat(5,minmax(0,auto))] gap-x-3 border-b border-[var(--color-border)] bg-[var(--color-border)]/20 px-3 py-2 text-[10px] tracking-wider text-[var(--color-muted)] uppercase">
                <span>Person</span>
                <span className={SUB_COL}>Food</span>
                <span className={SUB_COL}>Tax</span>
                <span className={SUB_COL}>Tip</span>
                <span className={SUB_COL}>Service</span>
                <span className={SUB_COL}>Total</span>
              </div>
              <ul className="divide-y divide-[var(--color-border)] text-sm">
                {breakdown.lines.map((line) => (
                  <li
                    key={line.personId}
                    className="grid grid-cols-[1fr_repeat(5,minmax(0,auto))] items-center gap-x-3 px-3 py-2"
                  >
                    <span className="truncate">{line.name}</span>
                    <span className={SUB_COL}>{formatMoney(line.food, currency)}</span>
                    <span className={`${SUB_COL} text-[var(--color-muted)]`}>
                      {formatMoney(line.tax, currency)}
                    </span>
                    <span className={`${SUB_COL} text-[var(--color-muted)]`}>
                      {formatMoney(line.tip, currency)}
                    </span>
                    <span className={`${SUB_COL} text-[var(--color-muted)]`}>
                      {formatMoney(line.service, currency)}
                    </span>
                    <span className={`${SUB_COL} font-semibold`}>{formatMoney(line.total, currency)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!isRestaurant && (
            <section className="overflow-hidden rounded-xl border border-[var(--color-border)]">
              <ul className="divide-y divide-[var(--color-border)] text-sm">
                {breakdown.lines.map((line) => (
                  <li key={line.personId} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="truncate">{line.name}</span>
                    <div className="flex items-center gap-3">
                      {isTieredLodging && line.weight != null && (
                        <span className="text-xs text-[var(--color-muted)]">
                          weight {line.weight.toFixed(0)}
                        </span>
                      )}
                      <span className="font-mono font-semibold tabular-nums">
                        {formatMoney(line.total, currency)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              {breakdown.lines.length === 0 && (
                <p className="px-3 py-4 text-sm text-[var(--color-muted)]">
                  Nobody is included in this split yet.
                </p>
              )}
            </section>
          )}

          {isRestaurant && (
            <details className="rounded-xl border border-[var(--color-border)] text-sm">
              <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs tracking-wide text-[var(--color-muted)] uppercase">
                <Receipt className="size-4" /> Items ({expense.items.length})
              </summary>
              <ul className="divide-y divide-[var(--color-border)]">
                {expense.items.map((it) => (
                  <li key={it.id} className="flex flex-col gap-1 px-3 py-2">
                    <div className="flex justify-between gap-3">
                      <span className="font-medium">{it.name}</span>
                      <span className="font-mono tabular-nums">{formatMoney(it.price, currency)}</span>
                    </div>
                    <span className="text-xs text-[var(--color-muted)]">
                      {it.assignedIds.length === 0
                        ? 'Not assigned'
                        : `Shared by ${it.assignedIds.map((id) => people.find((p) => p.id === id)?.name ?? '?').join(', ')}`}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onEdit}>
              Edit
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}
