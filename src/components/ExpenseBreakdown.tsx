import { useMemo } from 'react'
import { Receipt as ReceiptIcon, TriangleAlert } from 'lucide-react'
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
  const hasExtras = isRestaurant && (expense.tax > 0 || expense.tip > 0 || expense.serviceFee > 0)
  const unassignedItems = isRestaurant ? expense.items.filter((i) => i.assignedIds.length === 0) : []
  const unassignedTotal = unassignedItems.reduce((s, i) => s + i.price, 0)

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

      {unassignedItems.length > 0 && (
        <div
          role="alert"
          className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
        >
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-1">
            <p>
              <strong className="font-semibold">
                {unassignedItems.length} item{unassignedItems.length === 1 ? '' : 's'}
              </strong>{' '}
              not assigned to anyone —{' '}
              <strong className="font-mono tabular-nums">{formatMoney(unassignedTotal, currency)}</strong> is
              in the total but isn't split, so{' '}
              <span className="font-medium text-[var(--color-ink)]">{breakdown.payerName}</span> ends up
              covering it alone.
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              Edit this expense and assign{' '}
              {unassignedItems.length === 1 ? (
                <span className="font-medium text-[var(--color-ink)]">
                  {unassignedItems[0].name || 'the item'}
                </span>
              ) : (
                'the items'
              )}{' '}
              to balance the split.
            </p>
          </div>
        </div>
      )}

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
                <tr key={line.personId} className="border-t border-[var(--color-border)]">
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
            <li key={line.personId} className="flex items-center justify-between gap-3 px-3 py-2">
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
        <details
          open={unassignedItems.length > 0 || undefined}
          className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm"
        >
          <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs tracking-wide text-[var(--color-muted)] uppercase">
            <ReceiptIcon className="size-4" /> Items ({expense.items.length})
          </summary>
          <ul className="divide-y divide-[var(--color-border)]">
            {expense.items.map((it) => {
              const isUnassigned = it.assignedIds.length === 0
              return (
                <li
                  key={it.id}
                  className={`flex flex-col gap-0.5 px-3 py-2 ${isUnassigned ? 'bg-amber-500/5' : ''}`}
                >
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">{it.name}</span>
                    <span className="font-mono tabular-nums">{formatMoney(it.price, currency)}</span>
                  </div>
                  {isUnassigned ? (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
                      <TriangleAlert className="size-3" aria-hidden="true" /> Not assigned to anyone
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--color-muted)]">
                      Shared by{' '}
                      {it.assignedIds.map((id) => people.find((p) => p.id === id)?.name ?? '?').join(', ')}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </details>
      )}
    </div>
  )
}
