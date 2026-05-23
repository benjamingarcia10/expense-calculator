import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion'
import { X } from 'lucide-react'
import { type ReactNode, useEffect, useId } from 'react'
import { createPortal } from 'react-dom'

const SWIPE_DISMISS_THRESHOLD = 120
const SWIPE_DISMISS_VELOCITY = 500

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
  const titleId = useId()
  const dragControls = useDragControls()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function handleDragEnd(_: unknown, info: PanInfo) {
    // Mobile swipe-down-to-dismiss: either a meaningful displacement or a quick
    // downward flick dismisses, mirroring the iOS bottom-sheet feel.
    if (info.offset.y > SWIPE_DISMISS_THRESHOLD || info.velocity.y > SWIPE_DISMISS_VELOCITY) {
      onClose()
    }
  }

  if (typeof document === 'undefined') return null

  // Portal to <body> so `fixed` positioning resolves against the viewport
  // regardless of any ancestor's backdrop-filter / transform / filter, which
  // would otherwise establish a new containing block and clip the sheet.
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 backdrop-blur-sm"
            style={{ background: 'var(--color-scrim)' }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            // Exit is intentionally faster than enter (~65%) so dismissal feels
            // responsive — Material's motion guideline for transient surfaces.
            exit={{ y: '100%', transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            // Mobile: near-full-height (92dvh) so complex forms have room.
            // Desktop: right-anchored drawer at fixed width.
            className="fixed inset-x-0 bottom-0 z-50 flex h-[92dvh] flex-col rounded-t-2xl border-t border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl md:inset-y-0 md:right-0 md:left-auto md:h-auto md:w-[28rem] md:rounded-l-2xl md:rounded-tr-none md:border-t-0 md:border-l"
            // Drag is gated through `dragControls` so it only fires when the
            // grabber initiates it — not from any pointerdown on the sheet body.
            // That keeps form fields, scroll, and selection conflict-free.
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
          >
            {/* Grabber — also the drag handle. Visible only on mobile; on
              desktop the sheet is a right-drawer and a downward drag wouldn't
              match the axis anyway. */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="cursor-grab touch-none pt-2 pb-1 active:cursor-grabbing md:hidden"
              aria-hidden="true"
            >
              <div className="mx-auto h-1 w-10 rounded-full bg-[var(--color-rule)]" />
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-3.5">
              <h2 id={titleId} className="h-display text-xl text-[var(--color-ink)] sm:text-2xl">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-11 place-items-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]/40 hover:text-[var(--color-ink)] sm:size-9"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 [padding-bottom:max(env(safe-area-inset-bottom),1rem)]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
