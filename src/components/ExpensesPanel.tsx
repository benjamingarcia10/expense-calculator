import { useState } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, Receipt } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from '../store/session'
import { Button, Dialog, SectionHeading } from './ui'
import { ExpenseSheet } from './expense-forms/ExpenseSheet'
import { ExpenseBreakdown } from './ExpenseBreakdown'
import type { Expense } from '../types'
import { expenseTotal } from '../types'
import { formatMoney } from '../lib/format'
import type { CurrencyCode } from '../lib/currencies'
import { LIMITS } from '../lib/validation'
import { EXPENSE_TYPE_LABELS } from './summary/exports'

const TYPE_TAG: Record<Expense['type'], string> = {
  equal: 'EQUAL',
  shares: 'SHARES',
  exact: 'EXACT',
  mileage: 'MILEAGE',
  restaurant: 'ITEMIZED',
  lodging: 'LODGING',
}

export function ExpensesPanel() {
  const expenses = useSession((s) => s.expenses)
  const currency = useSession((s) => s.currency) as CurrencyCode
  const removeExpense = useSession((s) => s.removeExpense)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
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
  function toggleExpanded(id: string) {
    setExpandedId((cur) => (cur === id ? null : id))
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm md:col-span-3">
      <SectionHeading
        title="Expenses"
        count={expenses.length}
        action={
          <Button size="sm" onClick={openNew} disabled={atMax}>
            <Plus className="size-4" /> Add expense
          </Button>
        }
      />
      {expenses.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-muted)]">
          <Receipt className="size-5 opacity-60" aria-hidden="true" />
          <p className="h-display text-base text-[var(--color-ink)]">No expenses yet.</p>
          <p className="text-xs">Add your first split below.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          <AnimatePresence initial={false}>
            {expenses.map((e) => {
              const isOpen = expandedId === e.id
              return (
                <motion.li
                  key={e.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`overflow-hidden rounded-xl border transition-colors ${
                    isOpen
                      ? 'border-[var(--color-border)] bg-[var(--color-bg)]/40'
                      : 'border-transparent hover:bg-[var(--color-accent-soft)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(e.id)}
                      aria-label={`${isOpen ? 'collapse' : 'expand'} ${e.title} breakdown`}
                      aria-expanded={isOpen}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors"
                    >
                      <motion.span
                        animate={{ rotate: isOpen ? 0 : -90 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="shrink-0 text-[var(--color-muted)]"
                        aria-hidden="true"
                      >
                        <ChevronDown className="size-4" />
                      </motion.span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                        <span className="truncate font-medium">{e.title}</span>
                        <span className="tag shrink-0" aria-label={EXPENSE_TYPE_LABELS[e.type]}>
                          {TYPE_TAG[e.type]}
                        </span>
                        <span
                          className="leaders mx-1 hidden flex-1 self-baseline sm:block"
                          aria-hidden="true"
                          style={{ height: '1em' }}
                        />
                      </div>
                      <span className="shrink-0 font-mono text-sm tabular-nums sm:text-base">
                        {formatMoney(expenseTotal(e), currency)}
                      </span>
                    </button>
                    <div className="flex shrink-0 gap-0.5 pr-1.5">
                      <button
                        onClick={() => openEdit(e)}
                        className="grid size-9 place-items-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]/40 hover:text-[var(--color-ink)]"
                        aria-label={`edit ${e.title}`}
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => setPendingDelete(e)}
                        className="grid size-9 place-items-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-red-600/15 hover:text-red-600"
                        aria-label={`delete ${e.title}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="breakdown"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <ExpenseBreakdown expense={e} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
      <ExpenseSheet open={open} onClose={() => setOpen(false)} editing={editing} />
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
