import { useState } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, Receipt as ReceiptIcon, TriangleAlert } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useSession } from '../store/session'
import { Button, SectionHeading } from './ui'
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
  const peopleCount = useSession((s) => s.people.length)
  const currency = useSession((s) => s.currency) as CurrencyCode
  const removeExpense = useSession((s) => s.removeExpense)
  const restoreExpense = useSession((s) => s.restoreExpense)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const atMax = expenses.length >= LIMITS.maxExpenses
  // An expense needs at least one person to be the payer — without people the
  // form is a dead-end (empty "Paid by", empty "Split between").
  const noPeople = peopleCount === 0

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
  function handleDelete(e: Expense) {
    const index = expenses.findIndex((x) => x.id === e.id)
    if (index === -1) return
    if (expandedId === e.id) setExpandedId(null)
    removeExpense(e.id)
    toast(`Deleted "${e.title}"`, {
      duration: 6000,
      action: {
        label: 'Undo',
        onClick: () => restoreExpense(e, index),
      },
    })
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5 md:col-span-3">
      <SectionHeading
        title="Expenses"
        count={expenses.length}
        action={
          <Button
            size="sm"
            onClick={openNew}
            disabled={atMax || noPeople}
            // Ghost variant when the prerequisite (≥1 person) isn't met —
            // matches the People panel's Add behavior when the input is empty,
            // so two parallel "primary action, not yet available" states read
            // the same way instead of a faded red disabled button.
            variant={noPeople ? 'ghost' : 'primary'}
            title={noPeople ? 'Add someone in People first' : undefined}
          >
            <Plus className="size-4" /> Add expense
          </Button>
        }
      />
      {expenses.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-muted)]">
          <ReceiptIcon className="size-5 opacity-60" aria-hidden="true" />
          <p className="h-display text-base text-[var(--color-ink)]">No expenses yet.</p>
          <p className="text-xs">
            {noPeople ? 'Add the people first, then log an expense.' : 'Add your first split below.'}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          <AnimatePresence initial={false}>
            {expenses.map((e) => {
              const isOpen = expandedId === e.id
              const unassignedCount =
                e.type === 'restaurant' ? e.items.filter((i) => i.assignedIds.length === 0).length : 0
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
                        <span className="line-clamp-2 font-medium break-words sm:line-clamp-none sm:truncate">
                          {e.title}
                        </span>
                        <span className="tag shrink-0" aria-label={EXPENSE_TYPE_LABELS[e.type]}>
                          {TYPE_TAG[e.type]}
                        </span>
                        {unassignedCount > 0 && (
                          <span
                            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-amber-700 uppercase dark:text-amber-300"
                            title={`${unassignedCount} item${unassignedCount === 1 ? '' : 's'} not assigned to anyone — not included in totals`}
                            aria-label={`${unassignedCount} unassigned item${unassignedCount === 1 ? '' : 's'}`}
                          >
                            <TriangleAlert className="size-3" aria-hidden="true" />
                            {unassignedCount} unassigned
                          </span>
                        )}
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
                    <div className="flex shrink-0 gap-2 pr-1.5 sm:gap-1">
                      <button
                        onClick={() => openEdit(e)}
                        className="grid size-11 place-items-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]/40 hover:text-[var(--color-ink)] sm:size-9"
                        aria-label={`edit ${e.title}`}
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(e)}
                        className="grid size-11 place-items-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-red-600/15 hover:text-red-600 sm:size-9"
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
    </section>
  )
}
