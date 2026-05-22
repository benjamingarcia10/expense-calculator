import { useEffect, useRef, useState } from 'react'
import { Dialog, Button } from './ui'
import { SessionSummaryCard, type SummarizableSession } from './SessionSummaryCard'
import { useSession } from '../store/session'
import type { PendingImport } from '../hooks/useUrlImport'

type Snapshot = {
  incoming: NonNullable<PendingImport>
  current: SummarizableSession
}

function captureSnapshot(pending: NonNullable<PendingImport>): Snapshot {
  const s = useSession.getState()
  return {
    incoming: pending,
    current: {
      currency: s.currency,
      title: s.title,
      people: s.people,
      expenses: s.expenses,
      createdAt: s.createdAt,
    },
  }
}

export function ImportDialog({
  pending,
  onAccept,
  onReject,
}: {
  pending: PendingImport
  onAccept: () => void
  onReject: () => void
}) {
  // Snapshot both sessions when an import first becomes pending. Retaining it
  // keeps the dialog body intact through the close animation (when `pending`
  // flips to null) and through accept (which replaces the live session).
  const [snapshot, setSnapshot] = useState<Snapshot | null>(() => (pending ? captureSnapshot(pending) : null))
  const wasPending = useRef(pending !== null)
  useEffect(() => {
    if (pending !== null && !wasPending.current) {
      setSnapshot(captureSnapshot(pending))
    }
    wasPending.current = pending !== null
  }, [pending])

  const isOverwrite = snapshot?.incoming.kind === 'overwrite'

  return (
    <Dialog open={pending !== null} onClose={onReject} title="Import shared session?">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[var(--color-muted)]">
          {isOverwrite
            ? "This replaces your current session — but we'll back it up first, so nothing is lost."
            : 'Importing this link loads the session below.'}
        </p>
        {snapshot && <SessionSummaryCard session={snapshot.incoming.session} label="From the shared link" />}
        {snapshot && isOverwrite && (
          <SessionSummaryCard session={snapshot.current} label="Your session now — saved as a backup" />
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onReject}>
            Keep current
          </Button>
          <Button onClick={onAccept}>Import</Button>
        </div>
      </div>
    </Dialog>
  )
}
