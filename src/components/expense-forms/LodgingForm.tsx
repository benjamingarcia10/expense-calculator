import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Input } from '../ui'
import { useSession } from '../../store/session'
import { LIMITS } from '../../lib/validation'
import { usePeople, parseMoney, clampMoney } from './form-utils'
import type { Expense, LodgingExpense, Room } from '../../types'

function newRoom(): Room {
  return { id: `r_${Math.random().toString(36).slice(2, 10)}`, name: '', nightlyRate: 0 }
}

export function LodgingForm({ editing, onDone }: { editing: Expense | null; onDone: () => void }) {
  const people = usePeople()
  const addExpense = useSession((s) => s.addExpense)
  const updateExpense = useSession((s) => s.updateExpense)
  const initial = editing?.type === 'lodging' ? (editing as LodgingExpense) : null

  const [title, setTitle] = useState(initial?.title ?? '')
  const [total, setTotal] = useState<string>(initial?.total != null ? String(initial.total) : '')
  const [paidById, setPaidById] = useState(initial?.paidById ?? people[0]?.id ?? '')
  const [mode, setMode] = useState<'simple' | 'tiered'>(initial?.mode ?? 'simple')
  const [nights, setNights] = useState<Record<string, string>>(() => {
    const obj: Record<string, string> = {}
    for (const p of people) obj[p.id] = String(initial?.nights?.[p.id] ?? 0)
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
          className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
        >
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={mode === 'tiered'}
          onChange={(e) => setMode(e.target.checked ? 'tiered' : 'simple')}
        />
        Rooms have different prices
      </label>
      {mode === 'tiered' && (
        <div className="flex flex-col gap-2 text-sm">
          <span className="text-[var(--color-muted)]">Rooms</span>
          {rooms.map((r, idx) => (
            <div key={r.id} className="flex gap-2">
              <Input
                aria-label="room name"
                placeholder="Room name"
                value={r.name}
                onChange={(e) =>
                  setRooms((cur) => cur.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))
                }
                maxLength={LIMITS.roomName}
              />
              <Input
                aria-label="nightly rate"
                type="number"
                min={0}
                step={0.01}
                placeholder="Nightly rate"
                value={String(r.nightlyRate)}
                onChange={(e) =>
                  setRooms((cur) =>
                    cur.map((x, i) => (i === idx ? { ...x, nightlyRate: parseMoney(e.target.value) } : x))
                  )
                }
                className="w-32"
              />
              <button
                onClick={() => setRooms((cur) => cur.filter((_, i) => i !== idx))}
                aria-label="remove room"
                className="text-[var(--color-muted)] hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRooms((cur) => [...cur, newRoom()])}
            disabled={rooms.length >= LIMITS.maxRoomsPerLodging}
          >
            <Plus className="size-4" /> Add room
          </Button>
        </div>
      )}
      <div className="flex flex-col gap-2 text-sm">
        <span className="text-[var(--color-muted)]">Nights per person</span>
        {people.map((p) => (
          <label key={p.id} className="flex items-center gap-2">
            <span className="flex-1">{p.name}</span>
            <Input
              type="number"
              min={0}
              step={1}
              aria-label={`nights for ${p.name}`}
              value={nights[p.id] ?? '0'}
              onChange={(e) => setNights({ ...nights, [p.id]: e.target.value })}
              className="w-20"
            />
            {mode === 'tiered' && rooms.length > 0 && (
              <select
                aria-label={`room for ${p.name}`}
                value={assignments[p.id] ?? ''}
                onChange={(e) => setAssignments({ ...assignments, [p.id]: e.target.value })}
                className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm"
              >
                <option value="">— room —</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name || 'Unnamed'}
                  </option>
                ))}
              </select>
            )}
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
