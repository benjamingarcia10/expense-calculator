import { useMemo, useRef } from 'react'
import { Dialog, Button } from '../ui'
import { useSession } from '../../store/session'
import { computeBalances } from '../../lib/compute-balances'
import { simplifyDebts } from '../../lib/simplify-debts'
import { formatMoney, formatDate } from '../../lib/format'
import { buildSummaryText, downloadJson, downloadImage } from './exports'
import { expenseTotal, type Session } from '../../types'
import type { CurrencyCode } from '../../lib/currencies'

const TYPE_LABELS: Record<string, string> = {
  equal: 'split equally',
  shares: 'by shares',
  exact: 'exact amounts',
  mileage: 'by mileage',
  restaurant: 'itemized',
  lodging: 'by nights',
}

export function SummaryView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const v = useSession((s) => s.v)
  const currency = useSession((s) => s.currency)
  const title = useSession((s) => s.title)
  const people = useSession((s) => s.people)
  const expenses = useSession((s) => s.expenses)
  const createdAt = useSession((s) => s.createdAt)
  const session: Session = { v, currency, title, people, expenses, createdAt }

  const cardRef = useRef<HTMLDivElement>(null)
  const debts = useMemo(() => simplifyDebts(computeBalances(people, expenses)), [people, expenses])
  const totalSpent = expenses.reduce((s, e) => s + expenseTotal(e), 0)
  const c = currency as CurrencyCode

  return (
    <Dialog open={open} onClose={onClose} title="Summary">
      <div className="flex flex-col gap-3">
        <div ref={cardRef} className="flex flex-col gap-4 rounded-xl bg-white p-5 text-slate-900">
          <header className="text-center">
            <h3 className="text-xl font-semibold">{title ?? 'Expense Summary'}</h3>
            <p className="text-xs text-slate-500">{formatDate(createdAt)}</p>
          </header>
          <div className="text-center">
            <p className="text-xs tracking-wide text-slate-500 uppercase">Total spent</p>
            <p className="font-mono text-3xl font-semibold">{formatMoney(totalSpent, c)}</p>
            <p className="text-xs text-slate-500">
              {people.length} {people.length === 1 ? 'person' : 'people'} · {expenses.length}{' '}
              {expenses.length === 1 ? 'expense' : 'expenses'}
            </p>
          </div>
          <div>
            <h4 className="mb-1 text-sm font-semibold">Settle Up</h4>
            {debts.length === 0 ? (
              <p className="text-sm text-slate-500">All even.</p>
            ) : (
              <ul className="flex flex-col gap-1 font-mono text-sm">
                {debts.map((d) => (
                  <li
                    key={`${d.fromMemberId}-${d.toMemberId}`}
                    className="flex justify-between"
                  >
                    <span>
                      {d.fromName} → {d.toName}
                    </span>
                    <span className="tabular-nums">{formatMoney(d.amount, c)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {expenses.length > 0 && (
            <div>
              <h4 className="mb-1 text-sm font-semibold">Breakdown</h4>
              <ul className="flex flex-col gap-1 text-sm">
                {expenses.map((e) => {
                  const payer = people.find((p) => p.id === e.paidById)?.name ?? '?'
                  return (
                    <li key={e.id} className="flex flex-col">
                      <div className="flex justify-between font-mono">
                        <span className="font-sans">{e.title}</span>
                        <span className="tabular-nums">{formatMoney(expenseTotal(e), c)}</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {payer} paid · {TYPE_LABELS[e.type]}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          <p className="pt-2 text-center text-xs text-slate-400">expensecalc</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigator.clipboard.writeText(buildSummaryText(session))}
          >
            Copy as Text
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const node = cardRef.current
              if (!node) return
              void downloadImage(
                node,
                `${(title ?? 'expense-summary').replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}.png`
              )
            }}
          >
            Download Image
          </Button>
          <Button size="sm" variant="ghost" onClick={() => downloadJson(session)}>
            Download JSON
          </Button>
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
