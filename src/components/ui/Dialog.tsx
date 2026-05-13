import { AnimatePresence, motion } from 'framer-motion'
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
              exit={{ opacity: 0, scale: 0.95 }}
              className={`pointer-events-auto ${widthClass} rounded-2xl bg-[var(--color-surface)] p-6 shadow-2xl`}
            >
              <h2 id={titleId} className="mb-3 text-lg font-semibold">
                {title}
              </h2>
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
