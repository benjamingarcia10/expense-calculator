import { describe, it, expect } from 'vitest'
import { computeExpenseBreakdown } from './expense-breakdown'
import type { Expense, Person } from '../types'

const alice: Person = { id: 'a', name: 'Alice' }
const bob: Person = { id: 'b', name: 'Bob' }
const carol: Person = { id: 'c', name: 'Carol' }
const people = [alice, bob, carol]

describe('computeExpenseBreakdown — equal', () => {
  it('returns equal lines summing to total', () => {
    const expense: Expense = {
      id: 'e1',
      type: 'equal',
      title: 'Dinner',
      total: 90,
      paidById: 'a',
      participantIds: ['a', 'b', 'c'],
    }
    const b = computeExpenseBreakdown(expense, people)
    expect(b.payerName).toBe('Alice')
    expect(b.lines).toHaveLength(3)
    expect(b.lines[0]?.total + b.lines[1]!.total + b.lines[2]!.total).toBeCloseTo(90, 10)
    expect(b.lines[0]?.food).toBe(0)
  })
})

describe('computeExpenseBreakdown — restaurant', () => {
  it('breaks down food, tax, tip, service per person', () => {
    const expense: Expense = {
      id: 'r1',
      type: 'restaurant',
      title: 'Pizza',
      paidById: 'a',
      items: [
        { id: 'i1', name: 'Pepperoni', price: 20, assignedIds: ['a'] },
        { id: 'i2', name: 'Cheese', price: 30, assignedIds: ['b'] },
      ],
      tax: 5,
      tip: 10,
      serviceFee: 0,
    }
    const b = computeExpenseBreakdown(expense, people)
    expect(b.lines).toHaveLength(2)
    const aliceLine = b.lines.find((l) => l.personId === 'a')!
    const bobLine = b.lines.find((l) => l.personId === 'b')!
    // Alice: 20 food, 40% of 5 tax + 10 tip = 6
    expect(aliceLine.food).toBeCloseTo(20, 1)
    expect(aliceLine.tax + aliceLine.tip).toBeCloseTo(6, 1)
    // Bob: 30 food, 60% of 15 = 9
    expect(bobLine.food).toBeCloseTo(30, 1)
    expect(bobLine.tax + bobLine.tip).toBeCloseTo(9, 1)
    // Totals match
    expect(aliceLine.total + bobLine.total).toBeCloseTo(65, 1)
  })

  it('splits a shared item per-head', () => {
    const expense: Expense = {
      id: 'r2',
      type: 'restaurant',
      title: 'Wine',
      paidById: 'a',
      items: [{ id: 'i1', name: 'Bottle', price: 60, assignedIds: ['a', 'b', 'c'] }],
      tax: 0,
      tip: 0,
      serviceFee: 0,
    }
    const b = computeExpenseBreakdown(expense, people)
    expect(b.lines).toHaveLength(3)
    for (const line of b.lines) expect(line.food).toBeCloseTo(20, 1)
  })

  it('handles zero food gracefully', () => {
    const expense: Expense = {
      id: 'r3',
      type: 'restaurant',
      title: 'Empty',
      paidById: 'a',
      items: [{ id: 'i1', name: 'Nothing', price: 0, assignedIds: ['a'] }],
      tax: 10,
      tip: 0,
      serviceFee: 0,
    }
    const b = computeExpenseBreakdown(expense, people)
    expect(b.lines).toHaveLength(1)
    expect(b.lines[0]?.tax).toBe(0)
  })
})

describe('computeExpenseBreakdown — consistency with balances', () => {
  it('per-person totals exactly match computeExpenseSplits (no 1¢ drift)', async () => {
    const { computeExpenseSplits } = await import('./compute-balances')
    // The "Spartan" tax/tip case the user reported: 2 items, 3 people, awkward
    // remainders. Previously the inline breakdown summed to a different total
    // for Ben + Test2 than the canonical balances calculation.
    const expense: Expense = {
      id: 'r1',
      type: 'restaurant',
      title: 'Spartan',
      paidById: alice.id,
      items: [
        { id: 'i1', name: 'Tacos', price: 30, assignedIds: ['a'] },
        { id: 'i2', name: 'Tacos2', price: 15, assignedIds: ['b', 'c'] },
      ],
      tax: 10,
      tip: 1,
      serviceFee: 0,
    }
    const b = computeExpenseBreakdown(expense, people)
    const splits = computeExpenseSplits(expense)
    for (const line of b.lines) {
      expect(line.total).toBe(splits[line.personId])
    }
  })
})

describe('computeExpenseBreakdown — lodging tiered', () => {
  it('exposes weight (rate × nights) for tiered lodging', () => {
    const expense: Expense = {
      id: 'l1',
      type: 'lodging',
      title: 'Cabin',
      total: 900,
      paidById: 'a',
      mode: 'tiered',
      nights: { a: 3, b: 3 },
      rooms: [
        { id: 'r1', name: 'Master', nightlyRate: 200 },
        { id: 'r2', name: 'Loft', nightlyRate: 100 },
      ],
      assignments: { a: 'r1', b: 'r2' },
    }
    const b = computeExpenseBreakdown(expense, people)
    const aliceLine = b.lines.find((l) => l.personId === 'a')!
    expect(aliceLine.weight).toBe(600)
    expect(aliceLine.total).toBeCloseTo(600, 1)
  })
})
