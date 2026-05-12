import { useState } from 'react'
import { Header } from './components/Header'
import { PeoplePanel } from './components/PeoplePanel'
import { ExpensesPanel } from './components/ExpensesPanel'

export default function App() {
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  return (
    <div className="min-h-dvh bg-[--color-bg] text-[--color-ink]">
      <Header onOpenSummary={() => setSummaryOpen(true)} onOpenShare={() => setShareOpen(true)} />
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PeoplePanel />
          <section className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-4">
            Balances (placeholder)
          </section>
          <section className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-4">
            Settle Up (placeholder)
          </section>
          <ExpensesPanel />
        </div>
      </main>
      {summaryOpen && <div onClick={() => setSummaryOpen(false)}>Summary placeholder</div>}
      {shareOpen && <div onClick={() => setShareOpen(false)}>Share placeholder</div>}
    </div>
  )
}
