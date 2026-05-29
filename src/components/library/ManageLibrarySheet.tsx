import { useEffect, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import { Check, Copy, Files, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Dialog, Sheet } from '../ui'
import { formatBytes } from '../../lib/format-bytes'
import { entryDisplayTitle, entryHasGivenTitle, relativeTime } from '../../lib/entry-display'
import { useLibrary } from '../../store/library'
import { buildShareUrl } from '../../lib/url-share'
import type { LibraryEntry } from '../../types'

const ENTRY_WARN_BYTES = 200_000
const STORAGE_BUDGET_BYTES = 5 * 1024 * 1024

function pluralize(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`
}

function libraryUsage(): number {
  const { entries, activeId } = useLibrary.getState()
  return new Blob([JSON.stringify({ entries, activeId })]).size
}

function entrySize(entry: LibraryEntry): number {
  return new Blob([JSON.stringify(entry.session)]).size
}

export function ManageLibrarySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const entries = useLibrary((s) => s.entries)
  const activeId = useLibrary((s) => s.activeId)
  const switchEntry = useLibrary((s) => s.switchEntry)
  const renameEntry = useLibrary((s) => s.renameEntry)
  const duplicateEntry = useLibrary((s) => s.duplicateEntry)
  const deleteEntry = useLibrary((s) => s.deleteEntry)
  const ensureSessionId = useLibrary((s) => s.ensureSessionId)
  const createEntry = useLibrary((s) => s.createEntry)
  const [confirming, setConfirming] = useState<string | null>(null)

  const sorted = [...entries].sort((a, b) => b.meta.lastEditedAt.localeCompare(a.meta.lastEditedAt))
  const usage = libraryUsage()

  function handleCopyLink(entryId: string) {
    ensureSessionId(entryId)
    const entry = useLibrary.getState().entries.find((e) => e.entryId === entryId)
    if (!entry) return
    const url = buildShareUrl(window.location.origin + window.location.pathname, entry.session)
    void navigator.clipboard.writeText(url).then(
      () => toast.success('Link copied'),
      () => toast.error("Couldn't copy link")
    )
  }

  function handleDuplicate(entryId: string) {
    duplicateEntry(entryId)
  }

  return (
    <>
      <Sheet open={open} onClose={onClose} title="Library">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--color-muted)]">
              {formatBytes(usage)} used of ~{formatBytes(STORAGE_BUDGET_BYTES)}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                createEntry()
                onClose()
              }}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              New session
            </Button>
          </div>
          <ul className="flex flex-col divide-y divide-[var(--color-border)]">
            {sorted.map((entry) => (
              <ManageRow
                key={entry.entryId}
                entry={entry}
                active={entry.entryId === activeId}
                onSelect={() => {
                  switchEntry(entry.entryId)
                  onClose()
                }}
                onRename={(title) => renameEntry(entry.entryId, title)}
                onCopyLink={() => handleCopyLink(entry.entryId)}
                onDuplicate={() => handleDuplicate(entry.entryId)}
                onDelete={() => setConfirming(entry.entryId)}
              />
            ))}
          </ul>
        </div>
      </Sheet>
      <Dialog open={confirming !== null} onClose={() => setConfirming(null)} title="Delete this session?">
        <div className="flex flex-col gap-3">
          <p className="text-sm">This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirming) deleteEntry(confirming)
                setConfirming(null)
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}

function ManageRow({
  entry,
  active,
  onSelect,
  onRename,
  onCopyLink,
  onDuplicate,
  onDelete,
}: {
  entry: LibraryEntry
  active: boolean
  onSelect: () => void
  onRename: (title: string) => void
  onCopyLink: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const title = entryDisplayTitle(entry)
  const isPlaceholderTitle = !entryHasGivenTitle(entry)
  const isLarge = entrySize(entry) > ENTRY_WARN_BYTES
  const isShared = entry.session.sessionId !== null
  const peopleCount = entry.session.people.length
  const expenseCount = entry.session.expenses.length
  const edited = relativeTime(entry.meta.lastEditedAt)

  // Close the overflow menu on outside click or Escape, matching the
  // SessionSwitcher dropdown pattern.
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  return (
    <li
      data-active={active}
      className={`relative flex items-center justify-between gap-2 py-2 ${active ? 'bg-[var(--color-accent-soft)]' : ''}`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-start gap-2 px-2 text-left"
      >
        <span aria-hidden="true" className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center">
          {active && <Check className="size-3.5 text-[var(--color-accent)]" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          <span className="flex min-w-0 max-w-full items-center gap-2">
            <span
              className={`truncate text-sm font-medium ${
                isPlaceholderTitle ? 'text-[var(--color-muted)] italic' : 'text-[var(--color-ink)]'
              }`}
            >
              {title}
            </span>
            {isShared && (
              <span className="shrink-0 rounded-full bg-[var(--color-accent-soft)] px-1.5 py-0.5 text-[10px] tracking-[0.18em] text-[var(--color-accent)] uppercase">
                Shared
              </span>
            )}
            {isLarge && (
              <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] tracking-[0.18em] text-amber-700 uppercase">
                Large
              </span>
            )}
          </span>
          <span className="font-mono text-[10px] tracking-[0.18em] text-[var(--color-muted)] uppercase">
            {pluralize(peopleCount, 'person', 'people')} · {pluralize(expenseCount, 'expense', 'expenses')} ·{' '}
            {entry.session.currency}
            {edited && ` · edited ${edited}`}
          </span>
        </span>
      </button>
      <button
        type="button"
        aria-label={`Rename ${title}`}
        onClick={() => setEditing(true)}
        className="grid size-8 place-items-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]/40 hover:text-[var(--color-ink)]"
      >
        <Pencil className="size-3.5" aria-hidden="true" />
      </button>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-label={`More actions for ${title}`}
          onClick={() => setMenuOpen((o) => !o)}
          className="grid size-8 place-items-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]/40 hover:text-[var(--color-ink)]"
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute top-full right-0 z-40 mt-1 min-w-44 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-xl"
          >
            <MenuItem
              icon={Copy}
              label="Copy share link"
              onClick={() => {
                onCopyLink()
                setMenuOpen(false)
              }}
            />
            <MenuItem
              icon={Files}
              label="Duplicate"
              onClick={() => {
                onDuplicate()
                setMenuOpen(false)
              }}
            />
            <MenuItem
              icon={Trash2}
              label="Delete"
              danger
              onClick={() => {
                onDelete()
                setMenuOpen(false)
              }}
            />
          </div>
        )}
      </div>
      {editing && (
        <InlineRename
          initial={isPlaceholderTitle ? '' : entry.session.title?.trim() || ''}
          onSubmit={(t) => {
            onRename(t)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </li>
  )
}

function MenuItem({
  icon: Icon,
  label,
  danger = false,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-accent-soft)] ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-[var(--color-ink)]'
      }`}
    >
      <Icon className="size-3.5" /> {label}
    </button>
  )
}

function InlineRename({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: string
  onSubmit: (t: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(initial)
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(value)
      }}
      className="absolute right-0 left-0 z-50 -mt-1 flex gap-2 bg-[var(--color-surface)] p-2 shadow-lg"
    >
      <input
        autoFocus
        className="flex-1 border-b border-dashed border-[var(--color-border)] bg-transparent px-1 py-1 text-sm outline-none"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      />
      <Button size="sm" type="submit">
        Save
      </Button>
    </form>
  )
}
