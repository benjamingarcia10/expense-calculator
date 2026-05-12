import { useSession } from '../../store/session'

export function usePeople() {
  return useSession((s) => s.people)
}

export function parseMoney(input: string): number {
  const n = Number(input.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function clampMoney(n: number, max = 999_999.99): number {
  return Math.max(0, Math.min(max, Math.round(n * 100) / 100))
}
