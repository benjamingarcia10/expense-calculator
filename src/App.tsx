import { useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from './components/Header'
import { PeoplePanel } from './components/PeoplePanel'
import { ExpensesPanel } from './components/ExpensesPanel'
import { BalancesPanel } from './components/BalancesPanel'
import { SettleUpPanel } from './components/SettleUpPanel'
import { SummaryView } from './components/summary/SummaryView'
import { ShareDialog } from './components/share/ShareDialog'
import { useUrlImport } from './hooks/useUrlImport'
import { Dialog, Button } from './components/ui'

const PANEL_ENTRANCE = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

export default function App() {
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const { pending, accept, reject } = useUrlImport()

  return (
    <div className="min-h-dvh text-[var(--color-ink)]">
      <Header onOpenSummary={() => setSummaryOpen(true)} onOpenShare={() => setShareOpen(true)} />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {[
            <PeoplePanel key="people" />,
            <BalancesPanel key="balances" />,
            <SettleUpPanel key="settle" />,
            <ExpensesPanel key="expenses" />,
          ].map((node, i) => (
            <motion.div
              key={node.key}
              initial={PANEL_ENTRANCE.initial}
              animate={PANEL_ENTRANCE.animate}
              transition={{
                duration: 0.45,
                delay: i * 0.06,
                ease: [0.22, 0.61, 0.36, 1],
              }}
              className={i === 3 ? 'md:col-span-3' : ''}
            >
              {node}
            </motion.div>
          ))}
        </div>
      </main>
      <SummaryView open={summaryOpen} onClose={() => setSummaryOpen(false)} />
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} />
      <Dialog open={pending !== null} onClose={reject} title="Import shared session?">
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            {pending?.kind === 'overwrite'
              ? 'You have an existing session. Importing this link will replace it. Your current session will be saved as a backup.'
              : 'Load the shared session?'}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={reject}>
              Keep current
            </Button>
            <Button onClick={accept}>Import</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
