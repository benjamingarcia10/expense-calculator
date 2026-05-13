import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Dialog, Button } from '../ui'
import { useSession } from '../../store/session'
import { computeBalances } from '../../lib/compute-balances'
import { simplifyDebts } from '../../lib/simplify-debts'
import { formatMoney, formatDate } from '../../lib/format'
import { buildSummaryText, downloadJson, downloadImage, EXPENSE_TYPE_LABELS } from './exports'
import { expenseTotal, type Session } from '../../types'
import type { CurrencyCode } from '../../lib/currencies'

const SANS = "'Inter', system-ui, sans-serif"
const MONO = "'JetBrains Mono', ui-monospace, monospace"
const DISPLAY = "'Fraunces', 'Georgia', serif"

function makeSerial(createdAt: string, total: number): string {
  // A short stable "receipt number" derived from the session — purely cosmetic.
  const date = new Date(createdAt)
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const seed = Math.floor(total * 100)
    .toString(36)
    .toUpperCase()
    .padStart(4, '0')
    .slice(-4)
  return `№ ${ymd}-${seed}`
}

export function SummaryView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const v = useSession((s) => s.v)
  const currency = useSession((s) => s.currency)
  const title = useSession((s) => s.title)
  const people = useSession((s) => s.people)
  const expenses = useSession((s) => s.expenses)
  const createdAt = useSession((s) => s.createdAt)
  const session: Session = { v, currency, title, people, expenses, createdAt }

  const cardRef = useRef<HTMLDivElement>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const debts = useMemo(() => simplifyDebts(computeBalances(people, expenses)), [people, expenses])
  const totalSpent = expenses.reduce((s, e) => s + expenseTotal(e), 0)
  const c = currency as CurrencyCode
  const displayTitle = title?.trim() || 'Split Receipt'
  const serial = makeSerial(createdAt, totalSpent)

  return (
    <Dialog open={open} onClose={onClose} title="Summary" size="lg">
      <div className="flex flex-col gap-3">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.42, ease: [0.22, 0.61, 0.36, 1] }}
          className="mx-auto"
        >
          <div
            ref={cardRef}
            className="receipt-card mx-auto"
            style={{
              fontFamily: SANS,
              // Fixed width + explicit font size so html-to-image rasterizes
              // consistently regardless of the surrounding dialog's sizing.
              width: '420px',
              maxWidth: '100%',
              padding: '32px 28px',
              fontSize: '14px',
              lineHeight: 1.5,
            }}
          >
            {/* Header */}
            <header className="flex flex-col items-center gap-1 text-center">
              <p
                className="receipt-muted text-[10px] tracking-[0.3em] uppercase"
                style={{ fontFamily: MONO }}
              >
                The Split · {formatDate(createdAt)}
              </p>
              <h3
                style={{
                  fontFamily: DISPLAY,
                  fontSize: '24px',
                  lineHeight: 1.25,
                  fontStyle: 'italic',
                  fontWeight: 500,
                  color: '#2a1f17',
                  margin: '4px 0',
                  wordBreak: 'normal',
                }}
              >
                {displayTitle}
              </h3>
              <p
                className="receipt-muted text-[10px] tracking-[0.2em] uppercase"
                style={{ fontFamily: MONO }}
              >
                {serial}
              </p>
            </header>

            <hr className="receipt-rule my-5" />

            {/* Total */}
            <div className="flex flex-col items-center gap-1 text-center">
              <p
                className="receipt-muted text-[10px] tracking-[0.3em] uppercase"
                style={{ fontFamily: MONO }}
              >
                Grand Total
              </p>
              <p
                style={{
                  fontFamily: DISPLAY,
                  fontSize: '44px',
                  lineHeight: 1.05,
                  fontWeight: 600,
                  color: '#2a1f17',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatMoney(totalSpent, c)}
              </p>
              <p className="receipt-muted text-xs">
                across {people.length} {people.length === 1 ? 'person' : 'people'} · {expenses.length}{' '}
                {expenses.length === 1 ? 'expense' : 'expenses'}
              </p>
            </div>

            <hr className="receipt-rule my-5" />

            {/* Settle up */}
            <section>
              <h4
                className="receipt-muted mb-3 text-center text-[10px] tracking-[0.3em] uppercase"
                style={{ fontFamily: MONO }}
              >
                — Settle Up —
              </h4>
              {debts.length === 0 ? (
                <p style={{ fontFamily: DISPLAY }} className="receipt-ink text-center text-lg italic">
                  Everyone’s square.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {debts.map((d) => (
                    <li
                      key={`${d.fromMemberId}-${d.toMemberId}`}
                      className="receipt-ink flex items-baseline gap-2 text-sm"
                    >
                      <span className="font-medium">{d.fromName}</span>
                      <span className="receipt-muted" style={{ fontFamily: MONO }} aria-hidden="true">
                        →
                      </span>
                      <span className="font-medium">{d.toName}</span>
                      <span
                        className="receipt-leaders mx-1 flex-1"
                        aria-hidden="true"
                        style={{ height: '1em' }}
                      />
                      <span style={{ fontFamily: MONO }} className="font-semibold tabular-nums">
                        {formatMoney(d.amount, c)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {expenses.length > 0 && (
              <>
                <hr className="receipt-rule my-5" />
                <section>
                  <h4
                    className="receipt-muted mb-3 text-center text-[10px] tracking-[0.3em] uppercase"
                    style={{ fontFamily: MONO }}
                  >
                    — Itemized —
                  </h4>
                  <ul className="flex flex-col gap-2 text-sm">
                    {expenses.map((e) => {
                      const payer = people.find((p) => p.id === e.paidById)?.name ?? '?'
                      return (
                        <li key={e.id} className="receipt-ink flex flex-col gap-0.5">
                          <div className="flex items-baseline gap-2">
                            <span className="font-medium">{e.title}</span>
                            <span
                              className="receipt-leaders mx-1 flex-1"
                              aria-hidden="true"
                              style={{ height: '1em' }}
                            />
                            <span style={{ fontFamily: MONO }} className="tabular-nums">
                              {formatMoney(expenseTotal(e), c)}
                            </span>
                          </div>
                          <span
                            className="receipt-muted text-[10px] tracking-wide uppercase"
                            style={{ fontFamily: MONO }}
                          >
                            {payer} · {EXPENSE_TYPE_LABELS[e.type]}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              </>
            )}

            <hr className="receipt-rule my-5" />

            <footer className="flex flex-col items-center gap-1 text-center">
              <p
                style={{ fontFamily: DISPLAY, lineHeight: 1.2 }}
                className="receipt-ink text-sm whitespace-nowrap italic"
              >
                thanks, come again
              </p>
              <p className="receipt-muted text-[9px] tracking-[0.2em] uppercase" style={{ fontFamily: MONO }}>
                split with expensecalc
              </p>
            </footer>
          </div>
        </motion.div>

        {copyState !== 'idle' && (
          <p
            className={`text-xs ${copyState === 'copied' ? 'text-emerald-600' : 'text-red-500'}`}
            role="status"
          >
            {copyState === 'copied' ? 'Copied to clipboard' : 'Couldn’t copy — select and copy manually'}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(buildSummaryText(session))
                setCopyState('copied')
              } catch {
                setCopyState('error')
              }
              setTimeout(() => setCopyState('idle'), 2000)
            }}
          >
            Copy as Text
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              const node = cardRef.current
              if (!node) return
              try {
                await downloadImage(
                  node,
                  `${(title ?? 'expense-summary').replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}.png`
                )
              } catch {
                setCopyState('error')
                setTimeout(() => setCopyState('idle'), 2500)
              }
            }}
          >
            Download Image
          </Button>
          <Button size="sm" variant="ghost" onClick={() => downloadJson(session)}>
            Download JSON
          </Button>
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
