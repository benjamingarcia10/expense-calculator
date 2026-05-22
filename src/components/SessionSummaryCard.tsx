import { expenseTotal, type Session } from '../types'
import { formatDate, formatMoney } from '../lib/format'
import type { CurrencyCode } from '../lib/currencies'

// Just the fields needed to summarize a session at a glance — accepts either a
// full Session (a decoded share payload) or the live store fields.
export type SummarizableSession = Pick<Session, 'currency' | 'title' | 'people' | 'expenses' | 'createdAt'>

// Compact at-a-glance panel: title, grand total, and a people/expenses/date
// meta line. Shared by the onboarding welcome-back card and the import dialog.
export function SessionSummaryCard({ session, label }: { session: SummarizableSession; label?: string }) {
  const { people, expenses, title, currency, createdAt } = session
  const total = expenses.reduce((sum, e) => sum + expenseTotal(e), 0)

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/60 p-4">
      {label && <span className="tag">{label}</span>}
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate font-medium">{title?.trim() || 'Untitled split'}</span>
        <span className="font-mono text-sm font-semibold tabular-nums">
          {formatMoney(total, currency as CurrencyCode)}
        </span>
      </div>
      <div className="tag">
        {people.length} {people.length === 1 ? 'person' : 'people'} · {expenses.length}{' '}
        {expenses.length === 1 ? 'expense' : 'expenses'} · started {formatDate(createdAt)}
      </div>
    </div>
  )
}
