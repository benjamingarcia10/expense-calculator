import { useState } from 'react'
import { motion } from 'framer-motion'
import { Toaster } from 'sonner'
import { Header } from './components/Header'
import { PeoplePanel } from './components/PeoplePanel'
import { ExpensesPanel } from './components/ExpensesPanel'
import { BalancesPanel } from './components/BalancesPanel'
import { SettleUpPanel } from './components/SettleUpPanel'
import { SummaryView } from './components/summary/SummaryView'
import { ShareDialog } from './components/share/ShareDialog'
import { OnboardingOverlay } from './components/onboarding/OnboardingOverlay'
import { ImportDialog } from './components/ImportDialog'
import { TitleStrip } from './components/TitleStrip'
import { useUrlImport } from './hooks/useUrlImport'
import { useOnboarding } from './hooks/useOnboarding'

const PANEL_ENTRANCE = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

export default function App() {
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const { pending, accept, reject } = useUrlImport()
  const { view: onboardingView, dismiss: dismissOnboarding, startTour } = useOnboarding()

  return (
    <div className="min-h-dvh text-[var(--color-ink)]">
      {/* Keyboard skip-link — visually hidden until focused, then pinned top-left.
        Lets keyboard users jump past the header chrome straight to the panels. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-[var(--color-accent)] focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Header
        onOpenSummary={() => setSummaryOpen(true)}
        onOpenShare={() => setShareOpen(true)}
        onReplayTour={startTour}
      />
      <main
        id="main"
        className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10 [padding-bottom:max(env(safe-area-inset-bottom),2rem)] [scroll-margin-top:5rem]"
      >
        <TitleStrip />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {/* Mobile (stacked) reorders to match the natural workflow:
            People → Expenses → Balances → Settle Up. Desktop stays as the
            three-column grid + full-width Expenses row (md:order-none resets
            the order so DOM order wins again). */}
          {[
            { key: 'people', node: <PeoplePanel />, className: 'order-1 md:order-none' },
            { key: 'balances', node: <BalancesPanel />, className: 'order-3 md:order-none' },
            { key: 'settle', node: <SettleUpPanel />, className: 'order-4 md:order-none' },
            {
              key: 'expenses',
              node: <ExpensesPanel />,
              className: 'order-2 md:order-none md:col-span-3',
            },
          ].map((panel, i) => (
            <motion.div
              key={panel.key}
              initial={PANEL_ENTRANCE.initial}
              animate={PANEL_ENTRANCE.animate}
              transition={{
                duration: 0.45,
                delay: i * 0.06,
                ease: [0.22, 0.61, 0.36, 1],
              }}
              className={panel.className}
            >
              {panel.node}
            </motion.div>
          ))}
        </div>
      </main>
      <SummaryView open={summaryOpen} onClose={() => setSummaryOpen(false)} />
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} />
      <OnboardingOverlay view={onboardingView} onDismiss={dismissOnboarding} onStartTour={startTour} />
      <Toaster
        position="bottom-center"
        theme="system"
        toastOptions={{
          unstyled: false,
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-border)',
            fontFamily: 'inherit',
          },
          classNames: {
            actionButton:
              '!bg-[var(--color-accent)] !text-white !rounded-md !px-2 !py-1 !text-xs !font-medium',
          },
        }}
      />
      <ImportDialog pending={pending} onAccept={accept} onReject={reject} />
    </div>
  )
}
