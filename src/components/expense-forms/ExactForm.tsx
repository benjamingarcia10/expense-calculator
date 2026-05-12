import { useState, useMemo } from 'react'
import { Button, Input } from '../ui'
import { useSession } from '../../store/session'
import { LIMITS } from '../../lib/validation'
import { usePeople, parseMoney, clampMoney } from './form-utils'
import type { Expense, ExactExpense } from '../../types'
import { formatMoney } from '../../lib/format'
import type { CurrencyCode } from '../../lib/currencies'

export function ExactForm({ editing, onDone }: { editing: Expense | null; onDone: () => void }) {
  const people = usePeople()
  const currency = useSession((s) => s.currency) as CurrencyCode
  const addExpense = useSession((s) => s.addExpense)
  const updateExpense = useSession((s) => s.updateExpense)
  const initial = editing?.type === 'exact' ? (editing as ExactExpense) : null

  const [title, setTitle] = useState(initial?.title ?? '')
  const [total, setTotal] = useState<string>(initial?.total != null ? String(initial.total) : '')
  const [paidById, setPaidById] = useState(initial?.paidById ?? people[0]?.id ?? '')
  const [amounts, setAmounts] = useState<Record<string, string>>(() => {
    const obj: Record<string, string> = {}
    for (const p of people) obj[p.id] = String(initial?.amounts?.[p.id] ?? 0)
    return obj
  })

  const totalNum = clampMoney(parseMoney(total))
  const sum = useMemo(() => Object.values(amounts).reduce((s, v) => s + parseMoney(v), 0), [amounts])
  const delta = +(totalNum - sum).toFixed(2)
  const valid = title.trim() !== '' && totalNum > 0 && Math.abs(delta) < 0.005

  function save() {
    if (!valid) return
    const parsed: Record<string, number> = {}
    for (const [id, v] of Object.entries(amounts)) {
      const n = clampMoney(parseMoney(v))
      if (n > 0) parsed[id] = n
    }
    if (initial) {
      updateExpense(initial.id, { title, total: totalNum, paidById, amounts: parsed })
    } else {
      addExpense({ type: 'exact', title, total: totalNum, paidById, amounts: parsed })
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
        <span className="text-[var(--color-muted)]">Amounts</span>
        {people.map((p) => (
          <label key={p.id} className="flex items-center gap-2">
            <span className="flex-1">{p.name}</span>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              aria-label={`amount for ${p.name}`}
              value={amounts[p.id] ?? '0'}
              onChange={(e) => setAmounts({ ...amounts, [p.id]: e.target.value })}
              className="w-28"
            />
          </label>
        ))}
        <p className={`text-xs ${Math.abs(delta) < 0.005 ? 'text-[var(--color-muted)]' : 'text-red-500'}`}>
          Sum: {formatMoney(sum, currency)} · Delta: {formatMoney(delta, currency)}
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={save} disabled={!valid}>
          Save
        </Button>
      </div>
    </div>
  )
}
