import { describe, it, expect, beforeEach } from 'vitest'
import { useSession, resetSession } from './session'

describe('session store', () => {
  beforeEach(() => {
    localStorage.clear()
    resetSession()
  })

  it('starts with empty people and expenses', () => {
    const s = useSession.getState()
    expect(s.people).toEqual([])
    expect(s.expenses).toEqual([])
  })

  it('adds people', () => {
    useSession.getState().addPerson('Alice')
    expect(useSession.getState().people).toHaveLength(1)
    expect(useSession.getState().people[0]?.name).toBe('Alice')
  })

  it('removes person and cleans up references in equal expense', () => {
    useSession.getState().addPerson('Alice')
    useSession.getState().addPerson('Bob')
    const ids = useSession.getState().people.map((p) => p.id)
    useSession.getState().addExpense({
      type: 'equal',
      title: 'Dinner',
      total: 50,
      paidById: ids[0]!,
      participantIds: ids,
    })
    useSession.getState().removePerson(ids[1]!)
    const exp = useSession.getState().expenses[0]
    expect(exp?.type).toBe('equal')
    if (exp && exp.type === 'equal') {
      expect(exp.participantIds).not.toContain(ids[1])
    }
  })

  it('rejects over-limit name length', () => {
    const long = 'a'.repeat(100)
    useSession.getState().addPerson(long)
    expect(useSession.getState().people[0]?.name.length).toBe(30)
  })

  it('removes person who paid for equal expense', () => {
    useSession.getState().addPerson('Alice')
    useSession.getState().addPerson('Bob')
    const ids = useSession.getState().people.map((p) => p.id)
    useSession.getState().addExpense({
      type: 'equal',
      title: 'Dinner',
      total: 50,
      paidById: ids[0]!,
      participantIds: ids,
    })
    useSession.getState().removePerson(ids[0]!)
    expect(useSession.getState().expenses).toHaveLength(0)
  })

  it('cleans up shares expense when person is removed', () => {
    useSession.getState().addPerson('Alice')
    useSession.getState().addPerson('Bob')
    const ids = useSession.getState().people.map((p) => p.id)
    useSession.getState().addExpense({
      type: 'shares',
      title: 'Dinner',
      total: 50,
      paidById: ids[0]!,
      shares: { [ids[0]!]: 1, [ids[1]!]: 2 },
    })
    useSession.getState().removePerson(ids[1]!)
    const exp = useSession.getState().expenses[0]
    expect(exp?.type).toBe('shares')
    if (exp && exp.type === 'shares') {
      expect(exp.shares[ids[1]!]).toBeUndefined()
      expect(exp.shares[ids[0]!]).toBe(1)
    }
  })

  it('cleans up exact expense when person is removed', () => {
    useSession.getState().addPerson('Alice')
    useSession.getState().addPerson('Bob')
    const ids = useSession.getState().people.map((p) => p.id)
    useSession.getState().addExpense({
      type: 'exact',
      title: 'Dinner',
      total: 50,
      paidById: ids[0]!,
      amounts: { [ids[0]!]: 30, [ids[1]!]: 20 },
    })
    useSession.getState().removePerson(ids[1]!)
    const exp = useSession.getState().expenses[0]
    expect(exp?.type).toBe('exact')
    if (exp && exp.type === 'exact') {
      expect(exp.amounts[ids[1]!]).toBeUndefined()
      expect(exp.amounts[ids[0]!]).toBe(30)
    }
  })

  it('cleans up mileage expense when person is removed', () => {
    useSession.getState().addPerson('Alice')
    useSession.getState().addPerson('Bob')
    const ids = useSession.getState().people.map((p) => p.id)
    useSession.getState().addExpense({
      type: 'mileage',
      title: 'Gas',
      total: 50,
      paidById: ids[0]!,
      unitLabel: 'mi',
      units: { [ids[0]!]: 100, [ids[1]!]: 50 },
    })
    useSession.getState().removePerson(ids[1]!)
    const exp = useSession.getState().expenses[0]
    expect(exp?.type).toBe('mileage')
    if (exp && exp.type === 'mileage') {
      expect(exp.units[ids[1]!]).toBeUndefined()
      expect(exp.units[ids[0]!]).toBe(100)
    }
  })

  it('cleans up restaurant expense when person is removed', () => {
    useSession.getState().addPerson('Alice')
    useSession.getState().addPerson('Bob')
    const ids = useSession.getState().people.map((p) => p.id)
    useSession.getState().addExpense({
      type: 'restaurant',
      title: 'Dinner',
      paidById: ids[0]!,
      items: [{ id: 'i1', name: 'Pizza', price: 30, assignedIds: [ids[0]!, ids[1]!] }],
      tax: 3,
      tip: 7,
      serviceFee: 0,
    })
    useSession.getState().removePerson(ids[1]!)
    const exp = useSession.getState().expenses[0]
    expect(exp?.type).toBe('restaurant')
    if (exp && exp.type === 'restaurant') {
      expect(exp.items[0]?.assignedIds).toEqual([ids[0]!])
    }
  })

  it('cleans up lodging expense when person is removed', () => {
    useSession.getState().addPerson('Alice')
    useSession.getState().addPerson('Bob')
    const ids = useSession.getState().people.map((p) => p.id)
    useSession.getState().addExpense({
      type: 'lodging',
      title: 'Hotel',
      total: 200,
      paidById: ids[0]!,
      mode: 'simple',
      nights: { [ids[0]!]: 2, [ids[1]!]: 1 },
      assignments: { [ids[0]!]: 'r1', [ids[1]!]: 'r1' },
    })
    useSession.getState().removePerson(ids[1]!)
    const exp = useSession.getState().expenses[0]
    expect(exp?.type).toBe('lodging')
    if (exp && exp.type === 'lodging') {
      expect(exp.nights[ids[1]!]).toBeUndefined()
      expect(exp.nights[ids[0]!]).toBe(2)
      expect(exp.assignments?.[ids[1]!]).toBeUndefined()
      expect(exp.assignments?.[ids[0]!]).toBe('r1')
    }
  })

  it('renames person', () => {
    useSession.getState().addPerson('Alice')
    const id = useSession.getState().people[0]!.id
    useSession.getState().renamePerson(id, 'Alicia')
    expect(useSession.getState().people[0]?.name).toBe('Alicia')
  })

  it('sets currency', () => {
    useSession.getState().setCurrency('EUR')
    expect(useSession.getState().currency).toBe('EUR')
  })

  it('sets session title', () => {
    useSession.getState().setTitle('Tahoe Trip')
    expect(useSession.getState().title).toBe('Tahoe Trip')
  })

  it('sets session title to null if empty string', () => {
    useSession.getState().setTitle('Tahoe Trip')
    useSession.getState().setTitle('')
    expect(useSession.getState().title).toBeNull()
  })

  it('adds expense and returns id', () => {
    useSession.getState().addPerson('Alice')
    const id = useSession.getState().people[0]!.id
    const expenseId = useSession.getState().addExpense({
      type: 'equal',
      title: 'Dinner',
      total: 50,
      paidById: id,
      participantIds: [id],
    })
    expect(expenseId).toBeTruthy()
    expect(useSession.getState().expenses).toHaveLength(1)
    expect(useSession.getState().expenses[0]?.id).toBe(expenseId)
  })

  it('updates expense', () => {
    useSession.getState().addPerson('Alice')
    const id = useSession.getState().people[0]!.id
    const expenseId = useSession.getState().addExpense({
      type: 'equal',
      title: 'Dinner',
      total: 50,
      paidById: id,
      participantIds: [id],
    })
    useSession.getState().updateExpense(expenseId, { title: 'Lunch' })
    expect(useSession.getState().expenses[0]?.title).toBe('Lunch')
  })

  it('removes expense', () => {
    useSession.getState().addPerson('Alice')
    const id = useSession.getState().people[0]!.id
    const expenseId = useSession.getState().addExpense({
      type: 'equal',
      title: 'Dinner',
      total: 50,
      paidById: id,
      participantIds: [id],
    })
    useSession.getState().removeExpense(expenseId)
    expect(useSession.getState().expenses).toHaveLength(0)
  })

  it('replaces entire session', () => {
    useSession.getState().addPerson('Alice')
    const newSession = {
      v: 1,
      currency: 'EUR',
      title: 'New Trip',
      people: [],
      expenses: [],
      createdAt: new Date().toISOString(),
    }
    useSession.getState().replaceSession(newSession)
    const state = useSession.getState()
    expect(state.people).toHaveLength(0)
    expect(state.currency).toBe('EUR')
    expect(state.title).toBe('New Trip')
  })

  it('resets to fresh state', () => {
    useSession.getState().addPerson('Alice')
    useSession.getState().setCurrency('EUR')
    useSession.getState().setTitle('Trip')
    useSession.getState().reset()
    const s = useSession.getState()
    expect(s.people).toHaveLength(0)
    expect(s.expenses).toHaveLength(0)
    expect(s.currency).toBe('USD')
    expect(s.title).toBeNull()
  })
})
