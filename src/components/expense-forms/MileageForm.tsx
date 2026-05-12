import { useState } from 'react'
import { Button, Input } from '../ui'
import { useSession } from '../../store/session'
import { LIMITS } from '../../lib/validation'
import { usePeople, parseMoney, clampMoney } from './form-utils'
import type { Expense, MileageExpense } from '../../types'

export function MileageForm({ editing, onDone }: { editing: Expense | null; onDone: () => void }) {
  const people = usePeople()
  const addExpense = useSession((s) => s.addExpense)
  const updateExpense = useSession((s) => s.updateExpense)
  const initial = editing?.type === 'mileage' ? (editing as MileageExpense) : null

  const [title, setTitle] = useState(initial?.title ?? '')
  const [total, setTotal] = useState<string>(initial?.total != null ? String(initial.total) : '')
  const [paidById, setPaidById] = useState(initial?.paidById ?? people[0]?.id ?? '')
  const [unitLabel, setUnitLabel] = useState(initial?.unitLabel ?? 'miles')
  const [units, setUnits] = useState<Record<string, string>>(() => {
    const obj: Record<string, string> = {}
    for (const p of people) obj[p.id] = String(initial?.units?.[p.id] ?? 0)
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
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Title
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={LIMITS.expenseTitle} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Total
        <Input type="number" min={0} step={0.01} value={total} onChange={(e) => setTotal(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Paid by
        <select
          value={paidById}
          onChange={(e) => setPaidById(e.target.value)}
          className="h-10 rounded-lg border border-[--color-border] bg-[--color-surface] px-3 text-sm"
        >
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Unit label
        <Input
          value={unitLabel}
          onChange={(e) => setUnitLabel(e.target.value)}
          maxLength={LIMITS.unitLabel}
        />
      </label>
      <div className="flex flex-col gap-2 text-sm">
        <span className="text-[--color-muted]">{unitLabel || 'units'} per person</span>
        {people.map((p) => (
          <label key={p.id} className="flex items-center gap-2">
            <span className="flex-1">{p.name}</span>
            <Input
              type="number"
              min={0}
              step={0.1}
              aria-label={`units for ${p.name}`}
              value={units[p.id] ?? '0'}
              onChange={(e) => setUnits({ ...units, [p.id]: e.target.value })}
              className="w-24"
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
