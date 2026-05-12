import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from '../store/session'
import { Button, Dialog } from './ui'
import { ExpenseSheet } from './expense-forms/ExpenseSheet'
import { ExpenseDetail } from './ExpenseDetail'
import type { Expense } from '../types'
import { expenseTotal } from '../types'
import { formatMoney } from '../lib/format'
import type { CurrencyCode } from '../lib/currencies'
import { LIMITS } from '../lib/validation'
import { EXPENSE_TYPE_LABELS } from './summary/exports'

export function ExpensesPanel() {
  const expenses = useSession((s) => s.expenses)
  const currency = useSession((s) => s.currency) as CurrencyCode
  const removeExpense = useSession((s) => s.removeExpense)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [detail, setDetail] = useState<Expense | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null)

  const atMax = expenses.length >= LIMITS.maxExpenses

  function openNew() {
    setEditing(null)
    setOpen(true)
  }
  function openEdit(e: Expense) {
    setEditing(e)
    setOpen(true)
  }
  function openDetail(e: Expense) {
    setDetail(e)
  }
  function editFromDetail() {
    if (!detail) return
    const e = detail
    setDetail(null)
    setEditing(e)
    setOpen(true)
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:col-span-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">
          Expenses <span className="text-[var(--color-muted)]">({expenses.length})</span>
        </h2>
        <Button size="sm" onClick={openNew} disabled={atMax}>
          <Plus className="size-4" /> Add expense
        </Button>
      </div>
      <ul className="flex flex-col gap-1">
        <AnimatePresence initial={false}>
          {expenses.map((e) => (
            <motion.li
              key={e.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between rounded-md hover:bg-[var(--color-border)]/30"
            >
              <button
                type="button"
                onClick={() => openDetail(e)}
                aria-label={`view breakdown for ${e.title}`}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{e.title}</div>
                  <div className="text-xs text-[var(--color-muted)]">{EXPENSE_TYPE_LABELS[e.type]}</div>
                </div>
                <div className="font-mono tabular-nums">{formatMoney(expenseTotal(e), currency)}</div>
              </button>
              <div className="ml-1 flex gap-0.5 pr-2">
                <button
                  onClick={() => openEdit(e)}
                  className="grid size-11 place-items-center rounded-md text-[var(--color-muted)] hover:bg-[var(--color-border)]/40 hover:text-[var(--color-ink)]"
                  aria-label={`edit ${e.title}`}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => setPendingDelete(e)}
                  className="grid size-11 place-items-center rounded-md text-[var(--color-muted)] hover:bg-red-600/15 hover:text-red-600"
                  aria-label={`delete ${e.title}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {expenses.length === 0 && (
        <p className="text-sm text-[var(--color-muted)]">No expenses yet. Add your first one.</p>
      )}
      <ExpenseSheet open={open} onClose={() => setOpen(false)} editing={editing} />
      <ExpenseDetail expense={detail} onClose={() => setDetail(null)} onEdit={editFromDetail} />
      <Dialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={`Delete ${pendingDelete?.title ?? ''}?`}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm">This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (pendingDelete) removeExpense(pendingDelete.id)
                setPendingDelete(null)
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  )
}
