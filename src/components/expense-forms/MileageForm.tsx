import { useState } from 'react'
import { Button, Input, MoneyInput, NumericInput } from '../ui'
import { useSession } from '../../store/session'
import { LIMITS } from '../../lib/validation'
import { usePeople, parseMoney, clampMoney } from './form-utils'
import type { Expense, MileageExpense } from '../../types'
import type { CurrencyCode } from '../../lib/currencies'

export function MileageForm({ editing, onDone }: { editing: Expense | null; onDone: () => void }) {
  const people = usePeople()
  const currency = useSession((s) => s.currency) as CurrencyCode
  const addExpense = useSession((s) => s.addExpense)
  const updateExpense = useSession((s) => s.updateExpense)
  const initial = editing?.type === 'mileage' ? (editing as MileageExpense) : null

  const [title, setTitle] = useState(initial?.title ?? '')
  const [total, setTotal] = useState<string>(initial?.total != null ? String(initial.total) : '')
  const [paidById, setPaidById] = useState(initial?.paidById ?? people[0]?.id ?? '')
  const [unitLabel, setUnitLabel] = useState(initial?.unitLabel ?? 'miles')
  const [units, setUnits] = useState<Record<string, string>>(() => {
    const obj: Record<string, string> = {}
    for (const p of people) {
      obj[p.id] = initial?.units?.[p.id] != null ? String(initial.units[p.id]) : ''
    }
    return obj
  })

  function save() {
    const amount = clampMoney(parseMoney(total))
    const parsed: Record<string, number> = {}
    for (const [id, v] of Object.entries(units)) {
      const n = Number(v)
      if (Number.isFinite(n) && n > 0) parsed[id] = Math.min(n, LIMITS.unitsMax)
    }
    if (!title.trim() || amount <= 0 || !unitLabel.trim() || Object.keys(parsed).length === 0) return
    if (initial) {
      updateExpense(initial.id, { title, total: amount, paidById, unitLabel, units: parsed })
    } else {
      addExpense({ type: 'mileage', title, total: amount, paidById, unitLabel, units: parsed })
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
            placeholder="e.g. Gas to Tahoe"
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
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Unit label</span>
          <Input
            value={unitLabel}
            onChange={(e) => setUnitLabel(e.target.value)}
            maxLength={LIMITS.unitLabel}
            placeholder="miles, hours, kWh…"
          />
        </label>
      </section>
      <fieldset className="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] p-3 text-sm">
        <legend className="px-1 text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">
          {unitLabel || 'units'} per person
        </legend>
        <div className="flex flex-col gap-2">
          {people.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="flex-1 text-sm">{p.name}</span>
              <div className="w-36">
                <NumericInput
                  aria-label={`units for ${p.name}`}
                  value={units[p.id] ?? ''}
                  onChange={(v) => setUnits({ ...units, [p.id]: v })}
                  unit={unitLabel || 'u'}
                  max={LIMITS.unitsMax}
                  placeholder="0"
                />
              </div>
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
