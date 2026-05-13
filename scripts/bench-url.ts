/**
 * One-off benchmark: compare the old (raw-JSON → deflate → base64url) and
 * new (tuple → deflate → base64url) URL encoders on a realistic session.
 * Run with: npx tsx scripts/bench-url.ts
 */
import { deflate } from 'pako'
import { encodeSession } from '../src/lib/url-share'
import { SCHEMA_VERSION, type Session } from '../src/types'

const cuid = (n: number) => `cl${n.toString(36).padStart(20, 'x')}`

const session: Session = {
  v: SCHEMA_VERSION,
  currency: 'USD',
  title: 'Lake Tahoe long weekend',
  people: [
    { id: cuid(1), name: 'Alice' },
    { id: cuid(2), name: 'Bob' },
    { id: cuid(3), name: 'Carol' },
    { id: cuid(4), name: 'Dave' },
  ],
  expenses: [
    {
      id: cuid(10),
      type: 'equal',
      title: 'Gas to Tahoe',
      total: 84.5,
      paidById: cuid(1),
      participantIds: [cuid(1), cuid(2), cuid(3), cuid(4)],
    },
    {
      id: cuid(11),
      type: 'equal',
      title: 'Groceries day 1',
      total: 142.3,
      paidById: cuid(2),
      participantIds: [cuid(1), cuid(2), cuid(3), cuid(4)],
    },
    {
      id: cuid(12),
      type: 'restaurant',
      title: 'Dinner at Spartan',
      paidById: cuid(3),
      items: [
        { id: cuid(20), name: 'Wagyu burger', price: 28, assignedIds: [cuid(1)] },
        { id: cuid(21), name: 'Truffle pasta', price: 32, assignedIds: [cuid(2)] },
        { id: cuid(22), name: 'Caesar salad', price: 18, assignedIds: [cuid(3)] },
        { id: cuid(23), name: 'Ribeye', price: 48, assignedIds: [cuid(4)] },
        { id: cuid(24), name: 'Wine bottle', price: 60, assignedIds: [cuid(1), cuid(2), cuid(3), cuid(4)] },
      ],
      tax: 15.4,
      tip: 30,
      serviceFee: 0,
    },
    {
      id: cuid(13),
      type: 'lodging',
      title: 'Airbnb',
      total: 1200,
      paidById: cuid(4),
      mode: 'tiered',
      nights: { [cuid(1)]: 3, [cuid(2)]: 3, [cuid(3)]: 2, [cuid(4)]: 3 },
      rooms: [
        { id: cuid(30), name: 'Master', nightlyRate: 200 },
        { id: cuid(31), name: 'Loft', nightlyRate: 150 },
      ],
      assignments: {
        [cuid(1)]: cuid(30),
        [cuid(2)]: cuid(30),
        [cuid(3)]: cuid(31),
        [cuid(4)]: cuid(31),
      },
    },
    {
      id: cuid(14),
      type: 'mileage',
      title: 'Ski rental trips',
      total: 60,
      paidById: cuid(1),
      unitLabel: 'trips',
      units: { [cuid(1)]: 2, [cuid(2)]: 1, [cuid(3)]: 1, [cuid(4)]: 2 },
    },
    {
      id: cuid(15),
      type: 'shares',
      title: 'Lift tickets',
      total: 480,
      paidById: cuid(2),
      shares: { [cuid(1)]: 1, [cuid(2)]: 1, [cuid(3)]: 1, [cuid(4)]: 1 },
    },
    {
      id: cuid(16),
      type: 'exact',
      title: 'Lessons',
      total: 250,
      paidById: cuid(3),
      amounts: { [cuid(1)]: 100, [cuid(3)]: 150 },
    },
    {
      id: cuid(17),
      type: 'equal',
      title: 'Coffee',
      total: 32,
      paidById: cuid(4),
      participantIds: [cuid(1), cuid(2), cuid(3), cuid(4)],
    },
    {
      id: cuid(18),
      type: 'restaurant',
      title: 'Brunch',
      paidById: cuid(1),
      items: [
        { id: cuid(40), name: 'Eggs benedict', price: 22, assignedIds: [cuid(1)] },
        { id: cuid(41), name: 'Pancakes', price: 18, assignedIds: [cuid(2)] },
        { id: cuid(42), name: 'Avocado toast', price: 17, assignedIds: [cuid(3)] },
        { id: cuid(43), name: 'Omelette', price: 19, assignedIds: [cuid(4)] },
      ],
      tax: 6,
      tip: 15,
      serviceFee: 0,
    },
    {
      id: cuid(19),
      type: 'equal',
      title: 'Gas home',
      total: 88,
      paidById: cuid(2),
      participantIds: [cuid(1), cuid(2), cuid(3), cuid(4)],
    },
  ],
  createdAt: '2026-05-12T00:00:00.000Z',
}

function oldEncode(s: Session): string {
  const json = JSON.stringify(s)
  const bytes = deflate(new TextEncoder().encode(json))
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const rawJsonLen = JSON.stringify(session).length
const oldLen = oldEncode(session).length
const newLen = encodeSession(session).length

const fmt = (n: number) => n.toString().padStart(5)
console.log(`Realistic 4-person, 10-expense session:`)
console.log(`  raw JSON                          ${fmt(rawJsonLen)} chars`)
console.log(`  old: JSON → deflate → base64url   ${fmt(oldLen)} chars`)
console.log(`  new: tuple → deflate → base64url  ${fmt(newLen)} chars`)
console.log(`  reduction vs old                  ${((1 - newLen / oldLen) * 100).toFixed(1)}%`)
