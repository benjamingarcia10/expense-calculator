import { useState } from 'react'
import { Button, Input } from '../ui'
import { useSession } from '../../store/session'
import { LIMITS } from '../../lib/validation'
import { usePeople, parseMoney, clampMoney } from './form-utils'
import type { Expense, SharesExpense } from '../../types'

export function SharesForm({ editing, onDone }: { editing: Expense | null; onDone: () => void }) {
  const people = usePeople()
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
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Title
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={LIMITS.expenseTitle} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Total
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          max={LIMITS.moneyMax}
          step={0.01}
          value={total}
          onChange={(e) => setTotal(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Paid by
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
      <div className="flex flex-col gap-2 text-sm">
        <span className="text-[var(--color-muted)]">Shares per person</span>
        {people.map((p) => (
          <label key={p.id} className="flex items-center gap-2">
            <span className="flex-1">{p.name}</span>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              max={LIMITS.sharesMax}
              step={0.5}
              aria-label={`shares for ${p.name}`}
              value={shares[p.id] ?? '0'}
              onChange={(e) => setShares({ ...shares, [p.id]: e.target.value })}
              className="w-20"
            />
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={save}>Save</Button>
      </div>
    </div>
  )
}
