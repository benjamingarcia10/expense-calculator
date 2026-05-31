import { lazy, Suspense, useMemo, useState } from 'react'
import { Mail, Share2, Type } from 'lucide-react'
import { Dialog, Button, Input } from '../ui'
import { useSession } from '../../store/session'
import { buildShareUrl, encodeSession, URL_HARD_LENGTH, URL_WARN_LENGTH } from '../../lib/url-share'
import { buildSummaryText } from '../summary/exports'
import { APP_NAME } from '../../lib/branding'
import type { Session } from '../../types'

// QR code rendering ships ~30kB of unused weight on the initial bundle for any
// user who never opens the Share dialog. Lazy-load it the first time the
// dialog mounts; the Suspense fallback is an unobtrusive placeholder sized to
// match the rendered QR so the layout doesn't jump.
const QRCodeSVG = lazy(() => import('qrcode.react').then((m) => ({ default: m.QRCodeSVG })))

// QR codes top out around 2,953 bytes of data; beyond that they refuse to encode.
// Our share URLs can exceed that for big sessions, so we gate the QR on a safer cap.
const QR_MAX_LENGTH = 2000

// Native Web Share is the headline shortcut on mobile — one tap into Messages /
// WhatsApp / Mail / Slack / anything installed. Hide entirely when unsupported
// (desktop browsers without secure context or older Safari/Firefox).
function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

export function ShareDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const v = useSession((s) => s.v)
  const sessionId = useSession((s) => s.sessionId)
  const currency = useSession((s) => s.currency)
  const title = useSession((s) => s.title)
  const people = useSession((s) => s.people)
  const expenses = useSession((s) => s.expenses)
  const createdAt = useSession((s) => s.createdAt)
  const session: Session = { v, sessionId, currency, title, people, expenses, createdAt }

  const [feedback, setFeedback] = useState<'idle' | 'linkCopied' | 'textCopied' | 'error'>('idle')

  // sessionId is minted by the parent (App.tsx) when the Share button is
  // clicked, so by the time we render here it's already attached to the
  // active session — no in-dialog effect needed and no first-frame stale URL.

  const { url, length } = useMemo(() => {
    const url = buildShareUrl(window.location.href, session)
    return { url, length: encodeSession(session).length }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, sessionId, currency, title, people, expenses, createdAt])

  const tooLong = length > URL_HARD_LENGTH
  const qrEligible = !tooLong && url.length <= QR_MAX_LENGTH
  const supportsShare = canNativeShare()

  function flash(state: typeof feedback, ms = 1500) {
    setFeedback(state)
    setTimeout(() => setFeedback('idle'), ms)
  }

  function copyLink() {
    navigator.clipboard
      .writeText(url)
      .then(() => flash('linkCopied'))
      .catch(() => flash('error', 2500))
  }

  function copyText() {
    navigator.clipboard
      .writeText(`${buildSummaryText(session)}\n\n${url}`)
      .then(() => flash('textCopied', 2200))
      .catch(() => flash('error', 2500))
  }

  function nativeShare() {
    // Wrap text + URL together so the receiving app gets context, not just a
    // mystery link. Most platforms surface the URL as a preview anyway.
    void navigator
      .share({
        title: title?.trim() || `${APP_NAME} — split`,
        text: buildSummaryText(session),
        url,
      })
      .catch((err) => {
        // AbortError = user dismissed the share sheet. No error to surface.
        if (err instanceof Error && err.name !== 'AbortError') flash('error', 2500)
      })
  }

  function emailShare() {
    const subject = title?.trim() ? `${title.trim()} — ${APP_NAME}` : `${APP_NAME} — split`
    const body = `${buildSummaryText(session)}\n\nOpen in ${APP_NAME}:\n${url}\n`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <Dialog open={open} onClose={onClose} title="Share session">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[var(--color-muted)]">
          Anyone with this link can see the session. Names are the only personal data stored.
        </p>
        <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
        {qrEligible ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white p-4">
            <Suspense
              fallback={
                <div
                  className="size-44 animate-pulse rounded bg-[var(--color-border)]/40"
                  aria-label="Loading QR code"
                />
              }
            >
              <QRCodeSVG
                value={url}
                size={176}
                level="M"
                marginSize={0}
                bgColor="#ffffff"
                fgColor="#1a1411"
                aria-label="QR code for this share link"
              />
            </Suspense>
            <p className="text-[10px] tracking-[0.18em] text-[var(--color-muted)] uppercase">Scan to open</p>
          </div>
        ) : (
          <p className="text-xs text-[var(--color-muted)]">
            QR unavailable — link too long for a single code.
          </p>
        )}
        {tooLong && (
          <p className="text-xs text-red-600">
            Session too large to share — split it across multiple sessions.
          </p>
        )}
        {!tooLong && length > URL_WARN_LENGTH && (
          <p className="text-xs text-amber-600">
            Long URL — may not render in some chat apps. Try “Share via…” for the most reliable handoff.
          </p>
        )}
        {feedback === 'linkCopied' && (
          <p className="text-xs text-emerald-600" role="status" aria-live="polite">
            Link copied
          </p>
        )}
        {feedback === 'textCopied' && (
          <p className="text-xs text-emerald-600" role="status" aria-live="polite">
            Summary + link copied — paste it anywhere
          </p>
        )}
        {feedback === 'error' && (
          <p className="text-xs text-red-500" role="status">
            Couldn’t copy — select the link above and copy manually
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {supportsShare && (
            <Button variant="ghost" onClick={nativeShare} disabled={tooLong}>
              <Share2 className="size-3.5" aria-hidden="true" />
              Share via…
            </Button>
          )}
          <Button onClick={copyLink} disabled={tooLong}>
            {feedback === 'linkCopied' ? 'Copied!' : 'Copy link'}
          </Button>
        </div>

        <div className="-mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--color-border)]/60 pt-3 text-xs text-[var(--color-muted)]">
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase">Other ways</span>
          <button
            type="button"
            onClick={copyText}
            disabled={tooLong}
            className="inline-flex items-center gap-1.5 underline-offset-2 transition-colors hover:text-[var(--color-ink)] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Type className="size-3.5" aria-hidden="true" />
            Copy as text
          </button>
          <button
            type="button"
            onClick={emailShare}
            disabled={tooLong}
            className="inline-flex items-center gap-1.5 underline-offset-2 transition-colors hover:text-[var(--color-ink)] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Mail className="size-3.5" aria-hidden="true" />
            Email
          </button>
        </div>
      </div>
    </Dialog>
  )
}
