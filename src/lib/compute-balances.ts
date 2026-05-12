import type { Expense, Person } from '../types'
import {
  computeEqualSplit,
  computeSharesSplit,
  computeExactSplit,
  computeItemizedSplit,
  type SplitResult,
} from './splits'
import { computeLodgingSplit } from './lodging'

export interface MemberBalance {
  memberId: string
  name: string
  net: number
}

export function computeExpenseSplits(expense: Expense): SplitResult {
  switch (expense.type) {
    case 'equal':
      return computeEqualSplit({ total: expense.total, participantKeys: expense.participantIds })
    case 'shares':
      return computeSharesSplit({ total: expense.total, multipliers: expense.shares })
    case 'exact':
      return computeExactSplit({ total: expense.total, amounts: expense.amounts })
    case 'mileage':
      return computeSharesSplit({ total: expense.total, multipliers: expense.units })
    case 'restaurant':
      return computeItemizedSplit({
        items: expense.items.map((i) => ({ price: i.price, assignedKeys: i.assignedIds })),
        tax: expense.tax,
        tip: expense.tip,
        serviceFee: expense.serviceFee,
      })
    case 'lodging':
      return computeLodgingSplit({
        total: expense.total,
        mode: expense.mode,
        nights: expense.nights,
        rooms: expense.rooms,
        assignments: expense.assignments,
      })
  }
}

function expenseTotal(expense: Expense): number {
  if (expense.type === 'restaurant') {
    return expense.items.reduce((s, i) => s + i.price, 0) + expense.tax + expense.tip + expense.serviceFee
  }
  return expense.total
}

export function computeBalances(people: Person[], expenses: Expense[]): MemberBalance[] {
  const paid: Record<string, number> = {}
  const owed: Record<string, number> = {}

  for (const p of people) {
    paid[p.id] = 0
    owed[p.id] = 0
  }

  for (const e of expenses) {
    paid[e.paidById] = (paid[e.paidById] ?? 0) + expenseTotal(e)

    try {
      const splits = computeExpenseSplits(e)
      for (const [personId, amount] of Object.entries(splits)) {
        owed[personId] = (owed[personId] ?? 0) + amount
      }
    } catch {
      // skip expenses that fail to compute (e.g. mid-edit exact mismatch)
    }
  }

  return people
    .map((p) => ({ memberId: p.id, name: p.name, net: (paid[p.id] ?? 0) - (owed[p.id] ?? 0) }))
    .filter((b) => Math.abs(b.net) > 0.005)
}
