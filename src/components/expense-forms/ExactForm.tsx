import type { Expense } from '../../types'
import { Button } from '../ui'

export function ExactForm({ onDone }: { editing: Expense | null; onDone: () => void }) {
  return (
    <div className="flex justify-end">
      <Button variant="ghost" onClick={onDone}>
        Cancel (stub)
      </Button>
    </div>
  )
}
