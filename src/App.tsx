import { useState } from 'react'
import { Header } from './components/Header'
import { PeoplePanel } from './components/PeoplePanel'
import { ExpensesPanel } from './components/ExpensesPanel'
import { BalancesPanel } from './components/BalancesPanel'
import { SettleUpPanel } from './components/SettleUpPanel'
import { SummaryView } from './components/summary/SummaryView'

export default function App() {
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
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
      {shareOpen && <div onClick={() => setShareOpen(false)}>Share placeholder</div>}
    </div>
  )
}
