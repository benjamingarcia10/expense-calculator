import type { ComponentType } from 'react'
import { Equal, Hash, Receipt, Bed, Car, X } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ExpenseType } from '../../types'

const MODES: Array<{
  type: ExpenseType
  label: string
  description: string
  icon: ComponentType<{ className?: string }>
}> = [
  { type: 'equal', label: 'Equal', description: 'Even split among selected people', icon: Equal },
  { type: 'shares', label: 'Shares', description: 'Proportional weights (e.g. 2:1:1)', icon: X },
  { type: 'exact', label: 'Exact', description: "Manually enter each person's amount", icon: Hash },
  { type: 'mileage', label: 'Mileage', description: 'Split by miles, hours, or other units', icon: Car },
  { type: 'restaurant', label: 'Restaurant', description: 'Itemized bill with tax & tip', icon: Receipt },
  { type: 'lodging', label: 'Lodging', description: 'Airbnb/hotel by nights and rooms', icon: Bed },
]

export function ModePicker({ onPick }: { onPick: (type: ExpenseType) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="tag">Choose a split mode</p>
      <div className="grid grid-cols-2 gap-2">
        {MODES.map(({ type, label, description, icon: Icon }, i) => (
          <motion.button
            key={type}
            type="button"
            onClick={() => onPick(type)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04, ease: [0.22, 0.61, 0.36, 1] }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="group relative flex flex-col items-start gap-2 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)] transition-colors group-hover:bg-[var(--color-accent)] group-hover:text-white">
              <Icon className="size-4" />
            </span>
            <span className="font-medium text-[var(--color-ink)]">{label}</span>
            <span className="text-xs leading-snug text-[var(--color-muted)]">{description}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
