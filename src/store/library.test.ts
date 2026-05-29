import { describe, it, expect, beforeEach } from 'vitest'
import { useLibrary } from './library'

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
