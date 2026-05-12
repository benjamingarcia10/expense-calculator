export type Money = number
export type SplitResult = Record<string, Money>

export class EmptySplitError extends Error {
  constructor(mode: string) {
    super(`Cannot compute ${mode} split: no valid participants`)
    this.name = 'EmptySplitError'
  }
}

export class ExactSplitMismatchError extends Error {
  constructor(
    public readonly total: Money,
    public readonly sum: Money,
    public readonly delta: Money
  ) {
    super(`Exact split mismatch: expected ${total}, got ${sum} (delta ${delta})`)
    this.name = 'ExactSplitMismatchError'
  }
}

export function distributeByWeight(total: Money, weights: Record<string, number>): SplitResult {
  const entries = Object.entries(weights).filter(([, w]) => w > 0)
  if (entries.length === 0) return {}
  const totalWeight = entries.reduce((s, [, w]) => s + w, 0)
  const totalPennies = Math.round(total * 100)
  const allocations = entries.map(([key, weight]) => {
    const rawPennies = (weight / totalWeight) * totalPennies
    const floorPennies = Math.floor(rawPennies)
    return { key, weight, floorPennies, remainder: rawPennies - floorPennies }
  })
  const allocatedPennies = allocations.reduce((s, a) => s + a.floorPennies, 0)
  const leftoverPennies = totalPennies - allocatedPennies
  const byRemainder = [...allocations].sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder
    return a.key < b.key ? -1 : a.key > b.key ? 1 : 0
  })
  const pennyBonus: Record<string, number> = {}
  for (let i = 0; i < leftoverPennies && i < byRemainder.length; i++) {
    pennyBonus[byRemainder[i].key] = 1
  }
  const result: SplitResult = {}
  for (const { key, floorPennies } of allocations) {
    const finalPennies = floorPennies + (pennyBonus[key] ?? 0)
    result[key] = finalPennies / 100
  }
  return result
}

export interface EqualInput {
  total: Money
  participantKeys: readonly string[]
}
export interface SharesInput {
  total: Money
  multipliers: Record<string, number>
}
export interface ExactInput {
  total: Money
  amounts: Record<string, Money>
}

export function computeEqualSplit(input: EqualInput): SplitResult {
  if (input.participantKeys.length === 0) throw new EmptySplitError('equal')
  const weights: Record<string, number> = {}
  for (const k of input.participantKeys) weights[k] = (weights[k] ?? 0) + 1
  return distributeByWeight(input.total, weights)
}

export function computeSharesSplit(input: SharesInput): SplitResult {
  const positive = Object.entries(input.multipliers).filter(([, m]) => m > 0)
  if (positive.length === 0) throw new EmptySplitError('shares')
  return distributeByWeight(input.total, Object.fromEntries(positive))
}

export function computeExactSplit(input: ExactInput): SplitResult {
  const rounded: SplitResult = {}
  for (const [key, amount] of Object.entries(input.amounts)) {
    rounded[key] = Math.round(amount * 100) / 100
  }
  const sum = Object.values(rounded).reduce((s, v) => s + v, 0)
  const deltaPennies = Math.round((input.total - sum) * 100)
  if (deltaPennies !== 0) {
    throw new ExactSplitMismatchError(input.total, sum, deltaPennies / 100)
  }
  return rounded
}

export interface ItemizedItem {
  price: Money
  assignedKeys: readonly string[]
}
export interface ItemizedInput {
  items: readonly ItemizedItem[]
  tax: Money
  tip: Money
  serviceFee: Money
}

export function computeItemizedSplit(input: ItemizedInput): SplitResult {
  const foodSubtotals: Record<string, number> = {}
  for (const item of input.items) {
    const count = item.assignedKeys.length
    if (count === 0) continue
    const perHeadShare = item.price / count
    for (const key of item.assignedKeys) {
      foodSubtotals[key] = (foodSubtotals[key] ?? 0) + perHeadShare
    }
  }
  const totalFood = Object.values(foodSubtotals).reduce((s, v) => s + v, 0)
  const extras = input.tax + input.tip + input.serviceFee
  const rawTotals: Record<string, number> = {}
  for (const [key, food] of Object.entries(foodSubtotals)) {
    const extrasShare = totalFood > 0 ? (food / totalFood) * extras : 0
    rawTotals[key] = food + extrasShare
  }
  const grandTotal = totalFood + (totalFood > 0 ? extras : 0)
  return distributeByWeight(grandTotal, rawTotals)
}
