import { useState } from 'react'
import { Sheet } from '../ui'
import { ModePicker } from './ModePicker'
import { EqualForm } from './EqualForm'
import { SharesForm } from './SharesForm'
import { ExactForm } from './ExactForm'
import { MileageForm } from './MileageForm'
import { RestaurantForm } from './RestaurantForm'
import { LodgingForm } from './LodgingForm'
import type { Expense, ExpenseType } from '../../types'

export function ExpenseSheet({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: Expense | null
}) {
  const [type, setType] = useState<ExpenseType | null>(null)

  const activeType = editing?.type ?? type
  const title = editing ? 'Edit expense' : activeType ? `New ${activeType} expense` : 'New expense'

  function done() {
    setType(null)
    onClose()
  }

  return (
    <Sheet open={open} onClose={done} title={title}>
      {!activeType && <ModePicker onPick={setType} />}
      {activeType === 'equal' && <EqualForm editing={editing} onDone={done} />}
      {activeType === 'shares' && <SharesForm editing={editing} onDone={done} />}
      {activeType === 'exact' && <ExactForm editing={editing} onDone={done} />}
      {activeType === 'mileage' && <MileageForm editing={editing} onDone={done} />}
      {activeType === 'restaurant' && <RestaurantForm editing={editing} onDone={done} />}
      {activeType === 'lodging' && <LodgingForm editing={editing} onDone={done} />}
    </Sheet>
  )
}
