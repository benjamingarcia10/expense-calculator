import type { Session } from '../../types'
import { computeBalances } from '../../lib/compute-balances'
import { simplifyDebts } from '../../lib/simplify-debts'
import { formatMoney, formatDate } from '../../lib/format'
import type { CurrencyCode } from '../../lib/currencies'
import { expenseTotal } from '../../types'

export function buildSummaryText(session: Session): string {
  const debts = simplifyDebts(computeBalances(session.people, session.expenses))
  const totalSpent = session.expenses.reduce((s, e) => s + expenseTotal(e), 0)
  const title = session.title ?? 'Expense Summary'
  const date = formatDate(session.createdAt)
  const currency = session.currency as CurrencyCode
  const lines: string[] = [
    `${title} (${date})`,
    `Total: ${formatMoney(totalSpent, currency)} across ${session.people.length} people, ${session.expenses.length} expenses`,
    '',
    'Settle up:',
  ]
  if (debts.length === 0) lines.push('• All even')
  for (const d of debts) {
    lines.push(`• ${d.fromName} → ${d.toName}  ${formatMoney(d.amount, currency)}`)
  }
  return lines.join('\n')
}

export function safeFilenameBase(title: string | null): string {
  const raw = title ?? 'expense-summary'
  return raw.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()
}

// Rasterize the receipt card into a PNG. Used by both the save-to-disk and
// copy-to-clipboard paths so they share font-readiness + paper-tinted edges.
async function rasterize(node: HTMLElement): Promise<Blob> {
  const { toBlob } = await import('html-to-image')
  // Wait for any custom fonts to load before rasterizing so the export uses the
  // designed display + mono fonts rather than fallbacks (Georgia, ui-monospace).
  try {
    await document.fonts.ready
  } catch {
    /* ignore — old browsers without document.fonts will fall back to whatever loaded */
  }
  const blob = await toBlob(node, {
    pixelRatio: 2,
    // Match the receipt's paper color so any antialiased edges blend in.
    backgroundColor: '#f5ecd9',
  })
  if (!blob) throw new Error('Failed to rasterize receipt')
  return blob
}

export async function downloadImage(node: HTMLElement, filename: string): Promise<void> {
  const blob = await rasterize(node)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Whether the runtime supports writing an image to the system clipboard.
 * Used to feature-detect Copy image so we don't surface a button that would
 * just throw on older Safari / Firefox.
 */
export function canCopyImage(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.write === 'function' &&
    typeof window !== 'undefined' &&
    typeof window.ClipboardItem !== 'undefined'
  )
}

export async function copyImage(node: HTMLElement): Promise<void> {
  const blob = await rasterize(node)
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
}

export const EXPENSE_TYPE_LABELS = {
  equal: 'split equally',
  shares: 'by shares',
  exact: 'exact amounts',
  mileage: 'by mileage',
  restaurant: 'itemized',
  lodging: 'by nights',
} as const
