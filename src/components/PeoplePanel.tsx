import { useState } from 'react'
import { Trash2, UserPlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from '../store/session'
import { LIMITS } from '../lib/validation'
import { Button, Input } from './ui'

export function PeoplePanel() {
  const people = useSession((s) => s.people)
  const addPerson = useSession((s) => s.addPerson)
  const removePerson = useSession((s) => s.removePerson)
  const [name, setName] = useState('')

  const atMax = people.length >= LIMITS.maxPeople

  const submit = () => {
    if (!name.trim() || atMax) return
    addPerson(name)
    setName('')
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[--color-border] bg-[--color-surface] p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">
          People <span className="text-[--color-muted]">({people.length})</span>
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
              className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-[--color-border]/30"
            >
              <span className="truncate">{p.name}</span>
              <button
                aria-label={`remove ${p.name}`}
                onClick={() => removePerson(p.id)}
                className="text-[--color-muted] hover:text-red-600"
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
        <p className="text-xs text-[--color-muted]">Limit of {LIMITS.maxPeople} people reached.</p>
      )}
    </section>
  )
}
