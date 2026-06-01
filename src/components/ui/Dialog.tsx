import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { type ReactNode, useEffect, useId } from 'react'
import { createPortal } from 'react-dom'

export function Dialog({
  open,
  onClose,
  title,
  children,
  size = 'sm',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** sm (default, 28rem) for confirms; lg (34rem) for content-heavy dialogs
   * like the receipt summary where the inner content needs breathing room. */
  size?: 'sm' | 'lg'
}) {
  const titleId = useId()
  const widthClass = size === 'lg' ? 'w-[min(34rem,94vw)]' : 'w-[min(28rem,90vw)]'

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  // Portal to <body> so the dialog escapes any ancestor that establishes a
  // containing block for fixed positioning — sticky headers with
  // `backdrop-filter`, `transform`, `filter`, or `will-change` will otherwise
  // clip `fixed inset-0` to the ancestor instead of the viewport.
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'var(--color-scrim)' }}
            onClick={onClose}
          />
          {/* Flex centers the dialog without transforms so framer-motion's
           * scale animation doesn't clobber positioning translates. */}
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              // Exit ~60% of the enter duration so dismissal feels snappy.
              exit={{
                opacity: 0,
                scale: 0.95,
                transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
              }}
              className={`pointer-events-auto ${widthClass} rounded-2xl bg-[var(--color-surface)] p-6 shadow-2xl`}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2 id={titleId} className="text-lg font-semibold">
                  {title}
                </h2>
                {/* Universal dismiss control. 44pt mobile touch target via
                  size-11; -m-2 pulls the visual back so the title row doesn't
                  feel oversized while the actual clickable box stays large.
                  Confirmation dialogs still keep their explicit Cancel/Keep
                  editing buttons because those are semantically paired with
                  the destructive CTA — the X is a supplementary escape route,
                  not a replacement. */}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="-m-2 grid size-11 shrink-0 place-items-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]/40 hover:text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
