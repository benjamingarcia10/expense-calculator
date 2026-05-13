import {
  forwardRef,
  useEffect,
  useState,
  type InputHTMLAttributes,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'

export type NumericInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'inputMode' | 'min' | 'max' | 'step'
> & {
  value: string
  onChange: (next: string) => void
  /** Restrict input to integers (no decimal point allowed) */
  integer?: boolean
  /** Max value (inclusive). Defaults: integer → 365, decimal → 99,999 */
  max?: number
  /** Trailing unit label rendered as a quiet adornment, e.g. "miles" or "nights" */
  unit?: string
  invalid?: boolean
}

const BLOCKED_KEYS = new Set(['e', 'E', '+', '-'])

function sanitize(raw: string, integer: boolean, max: number): string {
  let cleaned = raw.replace(integer ? /[^0-9]/g : /[^0-9.]/g, '')
  if (!integer) {
    const firstDot = cleaned.indexOf('.')
    if (firstDot !== -1) {
      cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
    }
  }
  const numeric = Number(cleaned)
  if (Number.isFinite(numeric) && numeric > max) return String(max)
  return cleaned
}

/** Compare two number strings by parsed value to detect external changes that
 * aren't just the parent normalizing our typed text. */
function sameNumber(a: string, b: string): boolean {
  if (a === b) return true
  const na = Number(a)
  const nb = Number(b)
  if (Number.isNaN(na) && Number.isNaN(nb)) return true
  return na === nb
}

export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  ({ value, onChange, integer = false, max, unit, invalid, className = '', ...props }, ref) => {
    const effectiveMax = max ?? (integer ? 365 : 99_999)

    // Preserve typed text (e.g. "5." or "5.0") across parent-driven re-renders
    // that normalize back to "5". Without this, the user can't type a decimal
    // in fields whose parent state stores a number.
    const [text, setText] = useState(value)
    useEffect(() => {
      if (!sameNumber(text, value)) {
        setText(value)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
      const next = sanitize(e.target.value, integer, effectiveMax)
      setText(next)
      onChange(next)
    }

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
      if (BLOCKED_KEYS.has(e.key)) e.preventDefault()
      if (integer && e.key === '.') e.preventDefault()
    }

    if (unit) {
      return (
        <div
          className={`flex h-10 w-full items-stretch overflow-hidden rounded-lg border bg-[var(--color-surface)] transition-colors focus-within:border-[var(--color-accent)] ${
            invalid ? 'border-red-500' : 'border-[var(--color-border)]'
          } ${className}`}
        >
          <input
            ref={ref}
            type="text"
            inputMode={integer ? 'numeric' : 'decimal'}
            autoComplete="off"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="min-w-0 flex-1 bg-transparent px-3 text-right font-mono text-sm tabular-nums text-[var(--color-ink)] outline-none placeholder:font-sans placeholder:text-[var(--color-muted)]"
            {...props}
          />
          <span
            aria-hidden="true"
            className="grid place-items-center border-l border-[var(--color-border)] bg-[var(--color-border)]/30 px-3 text-xs text-[var(--color-muted)]"
          >
            {unit}
          </span>
        </div>
      )
    }

    return (
      <input
        ref={ref}
        type="text"
        inputMode={integer ? 'numeric' : 'decimal'}
        autoComplete="off"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={`h-10 w-full rounded-lg border bg-[var(--color-surface)] px-3 text-right font-mono text-sm tabular-nums text-[var(--color-ink)] outline-none transition-colors ${
          invalid ? 'border-red-500' : 'border-[var(--color-border)] focus:border-[var(--color-accent)]'
        } ${className}`}
        {...props}
      />
    )
  }
)
NumericInput.displayName = 'NumericInput'
