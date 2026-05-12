import { z } from 'zod'
import { SCHEMA_VERSION } from '../types'
import { isCurrencyCode } from './currencies'

export const LIMITS = {
  personName: 30,
  expenseTitle: 60,
  itemName: 40,
  unitLabel: 12,
  sessionTitle: 50,
  roomName: 30,
  maxPeople: 25,
  maxExpenses: 100,
  maxItemsPerExpense: 50,
  maxRoomsPerLodging: 10,
  moneyMax: 999_999.99,
  nightsMax: 365,
  unitsMax: 99_999,
  sharesMax: 99,
} as const

// Strip zero-width and BOM-style characters (U+200B–U+200D, U+FEFF, U+2060)
const ZW_RE = /\u200B|\u200C|\u200D|\uFEFF|\u2060/g

function sanitize(input: string, max: number): string {
  return input.replace(ZW_RE, '').trim().slice(0, max)
}

export function sanitizeName(input: string): string {
  return sanitize(input, LIMITS.personName)
}

export function sanitizeTitle(input: string): string {
  return sanitize(input, LIMITS.expenseTitle)
}

export function sanitizeItemName(input: string): string {
  return sanitize(input, LIMITS.itemName)
}

export function sanitizeUnitLabel(input: string): string {
  return sanitize(input, LIMITS.unitLabel)
}

export function sanitizeSessionTitle(input: string): string {
  return sanitize(input, LIMITS.sessionTitle)
}

export function sanitizeRoomName(input: string): string {
  return sanitize(input, LIMITS.roomName)
}

const money = z.number().finite().min(0).max(LIMITS.moneyMax)
const id = z.string().min(1).max(40)

const PersonSchema = z.object({
  id,
  name: z.string().min(1).max(LIMITS.personName),
})

const RestaurantItemSchema = z.object({
  id,
  name: z.string().min(1).max(LIMITS.itemName),
  price: money,
  assignedIds: z.array(id).max(LIMITS.maxPeople),
})

const RoomSchema = z.object({
  id,
  name: z.string().min(1).max(LIMITS.roomName),
  nightlyRate: money,
})

const ExpenseBase = z.object({
  id,
  title: z.string().min(1).max(LIMITS.expenseTitle),
  paidById: id,
})

const ExpenseSchema = z.discriminatedUnion('type', [
  ExpenseBase.extend({
    type: z.literal('equal'),
    total: money,
    participantIds: z.array(id).min(1).max(LIMITS.maxPeople),
  }),
  ExpenseBase.extend({
    type: z.literal('shares'),
    total: money,
    shares: z.record(id, z.number().min(0).max(LIMITS.sharesMax)),
  }),
  ExpenseBase.extend({
    type: z.literal('exact'),
    total: money,
    amounts: z.record(id, money),
  }),
  ExpenseBase.extend({
    type: z.literal('mileage'),
    total: money,
    unitLabel: z.string().min(1).max(LIMITS.unitLabel),
    units: z.record(id, z.number().min(0).max(LIMITS.unitsMax)),
  }),
  ExpenseBase.extend({
    type: z.literal('restaurant'),
    items: z.array(RestaurantItemSchema).min(1).max(LIMITS.maxItemsPerExpense),
    tax: money,
    tip: money,
    serviceFee: money,
  }),
  ExpenseBase.extend({
    type: z.literal('lodging'),
    total: money,
    mode: z.enum(['simple', 'tiered']),
    nights: z.record(id, z.number().int().min(0).max(LIMITS.nightsMax)),
    rooms: z.array(RoomSchema).max(LIMITS.maxRoomsPerLodging).optional(),
    assignments: z.record(id, id).optional(),
  }),
])

export const SessionSchema = z.object({
  v: z.literal(SCHEMA_VERSION),
  currency: z.string().length(3),
  title: z.string().max(LIMITS.sessionTitle).nullable(),
  people: z.array(PersonSchema).max(LIMITS.maxPeople),
  expenses: z.array(ExpenseSchema).max(LIMITS.maxExpenses),
  createdAt: z.string(),
})

export type ValidatedSession = z.infer<typeof SessionSchema>

export function validateSession(
  input: unknown
): { success: true; data: ValidatedSession } | { success: false; error: string } {
  const result = SessionSchema.safeParse(input)
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message ?? 'Invalid session' }
  }
  const session = result.data
  if (!isCurrencyCode(session.currency)) {
    return { success: false, error: `Unsupported currency: ${session.currency}` }
  }
  const personIds = new Set(session.people.map((p) => p.id))
  for (const expense of session.expenses) {
    if (!personIds.has(expense.paidById)) {
      return { success: false, error: `Expense "${expense.title}" references unknown payer` }
    }
    const referencedIds: string[] = []
    if (expense.type === 'equal') referencedIds.push(...expense.participantIds)
    if (expense.type === 'shares') referencedIds.push(...Object.keys(expense.shares))
    if (expense.type === 'exact') referencedIds.push(...Object.keys(expense.amounts))
    if (expense.type === 'mileage') referencedIds.push(...Object.keys(expense.units))
    if (expense.type === 'restaurant') {
      for (const item of expense.items) referencedIds.push(...item.assignedIds)
    }
    if (expense.type === 'lodging') {
      referencedIds.push(...Object.keys(expense.nights))
      if (expense.assignments) referencedIds.push(...Object.keys(expense.assignments))
    }
    for (const id of referencedIds) {
      if (!personIds.has(id)) {
        return { success: false, error: `Expense "${expense.title}" references unknown person` }
      }
    }
  }
  return { success: true, data: session }
}
