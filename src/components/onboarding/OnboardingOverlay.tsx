import { type ComponentType, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, Handshake, Receipt as ReceiptIcon, Sparkles, Users } from 'lucide-react'
import { useSession } from '../../store/session'
import { useLibrary } from '../../store/library'
import { APP_NAME } from '../../lib/branding'
import { Button } from '../ui'
import { SessionSummaryCard } from '../SessionSummaryCard'
import type { OnboardingView } from '../../hooks/useOnboarding'

const EASE = [0.22, 0.61, 0.36, 1] as const

type ArtProps = { reduce: boolean }

// ── Step illustrations ─────────────────────────────────────────────────────
// Lightweight mock UI built from the app's own tokens — never real store data.
// Each remounts when its step becomes active, replaying its entrance animation.

function WelcomeArt({ reduce }: ArtProps) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12, rotate: -4 }}
      animate={{ opacity: 1, y: 0, rotate: -4 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="relative w-32 rounded-md px-3 py-3 shadow-lg"
      style={{ background: '#f5ecd9', color: '#2a1f17' }}
    >
      <div
        className="text-center text-[11px] font-semibold italic"
        style={{ fontFamily: "'Fraunces', serif" }}
      >
        The Split
      </div>
      <div className="my-2 border-t border-dashed" style={{ borderColor: '#b8a890' }} />
      {[78, 92, 60].map((w, i) => (
        <div
          key={i}
          className="mb-1.5 h-1.5 rounded-full"
          style={{ width: `${w}%`, background: '#d8c9ad' }}
        />
      ))}
      <div className="my-2 border-t border-dashed" style={{ borderColor: '#b8a890' }} />
      <div className="flex justify-between text-[10px] font-semibold">
        <span>Total</span>
        <span>$1,069</span>
      </div>
      <motion.div
        initial={reduce ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: reduce ? 0 : 0.45, type: 'spring', stiffness: 380, damping: 18 }}
        className="absolute -right-3 -bottom-3 grid size-9 place-items-center rounded-full bg-[var(--color-accent)] text-white shadow-md"
      >
        <Check className="size-5" />
      </motion.div>
    </motion.div>
  )
}

function PeopleArt({ reduce }: ArtProps) {
  const names = ['Alex', 'Sam', 'Jordan']
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-8 w-44 items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs text-[var(--color-muted)]">
        Add a name…
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {names.map((n, i) => (
          <motion.span
            key={n}
            initial={reduce ? false : { opacity: 0, scale: 0.6, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              delay: reduce ? 0 : 0.28 + i * 0.16,
              type: 'spring',
              stiffness: 420,
              damping: 22,
            }}
            className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--color-ink)]"
          >
            {n}
          </motion.span>
        ))}
      </div>
    </div>
  )
}

function ExpenseArt({ reduce }: ArtProps) {
  const rows = [
    { title: 'Beach house', tag: 'LODGING', amount: '$840.00' },
    { title: 'Group dinner', tag: 'ITEMIZED', amount: '$172.40' },
  ]
  return (
    <div className="flex w-60 flex-col gap-1.5">
      {rows.map((r, i) => (
        <motion.div
          key={r.title}
          initial={reduce ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: reduce ? 0 : 0.2 + i * 0.2, duration: 0.4, ease: EASE }}
          className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
        >
          <span className="truncate text-xs font-medium">{r.title}</span>
          <span className="tag shrink-0">{r.tag}</span>
          <span className="ml-auto font-mono text-xs tabular-nums">{r.amount}</span>
        </motion.div>
      ))}
    </div>
  )
}

function SettleArt({ reduce }: ArtProps) {
  const rows = [
    { from: 'Sam', to: 'Alex', amount: '$84.20' },
    { from: 'Jordan', to: 'Alex', amount: '$57.60' },
  ]
  return (
    <div className="flex w-60 flex-col gap-2">
      {rows.map((r, i) => (
        <motion.div
          key={r.from}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.2 + i * 0.2, duration: 0.4, ease: EASE }}
          className="flex items-center gap-2 text-xs"
        >
          <span className="font-medium">{r.from}</span>
          <ArrowRight className="size-3 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
          <span className="font-medium">{r.to}</span>
          <span className="leaders mx-1 flex-1" aria-hidden="true" style={{ height: '1em' }} />
          <span className="font-mono font-semibold tabular-nums">{r.amount}</span>
        </motion.div>
      ))}
    </div>
  )
}

type TourStep = {
  id: string
  Icon: ComponentType<{ className?: string }>
  title: string
  body: string
  Art: ComponentType<ArtProps>
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    Icon: Sparkles,
    title: `Welcome to ${APP_NAME}`,
    body: 'Split a bill, a trip, or a shared house — and get the simplest way for everyone to settle up. No account, and nothing leaves your browser.',
    Art: WelcomeArt,
  },
  {
    id: 'people',
    Icon: Users,
    title: 'Start with the people',
    body: "Add everyone who's splitting the costs. You can rename or remove them whenever the group changes.",
    Art: PeopleArt,
  },
  {
    id: 'expenses',
    Icon: ReceiptIcon,
    title: 'Log what was spent',
    body: 'Add each expense and choose how it splits — evenly, by shares or exact amounts, itemized for restaurants, by nights for lodging, or by distance.',
    Art: ExpenseArt,
  },
  {
    id: 'settle',
    Icon: Handshake,
    title: 'Settle up, then share',
    body: `${APP_NAME} nets it all down to the fewest payments. Share the result as a link or QR code, or save it as a receipt image.`,
    Art: SettleArt,
  },
]

