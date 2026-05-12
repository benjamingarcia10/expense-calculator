import { forwardRef, type InputHTMLAttributes, type ChangeEvent, type KeyboardEvent } from 'react'
import { CURRENCIES, type CurrencyCode } from '../../lib/currencies'

export type MoneyInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'inputMode' | 'min' | 'max' | 'step'
> & {
  /** Current value as a string (raw user-typed text) so partial inputs like "12." remain editable */
  value: string
  /** Called with the new string value, already sanitized (no e/E/+/-) */
  onChange: (next: string) => void
  /** ISO currency code used to pick the prefix symbol */
  currency: CurrencyCode
  /** Optional max value (default 999_999.99) */
  max?: number
  invalid?: boolean
}

const BLOCKED_KEYS = new Set(['e', 'E', '+', '-'])

function symbolFor(currency: CurrencyCode): string {
  return CURRENCIES.find((c) => c.code === currency)?.symbol ?? '$'
}

function sanitize(raw: string, max: number): string {
  let cleaned = raw.replace(/[^0-9.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
    const [whole, frac = ''] = cleaned.split('.')
    cleaned = `${whole}.${frac.slice(0, 2)}`
  }
  const numeric = Number(cleaned)
  if (Number.isFinite(numeric) && numeric > max) return String(max)
  return cleaned
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onChange, currency, max = 999_999.99, invalid, className = '', ...props }, ref) => {
    const symbol = symbolFor(currency)
    // Reserve space proportional to symbol length so long symbols ("MX$", "AED") fit
    const padding = symbol.length <= 1 ? 'pl-7' : symbol.length === 2 ? 'pl-9' : 'pl-11'

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
      onChange(sanitize(e.target.value, max))
    }
    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
      if (BLOCKED_KEYS.has(e.key)) e.preventDefault()
    }

    return (
      <div className={`relative ${className}`}>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-sm text-[var(--color-muted)]"
        >
          {symbol}
        </span>
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={`h-10 w-full rounded-lg border bg-[var(--color-surface)] ${padding} pr-3 text-right font-mono text-sm tabular-nums text-[var(--color-ink)] outline-none transition-colors placeholder:font-sans placeholder:text-[var(--color-muted)] ${
            invalid ? 'border-red-500' : 'border-[var(--color-border)] focus:border-[var(--color-accent)]'
          }`}
          {...props}
        />
      </div>
    )
  }
)
MoneyInput.displayName = 'MoneyInput'
