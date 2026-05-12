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

function safeFilenameBase(title: string | null): string {
  const raw = title ?? 'expense-summary'
  return raw.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()
}

export function downloadJson(session: Session): void {
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${safeFilenameBase(session.title)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadImage(node: HTMLElement, filename: string): Promise<void> {
  const { toPng } = await import('html-to-image')
  // Wait for any custom fonts to load before rasterizing so the export uses the
  // designed display + mono fonts rather than fallbacks (Georgia, ui-monospace).
  try {
    await document.fonts.ready
  } catch {
    /* ignore — old browsers without document.fonts will fall back to whatever loaded */
  }
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    // Match the receipt's paper color so any antialiased edges blend in.
    backgroundColor: '#f5ecd9',
  })
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export const EXPENSE_TYPE_LABELS = {
  equal: 'split equally',
  shares: 'by shares',
  exact: 'exact amounts',
  mileage: 'by mileage',
  restaurant: 'itemized',
  lodging: 'by nights',
} as const
