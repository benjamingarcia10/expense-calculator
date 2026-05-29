import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { toast } from 'sonner'
import { useUrlImport } from './useUrlImport'
import { useLibrary } from '../store/library'
import { encodeSession } from '../lib/url-share'
import type { Session } from '../types'

function buildSession(overrides: Partial<Session> = {}): Session {
  return {
    v: 1,
    sessionId: null,
    currency: 'USD',
    title: 'Imported',
    people: [{ id: 'p0', name: 'Alice' }],
    expenses: [],
    createdAt: '2026-05-28T00:00:00.000Z',
    ...overrides,
  }
}

function setHash(s: Session) {
  window.location.hash = '#d=' + encodeSession(s)
}

describe('useUrlImport', () => {
  beforeEach(() => {
    localStorage.clear()
    useLibrary.getState().wipeAndSeed()
    history.replaceState(null, '', window.location.pathname + window.location.search)
  })

  it('fresh import creates a new entry and switches to it', () => {
    const incoming = buildSession({ sessionId: '11111111-2222-4333-8444-555555555555' })
    setHash(incoming)
    const before = useLibrary.getState().entries.length
    renderHook(() => useUrlImport())
    expect(useLibrary.getState().entries.length).toBe(before + 1)
    const active = useLibrary.getState().entries.find((e) => e.entryId === useLibrary.getState().activeId)!
    expect(active.session.sessionId).toBe('11111111-2222-4333-8444-555555555555')
    expect(window.location.hash).toBe('')
  })

  it('exact re-import (sessionId match + content match) silently switches and toasts', () => {
    const toastSpy = vi.spyOn(toast, 'success').mockImplementation(() => '')
    const sid = '11111111-2222-4333-8444-555555555555'
    const session = buildSession({ sessionId: sid })
    useLibrary.getState().createEntryFromImport(session)
    const newEntry = useLibrary.getState().createEntry()
    useLibrary.getState().switchEntry(newEntry)
    setHash(session)
    renderHook(() => useUrlImport())
    const state = useLibrary.getState()
    // wipeAndSeed (1) + createEntryFromImport (1) + createEntry (1) = 3; hook doesn't add a new one
    expect(state.entries).toHaveLength(3)
    expect(state.activeId).not.toBe(newEntry) // switched to matching
    expect(toastSpy).toHaveBeenCalledWith(expect.stringMatching(/Already in your library/))
    toastSpy.mockRestore()
  })

  it('content-fingerprint match without sessionId adopts the incoming sessionId', () => {
    const session = buildSession({ sessionId: null })
    useLibrary.getState().createEntryFromImport(session)
    const updated = { ...session, sessionId: '11111111-2222-4333-8444-555555555555' }
    setHash(updated)
    renderHook(() => useUrlImport())
    const matched = useLibrary
      .getState()
      .entries.find((e) => e.session.sessionId === '11111111-2222-4333-8444-555555555555')
    expect(matched).toBeDefined()
  })

  it('sessionId match with diverged content surfaces a pending updated import', () => {
    const sid = '11111111-2222-4333-8444-555555555555'
    useLibrary.getState().createEntryFromImport(buildSession({ sessionId: sid, title: 'Original' }))
    const updated = buildSession({ sessionId: sid, title: 'Updated title' })
    setHash(updated)
    const { result } = renderHook(() => useUrlImport())
    expect(result.current.pending).not.toBeNull()
    expect(result.current.pending?.kind).toBe('updated')
  })

  it('updated import — accept Replace updates the matched entry', () => {
    const sid = '11111111-2222-4333-8444-555555555555'
    const original = buildSession({ sessionId: sid, title: 'Original' })
    const matchedId = useLibrary.getState().createEntryFromImport(original)
    const other = useLibrary.getState().createEntry()
    useLibrary.getState().switchEntry(other)
    setHash(buildSession({ sessionId: sid, title: 'Updated' }))
    const { result } = renderHook(() => useUrlImport())
    act(() => result.current.acceptReplace())
    const matched = useLibrary.getState().entries.find((e) => e.entryId === matchedId)!
    expect(matched.session.title).toBe('Updated')
    expect(useLibrary.getState().activeId).toBe(matchedId)
  })

  it('updated import — accept KeepBoth creates a new entry and switches to it', () => {
    const sid = '11111111-2222-4333-8444-555555555555'
    useLibrary.getState().createEntryFromImport(buildSession({ sessionId: sid, title: 'Original' }))
    // Use a different title so content diverges and the hook surfaces a pending 'updated' import
    setHash(buildSession({ sessionId: sid, title: 'Original — revised' }))
    const { result } = renderHook(() => useUrlImport())
    const before = useLibrary.getState().entries.length
    act(() => result.current.acceptKeepBoth())
    expect(useLibrary.getState().entries.length).toBe(before + 1)
  })
})
