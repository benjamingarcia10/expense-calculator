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
  // Per-key food subtotals. Duplicate assignees on the same item are preserved
  // (each adds another head to the per-head share).
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
  if (totalFood <= 0) return {}

  // Distribute food and each extra (tax / tip / service) SEPARATELY using the
  // same food-weighted proportions. Summing component splits per person gives
  // each person's row total, and each component sums to its input — so the
  // breakdown table in the UI (which shows the four columns) always matches
  // the canonical total used by balances + settle-up. A single-pass distribution
  // on the grand total can disagree with a row-by-row sum by 1¢ when leftover
  // pennies fall on different people.
  const foodSplit = distributeByWeight(totalFood, foodSubtotals)
  const taxSplit = input.tax > 0 ? distributeByWeight(input.tax, foodSubtotals) : {}
  const tipSplit = input.tip > 0 ? distributeByWeight(input.tip, foodSubtotals) : {}
  const serviceSplit = input.serviceFee > 0 ? distributeByWeight(input.serviceFee, foodSubtotals) : {}

  const result: SplitResult = {}
  for (const key of Object.keys(foodSubtotals)) {
    const total =
      (foodSplit[key] ?? 0) + (taxSplit[key] ?? 0) + (tipSplit[key] ?? 0) + (serviceSplit[key] ?? 0)
    // Round to pennies; every component is already penny-exact so the sum
    // stays penny-exact, but use toFixed to defuse any float artefacts.
    result[key] = Math.round(total * 100) / 100
  }
  return result
}
