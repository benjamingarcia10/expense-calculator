import { describe, it, expect, beforeEach } from 'vitest'
import { useLibrary } from './library'
import { LIMITS } from '../lib/validation'

describe('useLibrary — entry mutations', () => {
  beforeEach(() => {
    localStorage.clear()
    useLibrary.getState().wipeAndSeed()
  })

  it('starts with one fresh blank entry', () => {
    const s = useLibrary.getState()
    expect(s.entries).toHaveLength(1)
    expect(s.activeId).toBe(s.entries[0]!.entryId)
    expect(s.entries[0]!.session.people).toEqual([])
    expect(s.entries[0]!.session.expenses).toEqual([])
    expect(s.entries[0]!.session.sessionId).toBeNull()
  })

  it('createEntry appends a new blank entry and switches to it', () => {
    const initialId = useLibrary.getState().activeId
    const newId = useLibrary.getState().createEntry()
    const s = useLibrary.getState()
    expect(s.entries).toHaveLength(2)
    expect(s.activeId).toBe(newId)
    expect(s.activeId).not.toBe(initialId)
  })

  it('switchEntry changes the active entry', () => {
    const firstId = useLibrary.getState().activeId
    const secondId = useLibrary.getState().createEntry()
    useLibrary.getState().switchEntry(firstId)
    expect(useLibrary.getState().activeId).toBe(firstId)
    useLibrary.getState().switchEntry(secondId)
    expect(useLibrary.getState().activeId).toBe(secondId)
  })

  it('deleteEntry removes a non-active entry without changing activeId', () => {
    const activeId = useLibrary.getState().activeId
    const otherId = useLibrary.getState().createEntry()
    useLibrary.getState().switchEntry(activeId)
    useLibrary.getState().deleteEntry(otherId)
    expect(useLibrary.getState().entries).toHaveLength(1)
    expect(useLibrary.getState().activeId).toBe(activeId)
  })

  it('deleteEntry on active falls back to most-recently-edited', () => {
    const first = useLibrary.getState().activeId
    const second = useLibrary.getState().createEntry() // becomes active, more recent
    useLibrary.getState().deleteEntry(second)
    expect(useLibrary.getState().activeId).toBe(first)
    expect(useLibrary.getState().entries).toHaveLength(1)
  })

  it('deleteEntry on the last remaining entry seeds a fresh blank', () => {
    const onlyId = useLibrary.getState().activeId
    useLibrary.getState().deleteEntry(onlyId)
    const s = useLibrary.getState()
    expect(s.entries).toHaveLength(1)
    expect(s.entries[0]!.entryId).not.toBe(onlyId)
    expect(s.entries[0]!.session.people).toEqual([])
    expect(s.activeId).toBe(s.entries[0]!.entryId)
  })

  it('wipeAndSeed clears all entries and seeds one blank', () => {
    useLibrary.getState().createEntry()
    useLibrary.getState().createEntry()
    expect(useLibrary.getState().entries).toHaveLength(3)
    useLibrary.getState().wipeAndSeed()
    expect(useLibrary.getState().entries).toHaveLength(1)
    expect(useLibrary.getState().entries[0]!.session.people).toEqual([])
  })
})

