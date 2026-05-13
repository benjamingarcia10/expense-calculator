/**
 * App wordmark — Fraunces italic "Receipt" paired with a tiny barcode glyph,
 * which is more memorable than a bare period and ties to the receipt motif.
 */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`h-display inline-flex shrink-0 items-baseline gap-1.5 select-none text-lg leading-none text-[var(--color-ink)] ${className}`}
      aria-label="Receipt"
    >
      <span>Receipt</span>
      <span
        aria-hidden="true"
        className="inline-flex translate-y-[-2px] items-end gap-[1.5px] text-[var(--color-accent)]"
      >
        <span className="block h-2 w-[2px] bg-current" />
        <span className="block h-3 w-[1px] bg-current opacity-80" />
        <span className="block h-1.5 w-[2px] bg-current opacity-60" />
        <span className="block h-2.5 w-[1px] bg-current opacity-90" />
      </span>
    </span>
  )
}
