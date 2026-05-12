import { useState } from 'react'
import { Trash2, UserPlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from '../store/session'
import { LIMITS } from '../lib/validation'
import { Button, Dialog, Input } from './ui'

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

  const removingPayerExpenses = pendingRemove
    ? expenses.filter((e) => e.paidById === pendingRemove.id).length
    : 0

  function attemptRemove(personId: string) {
    // Frictionless when they're not referenced anywhere; confirm if removing
    // the person would cascade-delete expenses they paid for.
    const isReferenced =
      expenses.some((e) => e.paidById === personId) ||
      expenses.some((e) => {
        switch (e.type) {
          case 'equal':
            return e.participantIds.includes(personId)
          case 'shares':
            return personId in e.shares
          case 'exact':
            return personId in e.amounts
          case 'mileage':
            return personId in e.units
          case 'restaurant':
            return e.items.some((i) => i.assignedIds.includes(personId))
          case 'lodging':
            return personId in e.nights
        }
      })
    if (isReferenced) {
      const person = people.find((p) => p.id === personId)
      if (person) setPendingRemove({ id: person.id, name: person.name })
    } else {
      removePerson(personId)
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">
          People <span className="text-[var(--color-muted)]">({people.length})</span>
        </h2>
      </div>
      <ul className="flex flex-col gap-1">
        <AnimatePresence initial={false}>
          {people.map((p) => (
            <motion.li
              key={p.id}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-[var(--color-border)]/30"
            >
              <span className="truncate">{p.name}</span>
              <button
                aria-label={`remove ${p.name}`}
                onClick={() => attemptRemove(p.id)}
                className="grid size-11 place-items-center rounded-md text-[var(--color-muted)] hover:bg-red-600/15 hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
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
        <Button type="submit" size="md" disabled={atMax || !name.trim()}>
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
          <p className="text-sm">
            {removingPayerExpenses > 0
              ? `This will also delete ${removingPayerExpenses} expense${removingPayerExpenses === 1 ? '' : 's'} they paid for. This cannot be undone.`
              : 'They will be removed from any expenses that include them. This cannot be undone.'}
          </p>
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
