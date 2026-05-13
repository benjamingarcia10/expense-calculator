import { deflate, inflate } from 'pako'
import { type Expense, type Session, SCHEMA_VERSION } from '../types'
import { validateSession } from './validation'

export const URL_WARN_LENGTH = 2000
const HASH_PREFIX = '#d='

/**
 * Wire format
 * ------------------------------------------------------------------
 * The session is serialized as a positional tuple (not an object) so
 * key names (`title`, `paidById`, `splits`, ...) and full string IDs
 * don't end up in the URL. Person IDs become indices into the people
 * array; the same trick is applied recursively for rooms inside a
 * lodging expense.
 *
 *   [v, currency, title, createdAt, peopleNames, expenses]
 *
 * Each expense is a tuple keyed on a small type code (0–5):
 *
 *   0 equal      [0, title, paidByIdx, total, participantIdxs[]]
 *   1 shares     [1, title, paidByIdx, total, [idx, share][]]
 *   2 exact      [2, title, paidByIdx, total, [idx, amount][]]
 *   3 mileage    [3, title, paidByIdx, total, unitLabel, [idx, units][]]
 *   4 restaurant [4, title, paidByIdx, items, tax, tip, serviceFee]
 *                items: [name, price, assignedIdxs[]][]
 *   5 lodging    [5, title, paidByIdx, total, modeCode, nights, rooms, assigns]
 *                modeCode: 0=simple, 1=tiered
 *                nights: [idx, n][]
 *                rooms?: [name, rate][]   (room id = array index)
 *                assigns?: [personIdx, roomIdx][]
 *
 * Reconstructed IDs are deterministic (`p0`, `e0`, `i0-0`, `r0-0`)
 * so a decoded session round-trips cleanly through validation.
 */

const TYPE_CODE = {
  equal: 0,
  shares: 1,
  exact: 2,
  mileage: 3,
  restaurant: 4,
  lodging: 5,
} as const
const CODE_TYPE: ReadonlyArray<Expense['type']> = [
  'equal',
  'shares',
  'exact',
  'mileage',
  'restaurant',
  'lodging',
]
const LODGING_MODE_CODE = { simple: 0, tiered: 1 } as const
const CODE_LODGING_MODE = ['simple', 'tiered'] as const

