import { useState } from 'react'
import { Button, Dialog, Sheet } from '../ui'
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
  // Track whether the user has interacted with the form inputs so an accidental
  // backdrop click / swipe-down / Escape doesn't silently discard their work.
  const [dirty, setDirty] = useState(false)
  const [confirmingDismiss, setConfirmingDismiss] = useState(false)

  const activeType = editing?.type ?? type
  const title = editing ? 'Edit expense' : activeType ? `New ${activeType} expense` : 'New expense'

  function done() {
    setType(null)
    setDirty(false)
    onClose()
  }

  function requestClose() {
    // Only guard once the user is past the mode picker and has actually typed.
    if (dirty && activeType) {
      setConfirmingDismiss(true)
    } else {
      done()
    }
  }

  return (
    <>
      <Sheet open={open} onClose={requestClose} title={title}>
        {/* Any input/change inside the sheet flips the dirty flag — works for
          text, money, numeric, checkbox, select, and radio without touching the
          individual form components. */}
        <div onInput={() => setDirty(true)} onChange={() => setDirty(true)} className="flex flex-col gap-4">
          {!activeType && <ModePicker onPick={setType} />}
          {activeType === 'equal' && <EqualForm editing={editing} onDone={done} />}
          {activeType === 'shares' && <SharesForm editing={editing} onDone={done} />}
          {activeType === 'exact' && <ExactForm editing={editing} onDone={done} />}
          {activeType === 'mileage' && <MileageForm editing={editing} onDone={done} />}
          {activeType === 'restaurant' && <RestaurantForm editing={editing} onDone={done} />}
          {activeType === 'lodging' && <LodgingForm editing={editing} onDone={done} />}
        </div>
      </Sheet>
      <Dialog open={confirmingDismiss} onClose={() => setConfirmingDismiss(false)} title="Discard expense?">
        <div className="flex flex-col gap-3">
          <p className="text-sm">You have unsaved changes. Closing will discard them.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmingDismiss(false)}>
              Keep editing
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmingDismiss(false)
                done()
              }}
            >
              Discard
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
