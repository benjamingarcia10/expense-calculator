import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus, Settings } from 'lucide-react'
import { useLibrary } from '../../store/library'
import { LibraryEntryRow } from './LibraryEntryRow'

const UNTITLED = 'Untitled split'

export function SessionSwitcher({ onOpenManage }: { onOpenManage: () => void }) {
  const entries = useLibrary((s) => s.entries)
  const activeId = useLibrary((s) => s.activeId)
  const switchEntry = useLibrary((s) => s.switchEntry)
  const createEntry = useLibrary((s) => s.createEntry)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const active = entries.find((e) => e.entryId === activeId)
  const sorted = [...entries].sort((a, b) => b.meta.lastEditedAt.localeCompare(a.meta.lastEditedAt))

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 border-b border-dashed border-[var(--color-border)] pb-0.5 text-base font-medium tracking-tight text-[var(--color-ink)] outline-none transition-colors hover:border-solid hover:border-[var(--color-muted)] focus:border-solid focus:border-[var(--color-accent)]"
      >
        <span className="truncate">{active?.session.title?.trim() || UNTITLED}</span>
        <ChevronDown className="size-3.5 text-[var(--color-muted)]" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute top-full left-0 z-40 mt-2 min-w-72 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-xl"
        >
          {sorted.map((e) => (
            <LibraryEntryRow
              key={e.entryId}
              entry={e}
              active={e.entryId === activeId}
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
            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-muted)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-ink)]"
          >
            <Plus className="size-3.5" aria-hidden="true" /> New session
          </button>
          <button
            type="button"
            onClick={() => {
              onOpenManage()
              setOpen(false)
            }}
            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-muted)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-ink)]"
          >
            <Settings className="size-3.5" aria-hidden="true" /> Manage library…
          </button>
        </div>
      )}
    </div>
  )
}
