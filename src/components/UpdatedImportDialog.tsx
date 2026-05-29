import { Dialog, Button } from './ui'
import { SessionSummaryCard } from './SessionSummaryCard'
import type { PendingImport } from '../hooks/useUrlImport'

const UNTITLED = 'Untitled split'

export function UpdatedImportDialog({
  pending,
  onReplace,
  onKeepBoth,
  onReject,
}: {
  pending: PendingImport
  onReplace: () => void
  onKeepBoth: () => void
  onReject: () => void
}) {
  const isUpdated = pending?.kind === 'updated'
  const matched = isUpdated ? pending.matched : null
  const incoming = isUpdated ? pending.incoming : null
  const title = matched?.session.title?.trim() || UNTITLED

  return (
    <Dialog open={pending !== null} onClose={onReject} title={`Updated version of "${title}"`}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[var(--color-muted)]">
          Someone updated this shared receipt. You can replace your copy or keep both.
        </p>
        {incoming && (
          <SessionSummaryCard
            session={{
              currency: incoming.currency,
              title: incoming.title,
              people: incoming.people,
              expenses: incoming.expenses,
              createdAt: incoming.createdAt,
            }}
            label="Incoming"
          />
        )}
        {matched && (
          <SessionSummaryCard
            session={{
              currency: matched.session.currency,
              title: matched.session.title,
              people: matched.session.people,
              expenses: matched.session.expenses,
              createdAt: matched.session.createdAt,
            }}
            label="Your copy"
          />
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onReject}>
            Cancel
          </Button>
          <Button variant="ghost" onClick={onKeepBoth}>
            Keep both
          </Button>
          <Button onClick={onReplace}>Replace</Button>
        </div>
      </div>
    </Dialog>
  )
}
