import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Input, MoneyInput } from '../ui'
import { useSession } from '../../store/session'
import { LIMITS } from '../../lib/validation'
import { usePeople, parseMoney, clampMoney } from './form-utils'
import type { Expense, RestaurantExpense, RestaurantItem } from '../../types'
import { formatMoney } from '../../lib/format'
import type { CurrencyCode } from '../../lib/currencies'

function newItem(): RestaurantItem {
  return { id: `i_${Math.random().toString(36).slice(2, 10)}`, name: '', price: 0, assignedIds: [] }
}

export function RestaurantForm({ editing, onDone }: { editing: Expense | null; onDone: () => void }) {
  const people = usePeople()
  const currency = useSession((s) => s.currency) as CurrencyCode
  const addExpense = useSession((s) => s.addExpense)
  const updateExpense = useSession((s) => s.updateExpense)
  const initial = editing?.type === 'restaurant' ? (editing as RestaurantExpense) : null

  const [title, setTitle] = useState(initial?.title ?? '')
  const [paidById, setPaidById] = useState(initial?.paidById ?? people[0]?.id ?? '')
  const [items, setItems] = useState<RestaurantItem[]>(initial?.items ?? [newItem()])
  const [tax, setTax] = useState<string>(initial?.tax != null ? String(initial.tax) : '')
  const [tip, setTip] = useState<string>(initial?.tip != null ? String(initial.tip) : '')
  const [serviceFee, setServiceFee] = useState<string>(
    initial?.serviceFee != null ? String(initial.serviceFee) : ''
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

  const subtotal = useMemo(() => items.reduce((s, it) => s + clampMoney(it.price), 0), [items])
  const taxAmt = clampMoney(parseMoney(tax))
  const tipAmt = clampMoney(parseMoney(tip))
  const serviceAmt = clampMoney(parseMoney(serviceFee))
  const grandTotal = subtotal + taxAmt + tipAmt + serviceAmt

  function save() {
    if (!title.trim() || items.length === 0) return
    const cleanItems = items.map((it) => ({ ...it, price: clampMoney(it.price) }))
    if (cleanItems.some((it) => !it.name.trim() || it.assignedIds.length === 0 || it.price <= 0)) return
    const payload = {
      title,
      paidById,
      items: cleanItems,
      tax: taxAmt,
      tip: tipAmt,
      serviceFee: serviceAmt,
    } as const
    if (initial) updateExpense(initial.id, payload)
    else addExpense({ type: 'restaurant', ...payload })
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
            placeholder="e.g. Sushi at Nobu"
            autoFocus
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
      </section>
      <fieldset className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] p-3 text-sm">
        <legend className="px-1 text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">
          Items
        </legend>
        <div className="flex flex-col gap-2">
          {items.map((it, idx) => (
            <div
              key={it.id}
              className="flex flex-col gap-2 rounded-lg border border-[var(--color-border)] p-2"
            >
              <div className="flex items-center gap-2">
                <Input
                  aria-label="item name"
                  placeholder="Item name"
                  value={it.name}
                  onChange={(e) => updateItem(idx, { name: e.target.value })}
                  maxLength={LIMITS.itemName}
                />
                <div className="w-28 shrink-0">
                  <MoneyInput
                    aria-label="item price"
                    value={it.price > 0 ? String(it.price) : ''}
                    onChange={(v) => updateItem(idx, { price: parseMoney(v) })}
                    currency={currency}
                    placeholder="0.00"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  aria-label="remove item"
                  className="grid size-9 shrink-0 place-items-center rounded-md text-[var(--color-muted)] hover:bg-red-600/15 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-[var(--color-muted)]">Shared by</span>
                {people.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center gap-1.5 text-xs">
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
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addItem}
          disabled={items.length >= LIMITS.maxItemsPerExpense}
          className="self-start"
        >
          <Plus className="size-4" /> Add item
        </Button>
      </fieldset>
      <fieldset className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] p-3 text-sm">
        <legend className="px-1 text-xs font-medium tracking-wide text-[var(--color-muted)] uppercase">
          Tax, tip &amp; fees
        </legend>
        <div className="grid grid-cols-3 gap-2">
          <label className="flex flex-col gap-1.5 text-xs">
            <span className="font-medium">Tax</span>
            <MoneyInput
              aria-label="tax"
              value={tax}
              onChange={setTax}
              currency={currency}
              placeholder="0.00"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs">
            <span className="font-medium">Tip</span>
            <MoneyInput value={tip} onChange={setTip} currency={currency} placeholder="0.00" />
          </label>
          <label className="flex flex-col gap-1.5 text-xs">
            <span className="font-medium">Service</span>
            <MoneyInput value={serviceFee} onChange={setServiceFee} currency={currency} placeholder="0.00" />
          </label>
        </div>
        <dl className="flex flex-col gap-1 border-t border-[var(--color-border)] pt-2 text-xs">
          <div className="flex justify-between">
            <dt className="text-[var(--color-muted)]">Subtotal</dt>
            <dd className="font-mono tabular-nums">{formatMoney(subtotal, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">Total</dt>
            <dd className="font-mono font-medium tabular-nums">{formatMoney(grandTotal, currency)}</dd>
          </div>
        </dl>
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