describe('useLibrary — active-routed mutations', () => {
  beforeEach(() => {
    localStorage.clear()
    useLibrary.getState().wipeAndSeed()
  })

  function active() {
    const s = useLibrary.getState()
    return s.entries.find((e) => e.entryId === s.activeId)!
  }

  it('addPerson adds to the active entry', () => {
    useLibrary.getState().addPerson('Alice')
    expect(active().session.people.map((p) => p.name)).toEqual(['Alice'])
  })

  it('addPerson respects maxPeople limit', () => {
    for (let i = 0; i < LIMITS.maxPeople + 5; i++) useLibrary.getState().addPerson(`P${i}`)
    expect(active().session.people).toHaveLength(LIMITS.maxPeople)
  })

  it('renamePerson updates the name', () => {
    useLibrary.getState().addPerson('Alice')
    const id = active().session.people[0]!.id
    useLibrary.getState().renamePerson(id, 'Alicia')
    expect(active().session.people[0]!.name).toBe('Alicia')
  })

  it('removePerson removes from active entry only', () => {
    useLibrary.getState().addPerson('Alice')
    useLibrary.getState().addPerson('Bob')
    const id = active().session.people[0]!.id
    useLibrary.getState().removePerson(id)
    expect(active().session.people.map((p) => p.name)).toEqual(['Bob'])
  })

  it('removePerson cascades through expenses (equal split drops the id)', () => {
    useLibrary.getState().addPerson('Alice')
    useLibrary.getState().addPerson('Bob')
    const [a, b] = active().session.people.map((p) => p.id)
    useLibrary.getState().addExpense({
      type: 'equal',
      title: 'Dinner',
      total: 50,
      paidById: a!,
      participantIds: [a!, b!],
    })
    useLibrary.getState().removePerson(a!)
    const exp = active().session.expenses[0]
    expect(exp).toBeUndefined() // payer removed → expense dropped
  })

  it('setCurrency only accepts known codes', () => {
    useLibrary.getState().setCurrency('EUR')
    expect(active().session.currency).toBe('EUR')
    useLibrary.getState().setCurrency('XYZ' as 'USD')
    expect(active().session.currency).toBe('EUR') // unchanged
  })

  it('setTitle stores trimmed title or null when empty', () => {
    useLibrary.getState().setTitle('Berlin trip')
    expect(active().session.title).toBe('Berlin trip')
    useLibrary.getState().setTitle('   ')
    expect(active().session.title).toBeNull()
  })

  it('addExpense returns the new id', () => {
    useLibrary.getState().addPerson('Alice')
    const pid = active().session.people[0]!.id
    const id = useLibrary.getState().addExpense({
      type: 'equal',
      title: 'Coffee',
      total: 5,
      paidById: pid,
      participantIds: [pid],
    })
    expect(id).toMatch(/^e_/)
    expect(active().session.expenses[0]!.id).toBe(id)
  })

  it('removeExpense + restoreExpense round-trips at the original index', () => {
    useLibrary.getState().addPerson('Alice')
    const pid = active().session.people[0]!.id
    const e1 = useLibrary.getState().addExpense({
      type: 'equal',
      title: 'A',
      total: 1,
      paidById: pid,
      participantIds: [pid],
    })
    const e2 = useLibrary.getState().addExpense({
      type: 'equal',
      title: 'B',
      total: 2,
      paidById: pid,
      participantIds: [pid],
    })
    const snapshot = active().session.expenses[0]!
    useLibrary.getState().removeExpense(e1)
    expect(active().session.expenses.map((e) => e.id)).toEqual([e2])
    useLibrary.getState().restoreExpense(snapshot, 0)
    expect(active().session.expenses.map((e) => e.id)).toEqual([e1, e2])
  })

  it('mutations update meta.lastEditedAt', async () => {
    const before = active().meta.lastEditedAt
    await new Promise((r) => setTimeout(r, 5))
    useLibrary.getState().addPerson('Alice')
    expect(active().meta.lastEditedAt > before).toBe(true)
  })

  it('mutations on one entry leave another entry untouched', () => {
    useLibrary.getState().addPerson('Alice')
    const firstActive = useLibrary.getState().activeId
    useLibrary.getState().createEntry() // new entry becomes active
    useLibrary.getState().addPerson('Bob')
    const first = useLibrary.getState().entries.find((e) => e.entryId === firstActive)!
    const second = useLibrary.getState().entries.find((e) => e.entryId !== firstActive)!
    expect(first.session.people.map((p) => p.name)).toEqual(['Alice'])
    expect(second.session.people.map((p) => p.name)).toEqual(['Bob'])
  })
})
