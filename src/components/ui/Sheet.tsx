import { AnimatePresence, motion } from 'framer-motion'
import { type ReactNode, useEffect } from 'react'

export function Sheet({
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
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-[var(--color-surface)] p-5 shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[28rem] md:rounded-l-2xl md:rounded-tr-none"
          >
            <h2 className="mb-4 text-lg font-semibold">{title}</h2>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
