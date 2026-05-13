import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { CURRENCIES, isCurrencyCode, type CurrencyCode } from '../../lib/currencies'

export function CurrencyPicker({
  value,
  onChange,
}: {
  value: CurrencyCode
  onChange: (next: CurrencyCode) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listboxId = useId()
  const current = CURRENCIES.find((c) => c.code === value) ?? CURRENCIES[0]

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Scroll current item into view on open
  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector<HTMLLIElement>(`[data-code="${value}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, value])

  function pick(code: string) {
    if (isCurrencyCode(code)) onChange(code)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={`Currency: ${current.name}`}
        className="flex h-9 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] pr-2 pl-3 text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/60"
      >
        <span className="font-mono text-xs tracking-wide">{current.code}</span>
        <span aria-hidden="true" className="text-[var(--color-muted)]">
          ·
        </span>
        <span aria-hidden="true" className="font-mono text-xs text-[var(--color-muted)]">
          {current.symbol}
        </span>
        <ChevronDown
          className={`size-3.5 text-[var(--color-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label="Currency"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.22, 0.61, 0.36, 1] }}
            className="absolute right-0 z-40 mt-1.5 max-h-72 w-56 origin-top-right overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-xl"
          >
            {CURRENCIES.map((c) => {
              const selected = c.code === value
              return (
                <li
                  key={c.code}
                  role="option"
                  aria-selected={selected}
                  data-code={c.code}
                  tabIndex={0}
                  onClick={() => pick(c.code)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      pick(c.code)
                    }
                  }}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm outline-none transition-colors hover:bg-[var(--color-accent-soft)] focus:bg-[var(--color-accent-soft)] ${
                    selected
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)]'
                      : 'text-[var(--color-ink)]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs tracking-wide">{c.code}</span>
                    <span className="text-[var(--color-muted)]">{c.name}</span>
                  </span>
                  <span className="font-mono text-xs text-[var(--color-muted)]">{c.symbol}</span>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