type EncodedExpense = unknown[]
type EncodedSession = [
  v: number,
  currency: string,
  title: string | null,
  createdAt: string,
  peopleNames: string[],
  expenses: EncodedExpense[],
]

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(input: string): Uint8Array {
  const pad = input.length % 4
  const padded = input + '='.repeat(pad === 0 ? 0 : 4 - pad)
  const normal = padded.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(normal)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function recordToPairs(
  rec: Record<string, number>,
  idIdx: Map<string, number>
): [number, number][] {
  const pairs: [number, number][] = []
  for (const [id, val] of Object.entries(rec)) {
    const idx = idIdx.get(id)
    if (idx !== undefined) pairs.push([idx, val])
  }
  return pairs
}

function pairsToRecord(pairs: [number, number][], idxToId: string[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [idx, val] of pairs) {
    const id = idxToId[idx]
    if (id !== undefined) out[id] = val
  }
  return out
}

function encodeExpense(e: Expense, idIdx: Map<string, number>): EncodedExpense {
  const code = TYPE_CODE[e.type]
  const paidBy = idIdx.get(e.paidById) ?? 0
  switch (e.type) {
    case 'equal':
      return [code, e.title, paidBy, e.total, e.participantIds.map((id) => idIdx.get(id) ?? 0)]
    case 'shares':
      return [code, e.title, paidBy, e.total, recordToPairs(e.shares, idIdx)]
    case 'exact':
      return [code, e.title, paidBy, e.total, recordToPairs(e.amounts, idIdx)]
    case 'mileage':
      return [code, e.title, paidBy, e.total, e.unitLabel, recordToPairs(e.units, idIdx)]
    case 'restaurant': {
      const items = e.items.map((i) => [
        i.name,
        i.price,
        i.assignedIds.map((id) => idIdx.get(id) ?? 0),
      ])
      return [code, e.title, paidBy, items, e.tax, e.tip, e.serviceFee]
    }
    case 'lodging': {
      const modeCode = LODGING_MODE_CODE[e.mode]
      const nights = recordToPairs(e.nights, idIdx)
      const rooms = e.rooms?.map((r) => [r.name, r.nightlyRate]) ?? null
      const roomIdx = new Map<string, number>()
      e.rooms?.forEach((r, i) => roomIdx.set(r.id, i))
      const assigns = e.assignments
        ? Object.entries(e.assignments).map(
            ([pid, rid]) => [idIdx.get(pid) ?? 0, roomIdx.get(rid) ?? 0] as [number, number]
          )
        : null
      return [code, e.title, paidBy, e.total, modeCode, nights, rooms, assigns]
    }
  }
}

function decodeExpense(arr: EncodedExpense, expIdx: number, idxToId: string[]): Expense {
  const code = arr[0] as number
  const type = CODE_TYPE[code]
  if (!type) throw new Error(`unknown expense type code: ${code}`)
  const id = `e${expIdx}`
  const title = arr[1] as string
  const paidById = idxToId[arr[2] as number]
  switch (type) {
    case 'equal':
      return {
        id,
        type,
        title,
        paidById,
        total: arr[3] as number,
        participantIds: (arr[4] as number[]).map((i) => idxToId[i]),
      }
    case 'shares':
      return {
        id,
        type,
        title,
        paidById,
        total: arr[3] as number,
        shares: pairsToRecord(arr[4] as [number, number][], idxToId),
      }
    case 'exact':
      return {
        id,
        type,
        title,
        paidById,
        total: arr[3] as number,
        amounts: pairsToRecord(arr[4] as [number, number][], idxToId),
      }
    case 'mileage':
      return {
        id,
        type,
        title,
        paidById,
        total: arr[3] as number,
        unitLabel: arr[4] as string,
        units: pairsToRecord(arr[5] as [number, number][], idxToId),
      }
    case 'restaurant': {
      const items = (arr[3] as Array<[string, number, number[]]>).map((it, i) => ({
        id: `i${expIdx}-${i}`,
        name: it[0],
        price: it[1],
        assignedIds: it[2].map((pi) => idxToId[pi]),
      }))
      return {
        id,
        type,
        title,
        paidById,
        items,
        tax: arr[4] as number,
        tip: arr[5] as number,
        serviceFee: arr[6] as number,
      }
    }
    case 'lodging': {
      const mode = CODE_LODGING_MODE[arr[4] as number]
      const nights = pairsToRecord(arr[5] as [number, number][], idxToId)
      const rawRooms = arr[6] as Array<[string, number]> | null
      const rooms = rawRooms?.map((r, i) => ({
        id: `r${expIdx}-${i}`,
        name: r[0],
        nightlyRate: r[1],
      }))
      const rawAssigns = arr[7] as Array<[number, number]> | null
      const roomIdxToId = rooms?.map((r) => r.id) ?? []
      const assignments = rawAssigns
        ? Object.fromEntries(rawAssigns.map(([pi, ri]) => [idxToId[pi], roomIdxToId[ri]]))
        : undefined
      return {
        id,
        type,
        title,
        paidById,
        total: arr[3] as number,
        mode,
        nights,
        ...(rooms ? { rooms } : {}),
        ...(assignments ? { assignments } : {}),
      }
    }
  }
}

function sessionToTuple(s: Session): EncodedSession {
  const idIdx = new Map<string, number>()
  s.people.forEach((p, i) => idIdx.set(p.id, i))
  const peopleNames = s.people.map((p) => p.name)
  const expenses = s.expenses.map((e) => encodeExpense(e, idIdx))
  return [s.v, s.currency, s.title, s.createdAt, peopleNames, expenses]
}

function tupleToSession(tuple: EncodedSession): Session {
  const [v, currency, title, createdAt, peopleNames, encExpenses] = tuple
  const people = peopleNames.map((name, i) => ({ id: `p${i}`, name }))
  const idxToId = people.map((p) => p.id)
  const expenses = encExpenses.map((arr, i) => decodeExpense(arr, i, idxToId))
  return {
    v: v as typeof SCHEMA_VERSION,
    currency,
    title,
    people,
    expenses,
    createdAt,
  }
}

export function encodeSession(session: Session): string {
  const tuple = sessionToTuple(session)
  const json = JSON.stringify(tuple)
  const bytes = deflate(new TextEncoder().encode(json))
  return base64UrlEncode(bytes)
}

export type DecodeResult =
  | { ok: true; session: Session; encodedLength: number }
  | { ok: false; reason: 'no-hash' | 'malformed' | 'invalid-schema' }

export function decodeShareHash(hash: string): DecodeResult {
  if (!hash.startsWith(HASH_PREFIX)) return { ok: false, reason: 'no-hash' }
  const encoded = hash.slice(HASH_PREFIX.length)
  try {
    const bytes = base64UrlDecode(encoded)
    const json = new TextDecoder().decode(inflate(bytes))
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed) || typeof parsed[0] !== 'number') {
      return { ok: false, reason: 'malformed' }
    }
    const session = tupleToSession(parsed as EncodedSession)
    const result = validateSession(session)
    if (!result.success) return { ok: false, reason: 'invalid-schema' }
    return { ok: true, session: result.data as Session, encodedLength: encoded.length }
  } catch {
    return { ok: false, reason: 'malformed' }
  }
}

export function buildShareUrl(base: string, session: Session): string {
  const trimmed = base.replace(/#.*$/, '')
  return `${trimmed}${HASH_PREFIX}${encodeSession(session)}`
}
