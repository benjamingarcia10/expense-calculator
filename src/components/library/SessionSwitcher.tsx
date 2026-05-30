import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronDown, Pencil, Plus, Settings } from 'lucide-react'
import { useLibrary } from '../../store/library'
import { entryDisplayTitle, entryHasGivenTitle } from '../../lib/entry-display'
import { LIMITS } from '../../lib/validation'
import { LibraryEntryRow } from './LibraryEntryRow'

export function SessionSwitcher({ onOpenManage }: { onOpenManage: () => void }) {
  const entries = useLibrary((s) => s.entries)
  const activeId = useLibrary((s) => s.activeId)
  const switchEntry = useLibrary((s) => s.switchEntry)
  const createEntry = useLibrary((s) => s.createEntry)
  const renameEntry = useLibrary((s) => s.renameEntry)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [focusedIdx, setFocusedIdx] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([])

  const active = entries.find((e) => e.entryId === activeId)
  const sorted = [...entries].sort((a, b) => b.meta.lastEditedAt.localeCompare(a.meta.lastEditedAt))

  function openDropdown() {
    // Seed keyboard focus to the active row so arrow nav starts where the
    // user expects. Handled in the click handler instead of an effect so the
    // state write doesn't violate the set-state-in-effect lint rule.
    const idx = sorted.findIndex((e) => e.entryId === activeId)
    setFocusedIdx(idx === -1 ? 0 : idx)
    setOpen(true)
  }

  function beginEditing() {
    setOpen(false)
    setEditing(true)
  }

  // Move browser focus to the row matching focusedIdx so users get a visible
  // focus ring and screen readers announce the selection.
  useLayoutEffect(() => {
    if (!open) return
    rowRefs.current[focusedIdx]?.focus()
  }, [open, focusedIdx])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIdx((i) => Math.min(i + 1, sorted.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIdx((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Home') {
        e.preventDefault()
        setFocusedIdx(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        setFocusedIdx(sorted.length - 1)
      }
    }
    window.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, sorted.length])

  if (editing && active) {
    return (
      <InlineRename
        initial={entryHasGivenTitle(active) ? (active.session.title ?? '') : ''}
        placeholder={entryDisplayTitle(active)}
        onSubmit={(t) => {
          renameEntry(active.entryId, t)
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  const triggerLabel = active ? entryDisplayTitle(active) : 'Untitled split'
  const triggerIsPlaceholder = !active || !entryHasGivenTitle(active)

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openDropdown())}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`flex max-w-xs items-center gap-1.5 border-b border-dashed border-[var(--color-border)] pb-1 text-base leading-tight font-medium tracking-tight outline-none transition-colors hover:border-solid hover:border-[var(--color-muted)] focus:border-solid focus:border-[var(--color-accent)] ${
            triggerIsPlaceholder ? 'text-[var(--color-muted)] italic' : 'text-[var(--color-ink)]'
          }`}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="size-3.5 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={beginEditing}
          aria-label="rename session"
          title="Rename session"
          className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]/40 hover:text-[var(--color-ink)] focus-visible:bg-[var(--color-border)]/40 focus-visible:text-[var(--color-ink)] focus-visible:outline-none"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </button>
      </div>
      {open && (
        <div
          role="listbox"
          aria-label="Saved sessions"
          className="absolute top-full left-0 z-40 mt-2 min-w-72 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-xl"
        >
          {sorted.map((e, i) => (
            <LibraryEntryRow
              key={e.entryId}
              ref={(el) => {
                rowRefs.current[i] = el
              }}
              entry={e}
              active={e.entryId === activeId}
              role="option"
              tabIndex={focusedIdx === i ? 0 : -1}
              onSelect={() => {
                switchEntry(e.entryId)
                setOpen(false)
              }}
            />
          ))}
          <div className="my-1 border-t border-[var(--color-border)]" />
          <button
            type="button"
            onClick={() => {
              createEntry()
              setOpen(false)
            }}
            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-muted)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-ink)] focus-visible:bg-[var(--color-accent-soft)] focus-visible:text-[var(--color-ink)] focus-visible:outline-none"
          >
            <Plus className="size-3.5" aria-hidden="true" /> New session
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenManage()
              setOpen(false)
            }}
            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-muted)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-ink)] focus-visible:bg-[var(--color-accent-soft)] focus-visible:text-[var(--color-ink)] focus-visible:outline-none"
          >
            <Settings className="size-3.5" aria-hidden="true" /> Manage library…
          </button>
        </div>
      )}
    </div>
  )
}

function InlineRename({
  initial,
  placeholder,
  onSubmit,
  onCancel,
}: {
  initial: string
  placeholder: string
  onSubmit: (t: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(initial)
  return (
    <input
      autoFocus
      aria-label="session title"
      placeholder={placeholder}
      value={value}
      maxLength={LIMITS.sessionTitle}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onSubmit(value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onSubmit(value)
        } else if (e.key === 'Escape') {
          e.preventDefault()
          onCancel()
        }
      }}
      className="w-56 max-w-xs border-b border-dashed border-[var(--color-accent)] bg-transparent pb-0.5 text-base font-medium tracking-tight text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)]"
    />
  )
}
