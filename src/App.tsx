import { useState } from 'react'
import { Header } from './components/Header'
import { PeoplePanel } from './components/PeoplePanel'
import { ExpensesPanel } from './components/ExpensesPanel'
import { BalancesPanel } from './components/BalancesPanel'
import { SettleUpPanel } from './components/SettleUpPanel'
import { SummaryView } from './components/summary/SummaryView'
import { ShareDialog } from './components/share/ShareDialog'
import { useUrlImport } from './hooks/useUrlImport'
import { Dialog, Button } from './components/ui'

export default function App() {
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const { pending, accept, reject } = useUrlImport()

  return (
    <div className="min-h-dvh bg-[--color-bg] text-[--color-ink]">
      <Header onOpenSummary={() => setSummaryOpen(true)} onOpenShare={() => setShareOpen(true)} />
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PeoplePanel />
          <BalancesPanel />
          <SettleUpPanel />
          <ExpensesPanel />
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
