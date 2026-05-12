import { useState } from 'react'
import { Button, Input, MoneyInput } from '../ui'
import { useSession } from '../../store/session'
import { LIMITS } from '../../lib/validation'
import { usePeople, parseMoney, clampMoney } from './form-utils'
import type { Expense, EqualExpense } from '../../types'
import type { CurrencyCode } from '../../lib/currencies'

export function EqualForm({ editing, onDone }: { editing: Expense | null; onDone: () => void }) {
  const people = usePeople()
  const currency = useSession((s) => s.currency) as CurrencyCode
  const addExpense = useSession((s) => s.addExpense)
  const updateExpense = useSession((s) => s.updateExpense)
  const initial = editing && editing.type === 'equal' ? (editing as EqualExpense) : null

  const [title, setTitle] = useState(initial?.title ?? '')
  const [total, setTotal] = useState<string>(initial?.total != null ? String(initial.total) : '')
  const [paidById, setPaidById] = useState(initial?.paidById ?? people[0]?.id ?? '')
  const [participantIds, setParticipantIds] = useState<string[]>(
    initial?.participantIds ?? people.map((p) => p.id)
  )

  function toggle(id: string) {
    setParticipantIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  function save() {
    const amount = clampMoney(parseMoney(total))
    if (!title.trim() || amount <= 0 || !paidById || participantIds.length === 0) return
    if (initial) {
      updateExpense(initial.id, { title, total: amount, paidById, participantIds })
    } else {
      addExpense({ type: 'equal', title, total: amount, paidById, participantIds })
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
            placeholder="e.g. Dinner at Roberta's"
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
          Split between
        </legend>
        <div className="flex flex-col gap-1">
          {people.map((p) => (
            <label
              key={p.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--color-border)]/30"
            >
              <input type="checkbox" checked={participantIds.includes(p.id)} onChange={() => toggle(p.id)} />
              {p.name}
            </label>
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
