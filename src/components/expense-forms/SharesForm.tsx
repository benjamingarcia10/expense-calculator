import { useState } from 'react'
import { Button, Input, MoneyInput, NumericInput } from '../ui'
import { useSession } from '../../store/session'
import { LIMITS } from '../../lib/validation'
import { usePeople, parseMoney, clampMoney } from './form-utils'
import type { Expense, SharesExpense } from '../../types'
import type { CurrencyCode } from '../../lib/currencies'

export function SharesForm({ editing, onDone }: { editing: Expense | null; onDone: () => void }) {
  const people = usePeople()
  const currency = useSession((s) => s.currency) as CurrencyCode
  const addExpense = useSession((s) => s.addExpense)
  const updateExpense = useSession((s) => s.updateExpense)
  const initial = editing?.type === 'shares' ? (editing as SharesExpense) : null

  const [title, setTitle] = useState(initial?.title ?? '')
  const [total, setTotal] = useState<string>(initial?.total != null ? String(initial.total) : '')
  const [paidById, setPaidById] = useState(initial?.paidById ?? people[0]?.id ?? '')
  const [shares, setShares] = useState<Record<string, string>>(() => {
    const obj: Record<string, string> = {}
    for (const p of people) obj[p.id] = String(initial?.shares?.[p.id] ?? 1)
    return obj
  })

  function save() {
    const amount = clampMoney(parseMoney(total))
    const parsedShares: Record<string, number> = {}
    for (const [id, v] of Object.entries(shares)) {
      const n = Number(v)
      if (Number.isFinite(n) && n > 0) parsedShares[id] = Math.min(n, LIMITS.sharesMax)
    }
    if (!title.trim() || amount <= 0 || Object.keys(parsedShares).length === 0) return
    if (initial) {
      updateExpense(initial.id, { title, total: amount, paidById, shares: parsedShares })
    } else {
      addExpense({ type: 'shares', title, total: amount, paidById, shares: parsedShares })
    }
    onDone()
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
      className="flex flex-col gap-4"
    >
      <section className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Title</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={LIMITS.expenseTitle}
            placeholder="e.g. Groceries"
            autoFocus
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Total</span>
            <MoneyInput
              aria-label="Total"
              value={total}
              onChange={setTotal}
              currency={currency}
              placeholder="0.00"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Paid by</span>
            <select
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
            >
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <fieldset className="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] p-3 text-sm">
        <legend className="px-1 text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">
          Shares per person
        </legend>
        <p className="px-1 text-xs text-[var(--color-muted)]">
          Higher numbers mean a bigger share. Use 0 to skip someone.
        </p>
        <div className="flex flex-col gap-2">
          {people.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="flex-1 text-sm">{p.name}</span>
              <NumericInput
                aria-label={`shares for ${p.name}`}
                value={shares[p.id] ?? '0'}
                onChange={(v) => setShares({ ...shares, [p.id]: v })}
                max={LIMITS.sharesMax}
                className="w-24"
              />
            </div>
          ))}
        </div>
      </fieldset>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}
