export const SCHEMA_VERSION = 1

export type Person = {
  id: string
  name: string
}

export type RestaurantItem = {
  id: string
  name: string
  price: number
  assignedIds: string[]
}

export type Room = {
  id: string
  name: string
  nightlyRate: number
}

type ExpenseBase = {
  id: string
  title: string
  paidById: string
}

export type EqualExpense = ExpenseBase & {
  type: 'equal'
  total: number
  participantIds: string[]
}

export type SharesExpense = ExpenseBase & {
  type: 'shares'
  total: number
  shares: Record<string, number>
}

export type ExactExpense = ExpenseBase & {
  type: 'exact'
  total: number
  amounts: Record<string, number>
}

export type MileageExpense = ExpenseBase & {
  type: 'mileage'
  total: number
  unitLabel: string
  units: Record<string, number>
}

export type RestaurantExpense = ExpenseBase & {
  type: 'restaurant'
  items: RestaurantItem[]
  tax: number
  tip: number
  serviceFee: number
}

export type LodgingExpense = ExpenseBase & {
  type: 'lodging'
  total: number
  mode: 'simple' | 'tiered'
  nights: Record<string, number>
  rooms?: Room[]
  assignments?: Record<string, string>
}

export type Expense =
  | EqualExpense
  | SharesExpense
  | ExactExpense
  | MileageExpense
  | RestaurantExpense
  | LodgingExpense

export type ExpenseType = Expense['type']

export type ExpenseInput =
  | Omit<EqualExpense, 'id'>
  | Omit<SharesExpense, 'id'>
  | Omit<ExactExpense, 'id'>
  | Omit<MileageExpense, 'id'>
  | Omit<RestaurantExpense, 'id'>
  | Omit<LodgingExpense, 'id'>

export type Session = {
  v: typeof SCHEMA_VERSION
  currency: string
  title: string | null
  people: Person[]
  expenses: Expense[]
  createdAt: string
}

export function expenseTotal(e: Expense): number {
  if (e.type === 'restaurant') {
    const items = e.items.reduce((s, i) => s + i.price, 0)
    return items + e.tax + e.tip + e.serviceFee
  }
  return e.total
}
