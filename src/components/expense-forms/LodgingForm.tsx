import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Input, MoneyInput, NumericInput } from '../ui'
import { useSession } from '../../store/session'
import { LIMITS } from '../../lib/validation'
import { usePeople, parseMoney, clampMoney } from './form-utils'
import type { Expense, LodgingExpense, Room } from '../../types'
import type { CurrencyCode } from '../../lib/currencies'

function newRoom(): Room {
  return { id: `r_${Math.random().toString(36).slice(2, 10)}`, name: '', nightlyRate: 0 }
}

export function LodgingForm({ editing, onDone }: { editing: Expense | null; onDone: () => void }) {
  const people = usePeople()
  const currency = useSession((s) => s.currency) as CurrencyCode
  const addExpense = useSession((s) => s.addExpense)
  const updateExpense = useSession((s) => s.updateExpense)
  const initial = editing?.type === 'lodging' ? (editing as LodgingExpense) : null

  const [title, setTitle] = useState(initial?.title ?? '')
  const [total, setTotal] = useState<string>(initial?.total != null ? String(initial.total) : '')
  const [paidById, setPaidById] = useState(initial?.paidById ?? people[0]?.id ?? '')
  const [mode, setMode] = useState<'simple' | 'tiered'>(initial?.mode ?? 'simple')
  const [nights, setNights] = useState<Record<string, string>>(() => {
    const obj: Record<string, string> = {}
    for (const p of people) {
      obj[p.id] = initial?.nights?.[p.id] != null ? String(initial.nights[p.id]) : ''
    }
    return obj
  })
  const [rooms, setRooms] = useState<Room[]>(initial?.rooms ?? [])
  const [assignments, setAssignments] = useState<Record<string, string>>(initial?.assignments ?? {})

  function save() {
    const amount = clampMoney(parseMoney(total))
    const parsedNights: Record<string, number> = {}
    for (const [id, v] of Object.entries(nights)) {
      const n = Number(v)
      if (Number.isFinite(n) && n > 0) parsedNights[id] = Math.min(Math.floor(n), LIMITS.nightsMax)
    }
    if (!title.trim() || amount <= 0 || Object.keys(parsedNights).length === 0) return
    const base = { title, total: amount, paidById, mode, nights: parsedNights } as const
    if (mode === 'tiered') {
      const payload = { ...base, rooms, assignments }
      if (initial) updateExpense(initial.id, payload)
      else addExpense({ type: 'lodging', ...payload })
    } else {
      if (initial) updateExpense(initial.id, base)
      else addExpense({ type: 'lodging', ...base })
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
            placeholder="e.g. Tahoe Airbnb"
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
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={mode === 'tiered'}
          onChange={(e) => setMode(e.target.checked ? 'tiered' : 'simple')}
        />
        Rooms have different nightly rates
      </label>
      {mode === 'tiered' && (
        <fieldset className="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] p-3 text-sm">
          <legend className="px-1 text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">
            Rooms
          </legend>
          {rooms.map((r, idx) => (
            <div key={r.id} className="flex items-center gap-2">
              <Input
                aria-label="room name"
                placeholder="Room name"
                value={r.name}
                onChange={(e) =>
                  setRooms((cur) => cur.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))
                }
                maxLength={LIMITS.roomName}
              />
              <div className="w-36 shrink-0">
                <MoneyInput
                  aria-label="nightly rate"
                  value={r.nightlyRate > 0 ? String(r.nightlyRate) : ''}
                  onChange={(v) =>
                    setRooms((cur) =>
                      cur.map((x, i) => (i === idx ? { ...x, nightlyRate: parseMoney(v) } : x))
                    )
                  }
                  currency={currency}
                  placeholder="0.00"
                />
              </div>
              <button
                type="button"
                onClick={() => setRooms((cur) => cur.filter((_, i) => i !== idx))}
                aria-label="remove room"
                className="grid size-9 shrink-0 place-items-center rounded-md text-[var(--color-muted)] hover:bg-red-600/15 hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRooms((cur) => [...cur, newRoom()])}
            disabled={rooms.length >= LIMITS.maxRoomsPerLodging}
            className="self-start"
          >
            <Plus className="size-4" /> Add room
          </Button>
        </fieldset>
      )}
      <fieldset className="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] p-3 text-sm">
        <legend className="px-1 text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">
          Nights per person
        </legend>
        <div className="flex flex-col gap-2">
          {people.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="flex-1 text-sm">{p.name}</span>
              <div className="w-32">
                <NumericInput
                  aria-label={`nights for ${p.name}`}
                  value={nights[p.id] ?? ''}
                  onChange={(v) => setNights({ ...nights, [p.id]: v })}
                  integer
                  unit="nights"
                  max={LIMITS.nightsMax}
                  placeholder="0"
                />
              </div>
              {mode === 'tiered' && rooms.length > 0 && (
                <select
                  aria-label={`room for ${p.name}`}
                  value={assignments[p.id] ?? ''}
                  onChange={(e) => setAssignments({ ...assignments, [p.id]: e.target.value })}
                  className="h-10 w-32 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm"
                >
                  <option value="">— room —</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name || 'Unnamed'}
                    </option>
                  ))}
                </select>
              )}
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
