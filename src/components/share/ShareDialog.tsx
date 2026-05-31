import { lazy, Suspense, useMemo, useState } from 'react'
import { Dialog, Button, Input } from '../ui'
import { useSession } from '../../store/session'
import { buildShareUrl, encodeSession, URL_HARD_LENGTH, URL_WARN_LENGTH } from '../../lib/url-share'
import type { Session } from '../../types'

// QR code rendering ships ~30kB of unused weight on the initial bundle for any
// user who never opens the Share dialog. Lazy-load it the first time the
// dialog mounts; the Suspense fallback is an unobtrusive placeholder sized to
// match the rendered QR so the layout doesn't jump.
const QRCodeSVG = lazy(() => import('qrcode.react').then((m) => ({ default: m.QRCodeSVG })))

// QR codes top out around 2,953 bytes of data; beyond that they refuse to encode.
// Our share URLs can exceed that for big sessions, so we gate the QR on a safer cap.
const QR_MAX_LENGTH = 2000

export function ShareDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const v = useSession((s) => s.v)
  const sessionId = useSession((s) => s.sessionId)
  const currency = useSession((s) => s.currency)
  const title = useSession((s) => s.title)
  const people = useSession((s) => s.people)
  const expenses = useSession((s) => s.expenses)
  const createdAt = useSession((s) => s.createdAt)
  const session: Session = { v, sessionId, currency, title, people, expenses, createdAt }

  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

  // sessionId is minted by the parent (App.tsx) when the Share button is
  // clicked, so by the time we render here it's already attached to the
  // active session — no in-dialog effect needed and no first-frame stale URL.

  const { url, length } = useMemo(() => {
    const url = buildShareUrl(window.location.href, session)
    return { url, length: encodeSession(session).length }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, sessionId, currency, title, people, expenses, createdAt])

  const tooLong = length > URL_HARD_LENGTH

  function copy() {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopyState('copied')
        setTimeout(() => setCopyState('idle'), 1500)
      })
      .catch(() => {
        setCopyState('error')
        setTimeout(() => setCopyState('idle'), 2500)
      })
  }

  const qrEligible = !tooLong && url.length <= QR_MAX_LENGTH

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
            Session too large to share — split into multiple sessions, or use the JSON download from Summary.
          </p>
        )}
        {!tooLong && length > URL_WARN_LENGTH && (
          <p className="text-xs text-amber-600">
            Long URL — may not render in some chat apps. Use the JSON download from Summary as a fallback.
          </p>
        )}
        {copyState === 'error' && (
          <p className="text-xs text-red-500" role="status">
            Couldn’t copy — select the link above and copy manually
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={copy} disabled={tooLong}>
            {copyState === 'copied' ? 'Copied!' : 'Copy link'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
