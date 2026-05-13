/**
 * App wordmark — small Fraunces italic "Receipt." that anchors the brand in
 * the header and ties to the export view's display font.
 */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`h-display inline-flex shrink-0 items-baseline select-none text-lg leading-none text-[var(--color-ink)] ${className}`}
      aria-label="Receipt"
    >
      Receipt
      <span
        className="ml-0.5 inline-block size-1.5 translate-y-px rounded-full bg-[var(--color-accent)]"
        aria-hidden="true"
      />
    </span>
  )
}
