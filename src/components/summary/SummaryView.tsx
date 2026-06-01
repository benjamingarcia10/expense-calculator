import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Dialog, Button } from '../ui'
import { useSession } from '../../store/session'
import { computeBalances } from '../../lib/compute-balances'
import { simplifyDebts } from '../../lib/simplify-debts'
import { formatMoney, formatDate } from '../../lib/format'
import { canCopyImage, copyImage, downloadImage, EXPENSE_TYPE_LABELS, safeFilenameBase } from './exports'
import { APP_NAME } from '../../lib/branding'
import { expenseTotal } from '../../types'
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
  const currency = useSession((s) => s.currency)
  const title = useSession((s) => s.title)
  const people = useSession((s) => s.people)
  const expenses = useSession((s) => s.expenses)
  const createdAt = useSession((s) => s.createdAt)

  const cardRef = useRef<HTMLDivElement>(null)
  const [feedback, setFeedback] = useState<'idle' | 'copied' | 'saved' | 'error'>('idle')
  // `html-to-image` lazy-loads (~50kB) and rasterizes the receipt — both steps
  // typically take longer than the 300ms perceived-snappiness threshold, so the
  // button shows a working state and disables to prevent double-clicks.
  const [busy, setBusy] = useState<null | 'save' | 'copy'>(null)
  // Hold the feedback-reset timer so back-to-back actions cancel the previous
  // timer instead of leaving it to fire later and clobber the new feedback
  // state (e.g. Copy → Save within 2.5s would otherwise reset "Saved!" early).
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    },
    []
  )
  const scheduleReset = (ms = 2500) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    feedbackTimer.current = setTimeout(() => setFeedback('idle'), ms)
  }
  const supportsCopyImage = canCopyImage()
  const debts = useMemo(() => simplifyDebts(computeBalances(people, expenses)), [people, expenses])
  const totalSpent = expenses.reduce((s, e) => s + expenseTotal(e), 0)
  const c = currency as CurrencyCode
  const displayTitle = title?.trim() || 'Untitled split'
  const serial = makeSerial(createdAt, totalSpent)

  return (
    <Dialog open={open} onClose={onClose} title="Receipt" size="lg">
      <div className="flex flex-col gap-3">
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.42, ease: [0.22, 0.61, 0.36, 1] }}
        >
          {/* Centering lives on the parent (`flex justify-center`) — NOT on
            cardRef via `mx-auto`. html-to-image inlines the cardRef's
            computed styles when it clones; an `mx-auto` element with a
            wide parent resolves to a concrete `margin-left: <Npx>`. That
            inlined margin survives the clone and shifts the card sideways
            inside the SVG-bounded export, producing the empty-left /
            no-right asymmetry. */}
          <div
            ref={cardRef}
            className="receipt-card"
            style={{
              fontFamily: SANS,
              // Fill the dialog up to a 420px design cap so the card never
              // overflows on mobile. (`width: 420px` + `maxWidth: 100%` looks
              // equivalent but isn't — the card sits inside a flex column, and
              // a flex item's `min-width: auto` would have made the wrapper
              // refuse to shrink below the card's 420px content width, so the
              // maxWidth never applied. Width-fills + max-caps avoids it.)
              width: '100%',
              maxWidth: '420px',
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
                  fontSize: 'clamp(20px, 6.4vw, 24px)',
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
                  // clamp() scales the headline number down on narrow viewports
                  // so it doesn't overwhelm the receipt on mobile, while keeping
                  // the desktop receipt at its designed 44px hero size.
                  fontSize: 'clamp(32px, 11vw, 44px)',
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
                split with {APP_NAME}
              </p>
            </footer>
          </div>
        </motion.div>

        {/* Success feedback lives on the triggering button itself (label
          + color flip to green). Only failures get a status line because
          they need an explanation the button alone can't carry. */}
        {feedback === 'error' && (
          <p className="text-xs text-red-500" role="status">
            Couldn’t do that — try the other option
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          {supportsCopyImage && (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy !== null}
              className={feedback === 'copied' ? '!text-emerald-600' : ''}
              onClick={async () => {
                const node = cardRef.current
                if (!node) return
                setBusy('copy')
                try {
                  await copyImage(node)
                  setFeedback('copied')
                } catch {
                  setFeedback('error')
                } finally {
                  setBusy(null)
                  scheduleReset()
                }
              }}
            >
              {busy === 'copy' ? 'Copying…' : feedback === 'copied' ? 'Copied!' : 'Copy image'}
            </Button>
          )}
          <Button
            size="sm"
            disabled={busy !== null}
            className={feedback === 'saved' ? '!bg-emerald-600' : ''}
            onClick={async () => {
              const node = cardRef.current
              if (!node) return
              setBusy('save')
              try {
                await downloadImage(node, `${safeFilenameBase(title)}.png`)
                setFeedback('saved')
              } catch {
                setFeedback('error')
              } finally {
                setBusy(null)
                scheduleReset()
              }
            }}
          >
            {busy === 'save' ? 'Saving…' : feedback === 'saved' ? 'Saved!' : 'Save image'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
