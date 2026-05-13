import {
  forwardRef,
  useEffect,
  useState,
  type InputHTMLAttributes,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
} from 'react'
import { CURRENCIES, currencyDecimals, type CurrencyCode } from '../../lib/currencies'

export type MoneyInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'inputMode' | 'min' | 'max' | 'step'
> & {
  /** Current value as a string. Partial inputs like "12." remain editable because
   * the component keeps its own typed text and only resyncs when the external
   * numeric value differs. */
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

function sanitize(raw: string, max: number, decimals: number): string {
  // Currencies with 0 decimals (JPY, KRW…) don't accept a decimal point at all
  const allowed = decimals > 0 ? /[^0-9.]/g : /[^0-9]/g
  let cleaned = raw.replace(allowed, '')
  if (decimals > 0) {
    const firstDot = cleaned.indexOf('.')
    if (firstDot !== -1) {
      cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
      const [whole, frac = ''] = cleaned.split('.')
      cleaned = `${whole}.${frac.slice(0, decimals)}`
    }
  }
  const numeric = Number(cleaned)
  if (Number.isFinite(numeric) && numeric > max) return String(max)
  return cleaned
}

/** On blur, normalize "12" → "12.00" (USD) or "12" → "12" (JPY). Empty stays empty. */
function formatOnBlur(text: string, decimals: number): string {
  if (text === '' || text === '.') return ''
  const n = Number(text)
  if (!Number.isFinite(n)) return text
  return n.toFixed(decimals)
}

/** Compare two money strings by their parsed numeric value. Used to detect
 * when the external value has *meaningfully* changed (vs the parent simply
 * round-tripping "30." → number 30 → string "30"). */
function sameNumber(a: string, b: string): boolean {
  if (a === b) return true
  const na = Number(a)
  const nb = Number(b)
  if (Number.isNaN(na) && Number.isNaN(nb)) return true
  return na === nb
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onChange, currency, max = 999_999.99, invalid, className = '', onBlur, ...props }, ref) => {
    const symbol = symbolFor(currency)
    const decimals = currencyDecimals(currency)
    // Reserve space proportional to symbol length so long symbols ("MX$", "AED") fit
    const padding = symbol.length <= 1 ? 'pl-7' : symbol.length === 2 ? 'pl-9' : 'pl-11'

    // Track the typed text separately so a trailing "." or "5.0" isn't clobbered
    // when the parent normalizes the value via parseMoney → number → String().
    const [text, setText] = useState(value)
    useEffect(() => {
      if (!sameNumber(text, value)) {
        setText(value)
      }
      // We deliberately only re-sync on external value changes.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
      const next = sanitize(e.target.value, max, decimals)
      setText(next)
      onChange(next)
    }
    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
      if (BLOCKED_KEYS.has(e.key)) e.preventDefault()
      if (decimals === 0 && e.key === '.') e.preventDefault()
    }
    function handleBlur(e: FocusEvent<HTMLInputElement>) {
      const formatted = formatOnBlur(text, decimals)
      if (formatted !== text) {
        setText(formatted)
        onChange(formatted)
      }
      onBlur?.(e)
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
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
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
