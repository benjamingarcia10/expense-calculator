import { describe, it, expect } from 'vitest'
import { entryDisplayTitle, entryHasGivenTitle, relativeTime } from './entry-display'
import type { LibraryEntry } from '../types'

function entry(
  over: Partial<LibraryEntry['session']> = {},
  meta: Partial<LibraryEntry['meta']> = {}
): LibraryEntry {
  return {
    entryId: 's_test',
    session: {
      v: 1,
      sessionId: null,
      currency: 'USD',
      title: null,
      people: [],
      expenses: [],
      createdAt: '2026-05-28T00:00:00.000Z',
      ...over,
    },
    meta: { lastEditedAt: '2026-05-28T00:00:00.000Z', ...meta },
  }
}

describe('entryDisplayTitle', () => {
  it('uses the title when set', () => {
    expect(entryDisplayTitle(entry({ title: 'Berlin May' }))).toBe('Berlin May')
  })

  it('trims whitespace-only titles', () => {
    expect(entryDisplayTitle(entry({ title: '   ' }))).toBe('Untitled split')
  })

  it('uses a single person name as "X\'s split"', () => {
    expect(entryDisplayTitle(entry({ people: [{ id: 'p1', name: 'Alice' }] }))).toBe("Alice's split")
  })

  it('joins two people with an ampersand', () => {
    expect(
      entryDisplayTitle(
        entry({
          people: [
            { id: 'p1', name: 'Alice' },
            { id: 'p2', name: 'Bob' },
          ],
        })
      )
    ).toBe('Alice & Bob')
  })

  it('summarizes three or more with +N', () => {
    expect(
      entryDisplayTitle(
        entry({
          people: [
            { id: 'p1', name: 'Alice' },
            { id: 'p2', name: 'Bob' },
            { id: 'p3', name: 'Carol' },
            { id: 'p4', name: 'Dave' },
          ],
        })
      )
    ).toBe('Alice, Bob +2')
  })

  it('falls back to "Untitled split" with no signal', () => {
    expect(entryDisplayTitle(entry())).toBe('Untitled split')
  })
})

describe('entryHasGivenTitle', () => {
  it('false when title is null', () => {
    expect(entryHasGivenTitle(entry())).toBe(false)
  })
  it('true when title is set', () => {
    expect(entryHasGivenTitle(entry({ title: 'Berlin' }))).toBe(true)
  })
})

describe('relativeTime', () => {
  const now = new Date('2026-05-28T12:00:00.000Z')

  it('formats just now for sub-minute differences', () => {
    expect(relativeTime('2026-05-28T11:59:30.000Z', now)).toBe('just now')
  })

  it('formats minutes', () => {
    expect(relativeTime('2026-05-28T11:40:00.000Z', now)).toBe('20m ago')
  })

  it('formats hours', () => {
    expect(relativeTime('2026-05-28T09:00:00.000Z', now)).toBe('3h ago')
  })

  it('formats yesterday', () => {
    expect(relativeTime('2026-05-27T11:00:00.000Z', now)).toBe('yesterday')
  })

  it('formats older than a week as a short date', () => {
    expect(relativeTime('2026-04-10T12:00:00.000Z', now)).toMatch(/Apr.*10/)
  })
})
