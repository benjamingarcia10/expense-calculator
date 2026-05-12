/**
 * Rich per-person breakdown for a single expense. Powers the "click expense to see details" view.
 *
 * For restaurant expenses we expose the food / tax / tip / service split per person so the user can
 * see how their total was assembled, not just the final number.
 *
 * For all other expense types we expose only the total share — there's no sub-structure to show.
 */
import type { Expense, Person } from '../types'
import { distributeByWeight, type SplitResult } from './splits'
import { computeExpenseSplits } from './compute-balances'

export interface PersonLine {
  personId: string
  name: string
  /** Total this person owes for this expense. Always matches sum(food, tax, tip, service). */
  total: number
  /** Restaurant-only: their slice of food items. 0 for other expense types. */
  food: number
  /** Restaurant-only: their prorated share of tax/tip/service fee. 0 for other expense types. */
  tax: number
  tip: number
  service: number
  /** For lodging tiered: the rate × nights weight that produced their share. Otherwise undefined. */
  weight?: number
}

export interface ExpenseBreakdown {
  payerId: string
  payerName: string
  total: number
  /** Per-person rows. Includes only people who appear in the split. */
  lines: PersonLine[]
}

function nameOf(people: Person[], id: string): string {
  return people.find((p) => p.id === id)?.name ?? '?'
}

function emptyLine(personId: string, name: string): PersonLine {
  return { personId, name, total: 0, food: 0, tax: 0, tip: 0, service: 0 }
}

export function computeExpenseBreakdown(expense: Expense, people: Person[]): ExpenseBreakdown {
  const payerName = nameOf(people, expense.paidById)

  if (expense.type === 'restaurant') {
    const foodSubtotals: Record<string, number> = {}
    let totalFood = 0
    for (const item of expense.items) {
      const count = item.assignedIds.length
      if (count === 0) continue
      const perHead = item.price / count
      for (const id of item.assignedIds) {
        foodSubtotals[id] = (foodSubtotals[id] ?? 0) + perHead
        totalFood += perHead
      }
    }

    const distributeExtra = (amount: number): Record<string, number> =>
      totalFood > 0 && amount > 0
        ? distributeByWeight(amount, foodSubtotals)
        : Object.fromEntries(Object.keys(foodSubtotals).map((k) => [k, 0]))

    const taxByPerson = distributeExtra(expense.tax)
    const tipByPerson = distributeExtra(expense.tip)
    const serviceByPerson = distributeExtra(expense.serviceFee)
    const foodRounded = totalFood > 0 ? distributeByWeight(totalFood, foodSubtotals) : {}

    const lines: PersonLine[] = Object.keys(foodSubtotals)
      .sort((a, b) => nameOf(people, a).localeCompare(nameOf(people, b)))
      .map((id) => {
        const food = foodRounded[id] ?? 0
        const tax = taxByPerson[id] ?? 0
        const tip = tipByPerson[id] ?? 0
        const service = serviceByPerson[id] ?? 0
        return {
          personId: id,
          name: nameOf(people, id),
          food,
          tax,
          tip,
          service,
          total: +(food + tax + tip + service).toFixed(2),
        }
      })

    const total = lines.reduce((s, l) => s + l.total, 0)
    return { payerId: expense.paidById, payerName, total: +total.toFixed(2), lines }
  }

  // Non-restaurant: use the standard splits, food/tax/tip/service all zero.
  let splits: SplitResult
  try {
    splits = computeExpenseSplits(expense)
  } catch {
    splits = {}
  }

  let weights: Record<string, number> | undefined
  if (expense.type === 'lodging' && expense.mode === 'tiered' && expense.rooms && expense.assignments) {
    const roomById = new Map(expense.rooms.map((r) => [r.id, r]))
    weights = {}
    for (const [pid, nights] of Object.entries(expense.nights)) {
      const room = roomById.get(expense.assignments[pid] ?? '')
      weights[pid] = (room?.nightlyRate ?? 0) * nights
    }
  }

  const lines: PersonLine[] = Object.entries(splits)
    .sort(([a], [b]) => nameOf(people, a).localeCompare(nameOf(people, b)))
    .map(([id, amount]) => {
      const line = emptyLine(id, nameOf(people, id))
      line.total = amount
      if (weights && weights[id] != null) line.weight = weights[id]
      return line
    })

  const total = lines.reduce((s, l) => s + l.total, 0)
  return { payerId: expense.paidById, payerName, total: +total.toFixed(2), lines }
}
