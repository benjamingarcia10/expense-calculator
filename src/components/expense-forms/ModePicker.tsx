import type { ComponentType } from 'react'
import { Equal, Hash, Receipt, Bed, Car, X } from 'lucide-react'
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
    <div className="grid grid-cols-2 gap-2">
      {MODES.map(({ type, label, description, icon: Icon }) => (
        <button
          key={type}
          onClick={() => onPick(type)}
          className="flex flex-col items-start gap-1 rounded-xl border border-[--color-border] bg-[--color-surface] p-3 text-left transition-colors hover:border-[--color-accent]"
        >
          <Icon className="size-5 text-[--color-accent]" />
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-[--color-muted]">{description}</span>
        </button>
      ))}
    </div>
  )
}
