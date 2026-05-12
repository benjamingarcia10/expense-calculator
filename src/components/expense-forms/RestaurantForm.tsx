import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Input } from '../ui'
import { useSession } from '../../store/session'
import { LIMITS } from '../../lib/validation'
import { usePeople, parseMoney, clampMoney } from './form-utils'
import type { Expense, RestaurantExpense, RestaurantItem } from '../../types'

function newItem(): RestaurantItem {
  return { id: `i_${Math.random().toString(36).slice(2, 10)}`, name: '', price: 0, assignedIds: [] }
}

export function RestaurantForm({ editing, onDone }: { editing: Expense | null; onDone: () => void }) {
  const people = usePeople()
  const addExpense = useSession((s) => s.addExpense)
  const updateExpense = useSession((s) => s.updateExpense)
  const initial = editing?.type === 'restaurant' ? (editing as RestaurantExpense) : null

  const [title, setTitle] = useState(initial?.title ?? '')
  const [paidById, setPaidById] = useState(initial?.paidById ?? people[0]?.id ?? '')
  const [items, setItems] = useState<RestaurantItem[]>(initial?.items ?? [])
  const [tax, setTax] = useState<string>(initial?.tax != null ? String(initial.tax) : '0')
  const [tip, setTip] = useState<string>(initial?.tip != null ? String(initial.tip) : '0')
  const [serviceFee, setServiceFee] = useState<string>(
    initial?.serviceFee != null ? String(initial.serviceFee) : '0'
  )

  function updateItem(idx: number, patch: Partial<RestaurantItem>) {
    setItems((cur) => cur.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }
  function toggleAssign(idx: number, personId: string) {
    setItems((cur) =>
      cur.map((it, i) =>
        i === idx
          ? {
              ...it,
              assignedIds: it.assignedIds.includes(personId)
                ? it.assignedIds.filter((id) => id !== personId)
                : [...it.assignedIds, personId],
            }
          : it
      )
    )
  }
  function addItem() {
    if (items.length >= LIMITS.maxItemsPerExpense) return
    setItems((cur) => [...cur, newItem()])
  }
  function removeItem(idx: number) {
    setItems((cur) => cur.filter((_, i) => i !== idx))
  }

  function save() {
    if (!title.trim() || items.length === 0) return
    const cleanItems = items.map((it) => ({ ...it, price: clampMoney(it.price) }))
    if (cleanItems.some((it) => !it.name.trim() || it.assignedIds.length === 0 || it.price <= 0)) return
    const payload = {
      title,
      paidById,
      items: cleanItems,
      tax: clampMoney(parseMoney(tax)),
      tip: clampMoney(parseMoney(tip)),
      serviceFee: clampMoney(parseMoney(serviceFee)),
    } as const
    if (initial) updateExpense(initial.id, payload)
    else addExpense({ type: 'restaurant', ...payload })
    onDone()
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Title
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={LIMITS.expenseTitle} />
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
        <span className="text-[var(--color-muted)]">Items</span>
        {items.map((it, idx) => (
          <div key={it.id} className="rounded-lg border border-[var(--color-border)] p-2">
            <div className="flex gap-2">
              <Input
                aria-label="item name"
                placeholder="Item name"
                value={it.name}
                onChange={(e) => updateItem(idx, { name: e.target.value })}
                maxLength={LIMITS.itemName}
              />
              <Input
                aria-label="item price"
                type="number"
                min={0}
                step={0.01}
                placeholder="Price"
                value={String(it.price)}
                onChange={(e) => updateItem(idx, { price: parseMoney(e.target.value) })}
                className="w-24"
              />
              <button
                onClick={() => removeItem(idx)}
                aria-label="remove item"
                className="text-[var(--color-muted)] hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {people.map((p) => (
                <label key={p.id} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    aria-label={`assign ${p.name}`}
                    checked={it.assignedIds.includes(p.id)}
                    onChange={() => toggleAssign(idx, p.id)}
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={addItem}
          disabled={items.length >= LIMITS.maxItemsPerExpense}
        >
          <Plus className="size-4" /> Add item
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1 text-sm">
          Tax
          <Input
            type="number"
            min={0}
            step={0.01}
            aria-label="tax"
            value={tax}
            onChange={(e) => setTax(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Tip
          <Input type="number" min={0} step={0.01} value={tip} onChange={(e) => setTip(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Service
          <Input
            type="number"
            min={0}
            step={0.01}
            value={serviceFee}
            onChange={(e) => setServiceFee(e.target.value)}
          />
        </label>
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
