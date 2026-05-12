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
