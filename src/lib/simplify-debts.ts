import type { MemberBalance } from './compute-balances'

export interface DebtSimplification {
  fromMemberId: string
  fromName: string
  toMemberId: string
  toName: string
  amount: number
}

export function simplifyDebts(balances: MemberBalance[]): DebtSimplification[] {
  const result: DebtSimplification[] = []

  const creditors = balances
    .filter((b) => b.net > 0.005)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.net - a.net)

  const debtors = balances
    .filter((b) => b.net < -0.005)
    .map((b) => ({ ...b }))
    .sort((a, b) => a.net - b.net)

  let i = 0
  let j = 0

  while (i < creditors.length && j < debtors.length) {
    const c = creditors[i]
    const d = debtors[j]
    const amount = Math.min(c.net, -d.net)
    const rounded = Math.round(amount * 100) / 100

    if (rounded > 0.005) {
      result.push({
        fromMemberId: d.memberId,
        fromName: d.name,
        toMemberId: c.memberId,
        toName: c.name,
        amount: rounded,
      })
    }

    c.net -= amount
    d.net += amount

    if (c.net < 0.005) i++
    if (d.net > -0.005) j++
  }

  return result
}
