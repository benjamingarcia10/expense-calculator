import { useState, useMemo } from 'react'
import { Button, Input, MoneyInput } from '../ui'
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
    for (const p of people) {
      obj[p.id] = initial?.amounts?.[p.id] != null ? String(initial.amounts[p.id]) : ''
    }
    return obj
  })

  const totalNum = clampMoney(parseMoney(total))
  const sum = useMemo(() => Object.values(amounts).reduce((s, v) => s + parseMoney(v), 0), [amounts])
  const delta = +(totalNum - sum).toFixed(2)
  const deltaOk = Math.abs(delta) < 0.005
  const valid = title.trim() !== '' && totalNum > 0 && deltaOk

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
            placeholder="e.g. Concert tickets"
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
          Per-person amounts
        </legend>
        <div className="flex flex-col gap-2">
          {people.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="flex-1 text-sm">{p.name}</span>
              <div className="w-32">
                <MoneyInput
                  aria-label={`amount for ${p.name}`}
                  value={amounts[p.id] ?? ''}
                  onChange={(v) => setAmounts({ ...amounts, [p.id]: v })}
                  currency={currency}
                  placeholder="0.00"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between border-t border-[var(--color-border)] pt-2 text-xs">
          <span className="text-[var(--color-muted)]">Entered: {formatMoney(sum, currency)}</span>
          <span className={deltaOk ? 'text-emerald-600' : 'text-red-500'} aria-live="polite">
            {deltaOk ? '✓ matches total' : `Off by ${formatMoney(delta, currency)}`}
          </span>
        </div>
      </fieldset>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!valid}>
          Save
        </Button>
      </div>
    </form>
  )
}
