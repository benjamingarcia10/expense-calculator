import { useMemo, useState } from 'react'
import { Dialog, Button, Input } from '../ui'
import { useSession } from '../../store/session'
import { buildShareUrl, encodeSession, URL_WARN_LENGTH } from '../../lib/url-share'
import type { Session } from '../../types'

export function ShareDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const v = useSession((s) => s.v)
  const currency = useSession((s) => s.currency)
  const title = useSession((s) => s.title)
  const people = useSession((s) => s.people)
  const expenses = useSession((s) => s.expenses)
  const createdAt = useSession((s) => s.createdAt)
  const session: Session = { v, currency, title, people, expenses, createdAt }

  const [copied, setCopied] = useState(false)
  const { url, length } = useMemo(() => {
    const url = buildShareUrl(window.location.href, session)
    return { url, length: encodeSession(session).length }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, currency, title, people, expenses, createdAt])

  function copy() {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <Dialog open={open} onClose={onClose} title="Share session">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[--color-muted]">
          Anyone with this link can see the session. Names are the only personal data stored.
        </p>
        <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
        {length > URL_WARN_LENGTH && (
          <p className="text-xs text-amber-600">
            Long URL — may not render in some chat apps. Use the JSON download from Summary as a fallback.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={copy}>{copied ? 'Copied!' : 'Copy link'}</Button>
        </div>
      </div>
    </Dialog>
  )
}
