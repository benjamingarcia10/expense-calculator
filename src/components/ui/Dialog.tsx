import { AnimatePresence, motion } from 'framer-motion'
import { type ReactNode, useEffect, useId } from 'react'

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
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
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 z-50 w-[min(28rem,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--color-surface)] p-6 shadow-2xl"
          >
            <h2 id={titleId} className="mb-3 text-lg font-semibold">
              {title}
            </h2>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
