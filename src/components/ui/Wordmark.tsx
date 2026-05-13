/**
 * App wordmark — small Fraunces italic "Receipt." that anchors the brand in
 * the header and ties to the export view's display font.
 */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`h-display select-none text-lg leading-none text-[var(--color-ink)] ${className}`}
      aria-label="Receipt"
    >
      Receipt<span className="text-[var(--color-accent)]">.</span>
    </span>
  )
}
