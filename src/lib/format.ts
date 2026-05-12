import type { CurrencyCode } from './currencies'

export function formatMoney(amount: number, currency: CurrencyCode): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function formatSigned(amount: number, currency: CurrencyCode): string {
  const abs = Math.abs(amount)
  const f = formatMoney(abs, currency)
  if (amount > 0.005) return `+${f}`
  if (amount < -0.005) return `-${f}`
  return f
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
