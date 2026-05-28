import { useMemo, useState } from 'react'
import { Trash2, TriangleAlert, UserPlus, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from '../store/session'
import { LIMITS } from '../lib/validation'
import { Button, Dialog, Input, SectionHeading } from './ui'
import type { Expense } from '../types'

function isParticipant(expense: Expense, personId: string): boolean {
  switch (expense.type) {
    case 'equal':
      return expense.participantIds.includes(personId)
    case 'shares':
      return personId in expense.shares
    case 'exact':
      return personId in expense.amounts
    case 'mileage':
      return personId in expense.units
    case 'restaurant':
      return expense.items.some((i) => i.assignedIds.includes(personId))
    case 'lodging':
      return personId in expense.nights
  }
}

function computeRemovalImpact(expenses: Expense[], personId: string) {
  let paidCount = 0
  let participantCount = 0
  let orphanedItemCount = 0
  for (const e of expenses) {
    if (e.paidById === personId) {
      paidCount++
      continue
    }
    if (!isParticipant(e, personId)) continue
    participantCount++
    if (e.type === 'restaurant') {
      for (const item of e.items) {
        if (item.assignedIds.length === 1 && item.assignedIds[0] === personId) {
          orphanedItemCount++
        }
      }
    }
  }
  return { paidCount, participantCount, orphanedItemCount }
}

export function PeoplePanel() {
  const people = useSession((s) => s.people)
  const expenses = useSession((s) => s.expenses)
  const addPerson = useSession((s) => s.addPerson)
  const removePerson = useSession((s) => s.removePerson)
  const [name, setName] = useState('')
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null)

  const atMax = people.length >= LIMITS.maxPeople

  const submit = () => {
    if (!name.trim() || atMax) return
    addPerson(name)
    setName('')
  }

  const impact = useMemo(
    () => (pendingRemove ? computeRemovalImpact(expenses, pendingRemove.id) : null),
    [pendingRemove, expenses]
  )

  function attemptRemove(personId: string) {
    const isReferenced =
      expenses.some((e) => e.paidById === personId) || expenses.some((e) => isParticipant(e, personId))
    if (isReferenced) {
      const person = people.find((p) => p.id === personId)
      if (person) setPendingRemove({ id: person.id, name: person.name })
    } else {
      removePerson(personId)
    }
  }

  return (
    <section className="flex h-full flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5">
      <SectionHeading title="People" count={people.length} />
      {people.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-6 text-center text-sm text-[var(--color-muted)]">
          <Users className="size-5 opacity-60" aria-hidden="true" />
          <p>Add the people splitting this tab.</p>
        </div>
      ) : (
        <ul className="flex flex-col">
          <AnimatePresence initial={false}>
            {people.map((p) => (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="group flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-[var(--color-accent-soft)]"
              >
                <span className="truncate">{p.name}</span>
                <button
                  aria-label={`remove ${p.name}`}
                  onClick={() => attemptRemove(p.id)}
                  className="grid size-11 place-items-center rounded-md text-[var(--color-muted)] opacity-0 transition group-hover:opacity-100 hover:bg-red-600/15 hover:text-red-600 focus-visible:opacity-100 sm:size-9 [@media(pointer:coarse)]:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex gap-2"
      >
        <Input
          placeholder="Add a name"
          maxLength={LIMITS.personName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={atMax}
        />
        <Button
          type="submit"
          size="md"
          variant={name.trim() ? 'primary' : 'ghost'}
          disabled={atMax || !name.trim()}
        >
          <UserPlus className="size-4" /> Add
        </Button>
      </form>
      {atMax && (
        <p className="text-xs text-[var(--color-muted)]">Limit of {LIMITS.maxPeople} people reached.</p>
      )}
      <Dialog
        open={pendingRemove !== null}
        onClose={() => setPendingRemove(null)}
        title={`Remove ${pendingRemove?.name ?? ''}?`}
      >
        <div className="flex flex-col gap-3">
          {impact && (impact.paidCount > 0 || impact.participantCount > 0) && (
            <ul className="flex flex-col gap-1.5 text-sm">
              {impact.paidCount > 0 && (
                <li className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1 shrink-0 rounded-full bg-[var(--color-muted)]"
                  />
                  <span>
                    <strong className="font-semibold">
                      {impact.paidCount} expense{impact.paidCount === 1 ? '' : 's'} they paid for
                    </strong>{' '}
                    will be deleted.
                  </span>
                </li>
              )}
              {impact.participantCount > 0 && (
                <li className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1 shrink-0 rounded-full bg-[var(--color-muted)]"
                  />
                  <span>
                    They'll be removed from{' '}
                    <strong className="font-semibold">
                      {impact.participantCount} other expense{impact.participantCount === 1 ? '' : 's'}
                    </strong>
                    , and the remaining people will pick up their share.
                  </span>
                </li>
              )}
            </ul>
          )}
          {impact && impact.orphanedItemCount > 0 && (
            <div
              role="alert"
              className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
            >
              <TriangleAlert
                className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
              <p>
                <strong className="font-semibold">
                  {impact.orphanedItemCount} item{impact.orphanedItemCount === 1 ? '' : 's'}
                </strong>{' '}
                will be left unassigned. Edit those expenses afterward so totals stay balanced.
              </p>
            </div>
          )}
          <p className="text-xs text-[var(--color-muted)]">This can't be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPendingRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (pendingRemove) removePerson(pendingRemove.id)
                setPendingRemove(null)
              }}
            >
              Remove
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  )
}
