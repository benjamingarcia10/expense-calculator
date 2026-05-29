import { forwardRef } from 'react'
import { Check } from 'lucide-react'
import type { LibraryEntry } from '../../types'

const UNTITLED = 'Untitled split'

function pluralize(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`
}

type Props = {
  entry: LibraryEntry
  active: boolean
  onSelect: () => void
  /**
   * Roving-tabindex value. When this row is the focused option in a listbox,
   * pass 0 so it joins the tab order; pass -1 for the rest. Leave undefined
   * when the row is rendered outside a listbox (default browser tab order).
   */
  tabIndex?: number
  /**
   * ARIA role override. Pass "option" inside a listbox; omit when used as a
   * standalone button (e.g. in the manage sheet).
   */
  role?: 'option'
}

export const LibraryEntryRow = forwardRef<HTMLButtonElement, Props>(function LibraryEntryRow(
  { entry, active, onSelect, tabIndex, role },
  ref
) {
  const title = entry.session.title?.trim() || UNTITLED
  const peopleCount = entry.session.people.length
  const expenseCount = entry.session.expenses.length

  return (
    <button
      ref={ref}
      type="button"
      onClick={onSelect}
      data-active={active}
      role={role}
      tabIndex={tabIndex}
      aria-selected={role === 'option' ? active : undefined}
      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-accent-soft)] focus-visible:bg-[var(--color-accent-soft)] focus-visible:outline-none ${
        active ? 'bg-[var(--color-accent-soft)]' : ''
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        {active ? (
          <Check className="size-3.5 shrink-0 text-[var(--color-accent)]" aria-hidden="true" />
        ) : (
          <span aria-hidden="true" className="inline-block size-3.5 shrink-0" />
        )}
        <span className="truncate font-medium text-[var(--color-ink)]">{title}</span>
      </span>
      <span className="shrink-0 font-mono text-[10px] tracking-[0.18em] text-[var(--color-muted)] uppercase">
        {pluralize(peopleCount, 'person', 'people')} · {pluralize(expenseCount, 'expense', 'expenses')}
      </span>
    </button>
  )
})
