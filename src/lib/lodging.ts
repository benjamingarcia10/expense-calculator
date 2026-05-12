import { computeSharesSplit, type Money, type SplitResult } from './splits'

export interface LodgingInput {
  total: Money
  mode: 'simple' | 'tiered'
  nights: Record<string, number>
  rooms?: Array<{ id: string; name: string; nightlyRate: Money }>
  assignments?: Record<string, string>
}

export function computeLodgingSplit(input: LodgingInput): SplitResult {
  if (input.mode === 'simple') {
    return computeSharesSplit({ total: input.total, multipliers: input.nights })
  }

  const roomById = new Map((input.rooms ?? []).map((r) => [r.id, r]))
  const fullyAssigned = Object.entries(input.nights).every(
    ([personId, nights]) => nights === 0 || roomById.has(input.assignments?.[personId] ?? '')
  )

  if (!fullyAssigned) {
    return computeSharesSplit({ total: input.total, multipliers: input.nights })
  }

  const weights: Record<string, number> = {}
  for (const [personId, nights] of Object.entries(input.nights)) {
    if (nights <= 0) continue
    const roomId = input.assignments?.[personId]
    const room = roomId ? roomById.get(roomId) : undefined
    weights[personId] = nights * (room?.nightlyRate ?? 0)
  }

  return computeSharesSplit({ total: input.total, multipliers: weights })
}