// ── Tour carousel ──────────────────────────────────────────────────────────

function TourCard({ onDismiss }: { onDismiss: () => void }) {
  const reduce = !!useReducedMotion()
  const [index, setIndex] = useState(0)
  const nextRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const step = TOUR_STEPS[index]
  const isLast = index === TOUR_STEPS.length - 1

  useEffect(() => {
    nextRef.current?.focus()
  }, [])

  function next() {
    if (isLast) onDismiss()
    else setIndex((i) => i + 1)
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="tag">
          Quick tour · {index + 1}/{TOUR_STEPS.length}
        </span>
        <button
          onClick={onDismiss}
          className="-mx-2 -my-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 py-2 text-xs font-medium text-[var(--color-muted)] transition-colors hover:bg-[var(--color-border)]/50 hover:text-[var(--color-ink)] sm:min-h-0 sm:min-w-0"
        >
          Skip
        </button>
      </div>

      <div className="grid h-44 place-items-center overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/60">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <step.Art reduce={reduce} />
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={reduce ? false : { opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -14 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="flex flex-col gap-1.5"
        >
          <div className="flex items-center gap-2">
            <step.Icon className="size-4 text-[var(--color-accent)]" />
            <h2 id={titleId} className="h-display text-xl text-[var(--color-ink)]">
              {step.title}
            </h2>
          </div>
          <p className="text-sm text-[var(--color-muted)]">{step.body}</p>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5" aria-hidden="true">
          {TOUR_STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === index ? 'w-5 bg-[var(--color-accent)]' : 'w-1.5 bg-[var(--color-border)]'
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          {index > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setIndex((i) => Math.max(0, i - 1))}>
              Back
            </Button>
          )}
          <Button ref={nextRef} size="sm" onClick={next}>
            {isLast ? 'Get started' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Welcome-back card ──────────────────────────────────────────────────────

function WelcomeBackCard({ onDismiss, onStartTour }: { onDismiss: () => void; onStartTour: () => void }) {
  const createEntry = useLibrary((s) => s.createEntry)
  const title = useSession((s) => s.title)
  const people = useSession((s) => s.people)
  const expenses = useSession((s) => s.expenses)
  const currency = useSession((s) => s.currency)
  const createdAt = useSession((s) => s.createdAt)
  const continueRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  useEffect(() => {
    continueRef.current?.focus()
  }, [])

  function startFresh() {
    // Preserve the existing session in the library — start on a new blank entry
    // instead of wiping. The user can return to the old data via the switcher.
    createEntry()
    onDismiss()
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="tag">Saved on this device</span>
        <h2 id={titleId} className="h-display text-2xl text-[var(--color-ink)]">
          Welcome back
        </h2>
      </div>
      <p className="text-sm text-[var(--color-muted)]">
        You have a split in progress. Pick up where you left off, or clear it and start something new.
      </p>

      <SessionSummaryCard session={{ currency, title, people, expenses, createdAt }} />

      <div className="flex flex-col gap-3">
        <p className="text-xs text-[var(--color-muted)]">
          Starting a new split keeps this one saved in your library — you can switch back from the title bar
          at any time.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={startFresh}>
            Start a new split
          </Button>
          <Button ref={continueRef} onClick={onDismiss}>
            Continue this one
          </Button>
        </div>
        <button
          onClick={onStartTour}
          className="self-center text-xs text-[var(--color-muted)] underline underline-offset-2 transition-colors hover:text-[var(--color-ink)]"
        >
          New to {APP_NAME}? Take the quick tour
        </button>
      </div>
    </div>
  )
}

// ── Overlay shell ──────────────────────────────────────────────────────────

export function OnboardingOverlay({
  view,
  onDismiss,
  onStartTour,
}: {
  view: OnboardingView
  onDismiss: () => void
  onStartTour: () => void
}) {
  const reduce = !!useReducedMotion()

  useEffect(() => {
    if (view === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [view, onDismiss])

  if (typeof document === 'undefined') return null

  // Portal to <body> so the overlay escapes the sticky header's
  // `backdrop-filter` containing block (see Dialog for the same reasoning).
  return createPortal(
    <AnimatePresence>
      {view !== null && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'var(--color-scrim)' }}
            onClick={onDismiss}
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              // Exit ~65% of enter duration for a responsive dismiss.
              exit={
                reduce
                  ? { opacity: 0, transition: { duration: 0.12 } }
                  : { opacity: 0, scale: 0.96, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }
              }
              transition={{ duration: 0.28, ease: EASE }}
              className="pointer-events-auto max-h-[90vh] w-[min(30rem,94vw)] overflow-y-auto rounded-2xl bg-[var(--color-surface)] p-6 shadow-2xl"
            >
              {view === 'tour' ? (
                <TourCard onDismiss={onDismiss} />
              ) : (
                <WelcomeBackCard onDismiss={onDismiss} onStartTour={onStartTour} />
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
