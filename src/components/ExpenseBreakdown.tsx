import { useMemo } from 'react'
import { Receipt } from 'lucide-react'
import { useSession } from '../store/session'
import { computeExpenseBreakdown } from '../lib/expense-breakdown'
import { formatMoney } from '../lib/format'
import { expenseTotal, type Expense } from '../types'
import type { CurrencyCode } from '../lib/currencies'
import { EXPENSE_TYPE_LABELS } from './summary/exports'

/**
 * Inline read-only breakdown of a single expense, designed to live inside the
 * expense list as an accordion panel. Renders a real `<table>` for the restaurant
 * case so columns naturally synchronize between header and body without relying
 * on independent grid tracks.
 */
export function ExpenseBreakdown({ expense }: { expense: Expense }) {
  const people = useSession((s) => s.people)
  const currency = useSession((s) => s.currency) as CurrencyCode

  const breakdown = useMemo(() => computeExpenseBreakdown(expense, people), [expense, people])

  const isRestaurant = expense.type === 'restaurant'
  const isTieredLodging = expense.type === 'lodging' && expense.mode === 'tiered'
  const total = expenseTotal(expense)
  const hasExtras =
    isRestaurant && (expense.tax > 0 || expense.tip > 0 || expense.serviceFee > 0)

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-border)]/15 px-4 py-3">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2 text-xs">
          <span className="tracking-wide text-[var(--color-muted)] uppercase">
            {EXPENSE_TYPE_LABELS[expense.type]}
          </span>
          <span className="text-[var(--color-muted)]">·</span>
          <span className="text-[var(--color-muted)]">
            Paid by <span className="font-medium text-[var(--color-ink)]">{breakdown.payerName}</span>
          </span>
        </div>
        <span className="font-mono text-sm tabular-nums text-[var(--color-muted)]">
          Total <span className="font-semibold text-[var(--color-ink)]">{formatMoney(total, currency)}</span>
        </span>
      </header>

      {isRestaurant && (
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-[10px] tracking-wider text-[var(--color-muted)] uppercase">
                <th className="px-2 py-1.5 text-left font-medium">Person</th>
                <th className="px-2 py-1.5 text-right font-medium">Food</th>
                {hasExtras && (
                  <>
                    <th className="px-2 py-1.5 text-right font-medium">Tax</th>
                    <th className="px-2 py-1.5 text-right font-medium">Tip</th>
                    <th className="px-2 py-1.5 text-right font-medium">Service</th>
                  </>
                )}
                <th className="px-2 py-1.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.lines.map((line) => (
                <tr
                  key={line.personId}
                  className="border-t border-[var(--color-border)]"
                >
                  <td className="px-2 py-1.5 font-medium">{line.name}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                    {formatMoney(line.food, currency)}
                  </td>
                  {hasExtras && (
                    <>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-[var(--color-muted)]">
                        {formatMoney(line.tax, currency)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-[var(--color-muted)]">
                        {formatMoney(line.tip, currency)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-[var(--color-muted)]">
                        {formatMoney(line.service, currency)}
                      </td>
                    </>
                  )}
                  <td className="px-2 py-1.5 text-right font-mono font-semibold tabular-nums">
                    {formatMoney(line.total, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isRestaurant && (
        <ul className="flex flex-col divide-y divide-[var(--color-border)] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm">
          {breakdown.lines.map((line) => (
            <li
              key={line.personId}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <span className="truncate">{line.name}</span>
              <div className="flex items-center gap-3">
                {isTieredLodging && line.weight != null && (
                  <span className="font-mono text-xs text-[var(--color-muted)]">
                    weight {line.weight.toFixed(0)}
                  </span>
                )}
                <span className="font-mono font-semibold tabular-nums">
                  {formatMoney(line.total, currency)}
                </span>
              </div>
            </li>
          ))}
          {breakdown.lines.length === 0 && (
            <li className="px-3 py-4 text-sm text-[var(--color-muted)]">
              Nobody is included in this split yet.
            </li>
          )}
        </ul>
      )}

      {isRestaurant && expense.items.length > 0 && (
        <details className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm">
          <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs tracking-wide text-[var(--color-muted)] uppercase">
            <Receipt className="size-4" /> Items ({expense.items.length})
          </summary>
          <ul className="divide-y divide-[var(--color-border)]">
            {expense.items.map((it) => (
              <li key={it.id} className="flex flex-col gap-0.5 px-3 py-2">
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
    </div>
  )
}
