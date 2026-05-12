# Expense Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone static expense calculator at `~/Documents/trippy/expense-calculator` supporting six split modes (equal, shares, exact, mileage, restaurant itemized, lodging), with session aggregation, URL/localStorage sharing, and a screenshot-friendly summary view.

**Architecture:** React 19 SPA built with Vite, deployed to GitHub Pages. Pure split math copied from `trip-proposal/lib/finance/` and adapted. Zustand store with localStorage persistence. URL sharing via gzip+base64url in `location.hash`. framer-motion for animations. Playwright for E2E. No backend, no auth, no database.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind v4, Zustand, pako, framer-motion, html-to-image, lucide-react, zod, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-05-11-expense-calculator-design.md`

---

## Phase 1 — Project Setup

### Task 1: Initialize repo and Vite project

**Files:**

- Create: entire new repo at `/Users/ben/Documents/trippy/expense-calculator/`

- [ ] **Step 1: Scaffold Vite app**

```bash
cd /Users/ben/Documents/trippy
npm create vite@latest expense-calculator -- --template react-ts
cd expense-calculator
npm install
```

- [ ] **Step 2: Initialize git, set up .gitignore**

```bash
git init
git branch -M main
```

Confirm `.gitignore` includes: `node_modules/`, `dist/`, `*.local`, `.DS_Store`, `coverage/`, `test-results/`, `playwright-report/`.

- [ ] **Step 3: Verify dev server boots**

```bash
npm run dev
```

Expected: server starts on `http://localhost:5173/`, default Vite page renders.

- [ ] **Step 4: Initial commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React 19 + TS"
```

### Task 2: Install runtime + dev dependencies

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install runtime deps**

```bash
npm install zustand pako framer-motion html-to-image lucide-react zod
```

- [ ] **Step 2: Install dev deps**

```bash
npm install -D @types/pako vitest @vitest/ui happy-dom @testing-library/react @testing-library/user-event @testing-library/jest-dom @playwright/test prettier eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react-hooks eslint-plugin-react-refresh tailwindcss@next @tailwindcss/vite@next
```

- [ ] **Step 3: Install Playwright browsers**

```bash
npx playwright install chromium
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add runtime and dev dependencies"
```

### Task 3: Configure Tailwind v4, TypeScript, Vite base path

**Files:**

- Modify: `vite.config.ts`
- Create: `src/index.css`
- Modify: `tsconfig.json`, `tsconfig.app.json`

- [ ] **Step 1: Replace `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/expense-calculator/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 2: Replace `src/index.css`**

```css
@import 'tailwindcss';

@theme {
  --color-bg: oklch(98% 0.01 80);
  --color-surface: oklch(100% 0 0);
  --color-ink: oklch(20% 0.02 270);
  --color-muted: oklch(50% 0.02 270);
  --color-accent: oklch(65% 0.18 25);
  --color-border: oklch(92% 0.01 270);
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}

@media (prefers-color-scheme: dark) {
  @theme {
    --color-bg: oklch(15% 0.02 270);
    --color-surface: oklch(20% 0.02 270);
    --color-ink: oklch(95% 0.01 80);
    --color-muted: oklch(70% 0.02 270);
    --color-border: oklch(28% 0.02 270);
  }
}

html,
body {
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-sans);
}
```

- [ ] **Step 3: Add `tsconfig.json` strict settings**

Ensure `tsconfig.app.json` has `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`.

- [ ] **Step 4: Create `src/test-setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
afterEach(() => cleanup())
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: configure Tailwind v4, Vitest, base path"
```

### Task 4: Add npm scripts and Prettier/ESLint config

**Files:**

- Modify: `package.json`
- Create: `.prettierrc.json`, `eslint.config.js`

- [ ] **Step 1: Update `package.json` scripts**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build && cp dist/index.html dist/404.html",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --max-warnings 0",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

- [ ] **Step 2: Create `.prettierrc.json`**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 110,
  "arrowParens": "always"
}
```

- [ ] **Step 3: Create minimal `eslint.config.js`**

```js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  }
)
```

Add `eslint @eslint/js typescript-eslint` to devDeps if not already installed.

- [ ] **Step 4: Verify lint + format pass**

```bash
npm run format
npm run lint
npm run typecheck
```

All should exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: add lint, format, test scripts"
```

---

## Phase 2 — Types and Validation

### Task 5: Define core types

**Files:**

- Create: `src/types.ts`

- [ ] **Step 1: Write `src/types.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: define Session, Person, Expense types"
```

### Task 6: Write validation schemas with hard limits

**Files:**

- Create: `src/lib/validation.ts`, `src/lib/validation.test.ts`

- [ ] **Step 1: Write `src/lib/validation.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { LIMITS, validateSession, sanitizeName, sanitizeTitle } from './validation'

describe('LIMITS', () => {
  it('enforces person name max 30 chars', () => {
    expect(LIMITS.personName).toBe(30)
  })
  it('enforces expense title max 60', () => {
    expect(LIMITS.expenseTitle).toBe(60)
  })
})

describe('sanitizeName', () => {
  it('trims whitespace', () => {
    expect(sanitizeName('  Alice  ')).toBe('Alice')
  })
  it('strips zero-width chars', () => {
    expect(sanitizeName('Alice​')).toBe('Alice')
  })
  it('truncates to max length', () => {
    expect(sanitizeName('a'.repeat(50)).length).toBe(30)
  })
})

describe('sanitizeTitle', () => {
  it('truncates to expense title max', () => {
    expect(sanitizeTitle('a'.repeat(100)).length).toBe(60)
  })
})

describe('validateSession', () => {
  const valid = {
    v: 1,
    currency: 'USD',
    title: null,
    people: [{ id: 'p1', name: 'Alice' }],
    expenses: [],
    createdAt: new Date().toISOString(),
  }

  it('accepts a valid session', () => {
    expect(validateSession(valid).success).toBe(true)
  })

  it('rejects unknown schema version', () => {
    const result = validateSession({ ...valid, v: 99 })
    expect(result.success).toBe(false)
  })

  it('rejects person name longer than 30 chars', () => {
    const session = { ...valid, people: [{ id: 'p1', name: 'a'.repeat(31) }] }
    expect(validateSession(session).success).toBe(false)
  })

  it('rejects more than 25 people', () => {
    const people = Array.from({ length: 26 }, (_, i) => ({ id: `p${i}`, name: `P${i}` }))
    expect(validateSession({ ...valid, people }).success).toBe(false)
  })

  it('rejects more than 100 expenses', () => {
    const expenses = Array.from({ length: 101 }, (_, i) => ({
      id: `e${i}`,
      title: 'x',
      type: 'equal' as const,
      total: 10,
      paidById: 'p1',
      participantIds: ['p1'],
    }))
    expect(validateSession({ ...valid, expenses }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test, verify fail**

```bash
npm run test -- validation
```

Expected: FAIL — `validation.ts` does not exist.

- [ ] **Step 3: Write `src/lib/validation.ts`**

```ts
import { z } from 'zod'
import { SCHEMA_VERSION } from '../types'

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

const ZW_RE = /[​-‍﻿ -]/g

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
  if (result.success) return { success: true, data: result.data }
  return { success: false, error: result.error.issues[0]?.message ?? 'Invalid session' }
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
npm run test -- validation
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation.ts src/lib/validation.test.ts
git commit -m "feat: validation schemas and sanitizers with hard limits"
```

### Task 7: Currency list and format helpers

**Files:**

- Create: `src/lib/currencies.ts`, `src/lib/format.ts`, `src/lib/format.test.ts`

- [ ] **Step 1: Write `src/lib/currencies.ts`**

```ts
export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'KRW', symbol: '₩', name: 'Korean Won' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Złoty' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Đồng' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]['code']
export const DEFAULT_CURRENCY: CurrencyCode = 'USD'

export function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCIES.some((c) => c.code === value)
}
```

- [ ] **Step 2: Write `src/lib/format.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { formatMoney, formatSigned, formatDate } from './format'

describe('formatMoney', () => {
  it('formats USD with 2 decimals', () => {
    expect(formatMoney(1234.5, 'USD')).toBe('$1,234.50')
  })
  it('formats EUR', () => {
    expect(formatMoney(99, 'EUR')).toMatch(/€/)
  })
  it('formats JPY with no decimals', () => {
    expect(formatMoney(1000, 'JPY')).toMatch(/1,000/)
    expect(formatMoney(1000, 'JPY')).not.toMatch(/\./)
  })
})

describe('formatSigned', () => {
  it('positives get +', () => {
    expect(formatSigned(50, 'USD')).toMatch(/^\+/)
  })
  it('negatives get -', () => {
    expect(formatSigned(-50, 'USD')).toMatch(/^-/)
  })
  it('zero has no sign', () => {
    expect(formatSigned(0, 'USD')).not.toMatch(/^[+-]/)
  })
})

describe('formatDate', () => {
  it('formats as Mon D, YYYY', () => {
    expect(formatDate('2026-03-08T00:00:00.000Z')).toMatch(/Mar (7|8|9), 2026/)
  })
})
```

- [ ] **Step 3: Write `src/lib/format.ts`**

```ts
import type { CurrencyCode } from './currencies'

export function formatMoney(amount: number, currency: CurrencyCode): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export function formatSigned(amount: number, currency: CurrencyCode): string {
  const abs = Math.abs(amount)
  const f = formatMoney(abs, currency)
  if (amount > 0.005) return `+${f}`
  if (amount < -0.005) return `-${f}`
  return f
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
npm run test -- format
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/currencies.ts src/lib/format.ts src/lib/format.test.ts
git commit -m "feat: currency list and money/date formatters"
```

---

## Phase 3 — Pure Split Math

### Task 8: Port largest-remainder rounding helper

**Files:**

- Create: `src/lib/splits.ts`, `src/lib/splits.test.ts`

- [ ] **Step 1: Write `src/lib/splits.test.ts` — distributeByWeight cases**

```ts
import { describe, it, expect } from 'vitest'
import { distributeByWeight } from './splits'

describe('distributeByWeight', () => {
  it('splits $10 evenly into 3 with no penny loss', () => {
    const result = distributeByWeight(10, { a: 1, b: 1, c: 1 })
    const sum = Object.values(result).reduce((s, v) => s + v, 0)
    expect(sum).toBeCloseTo(10, 10)
    expect(Object.values(result).every((v) => Math.abs(v - 3.33) <= 0.01)).toBe(true)
  })

  it('proportional weights', () => {
    const result = distributeByWeight(100, { a: 1, b: 2, c: 1 })
    expect(result.a).toBe(25)
    expect(result.b).toBe(50)
    expect(result.c).toBe(25)
  })

  it('excludes zero/negative weights', () => {
    const result = distributeByWeight(100, { a: 1, b: 0, c: -5 })
    expect(result).toEqual({ a: 100 })
  })

  it('returns empty for all-zero weights', () => {
    expect(distributeByWeight(100, { a: 0, b: 0 })).toEqual({})
  })

  it('deterministic tiebreak by key', () => {
    const a = distributeByWeight(10, { z: 1, a: 1, m: 1 })
    const b = distributeByWeight(10, { a: 1, m: 1, z: 1 })
    expect(a).toEqual(b)
  })
})
```

- [ ] **Step 2: Run, verify fail**

```bash
npm run test -- splits
```

Expected: FAIL — splits.ts missing.

- [ ] **Step 3: Write `src/lib/splits.ts` with distributeByWeight**

```ts
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
```

- [ ] **Step 4: Run, verify pass**

```bash
npm run test -- splits
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/splits.ts src/lib/splits.test.ts
git commit -m "feat: largest-remainder weight distribution"
```

### Task 9: Add equal, shares, exact split functions

**Files:**

- Modify: `src/lib/splits.ts`, `src/lib/splits.test.ts`

- [ ] **Step 1: Append tests to `splits.test.ts`**

```ts
import {
  computeEqualSplit,
  computeSharesSplit,
  computeExactSplit,
  EmptySplitError,
  ExactSplitMismatchError,
} from './splits'

describe('computeEqualSplit', () => {
  it('splits 100 among 3', () => {
    const r = computeEqualSplit({ total: 100, participantKeys: ['a', 'b', 'c'] })
    expect(r.a + r.b + r.c).toBeCloseTo(100, 10)
  })
  it('throws on empty', () => {
    expect(() => computeEqualSplit({ total: 100, participantKeys: [] })).toThrow(EmptySplitError)
  })
})

describe('computeSharesSplit', () => {
  it('weights apply', () => {
    const r = computeSharesSplit({ total: 90, multipliers: { a: 1, b: 2 } })
    expect(r.a).toBe(30)
    expect(r.b).toBe(60)
  })
  it('throws when all zero', () => {
    expect(() => computeSharesSplit({ total: 100, multipliers: { a: 0, b: 0 } })).toThrow(EmptySplitError)
  })
})

describe('computeExactSplit', () => {
  it('accepts exact sum', () => {
    const r = computeExactSplit({ total: 100, amounts: { a: 60, b: 40 } })
    expect(r).toEqual({ a: 60, b: 40 })
  })
  it('throws on mismatch', () => {
    expect(() => computeExactSplit({ total: 100, amounts: { a: 60, b: 41 } })).toThrow(
      ExactSplitMismatchError
    )
  })
})
```

- [ ] **Step 2: Run, verify fail**

```bash
npm run test -- splits
```

Expected: FAIL — functions undefined.

- [ ] **Step 3: Append to `src/lib/splits.ts`**

```ts
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
```

- [ ] **Step 4: Run, verify pass**

```bash
npm run test -- splits
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/splits.ts src/lib/splits.test.ts
git commit -m "feat: equal, shares, exact split functions"
```

### Task 10: Add itemized (restaurant) split

**Files:**

- Modify: `src/lib/splits.ts`, `src/lib/splits.test.ts`

- [ ] **Step 1: Append tests**

```ts
import { computeItemizedSplit } from './splits'

describe('computeItemizedSplit', () => {
  it('splits items and prorates tax/tip', () => {
    const r = computeItemizedSplit({
      items: [
        { price: 20, assignedKeys: ['a'] },
        { price: 30, assignedKeys: ['b'] },
      ],
      tax: 5,
      tip: 10,
      serviceFee: 0,
    })
    // Total = 65. a's food: 20 (40% of 50). a gets 20 + 40% of 15 = 26.
    // b's food: 30 (60%). b gets 30 + 60% of 15 = 39.
    expect(r.a).toBeCloseTo(26, 1)
    expect(r.b).toBeCloseTo(39, 1)
    expect(r.a + r.b).toBeCloseTo(65, 10)
  })

  it('splits an item among multiple assignees per-head', () => {
    const r = computeItemizedSplit({
      items: [{ price: 30, assignedKeys: ['a', 'b', 'c'] }],
      tax: 0,
      tip: 0,
      serviceFee: 0,
    })
    expect(r.a + r.b + r.c).toBeCloseTo(30, 10)
  })

  it('ignores items with no assignees', () => {
    const r = computeItemizedSplit({
      items: [
        { price: 10, assignedKeys: ['a'] },
        { price: 50, assignedKeys: [] },
      ],
      tax: 0,
      tip: 0,
      serviceFee: 0,
    })
    expect(r).toEqual({ a: 10 })
  })
})
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Append to splits.ts**

```ts
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
```

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Commit**

```bash
git add src/lib/splits.ts src/lib/splits.test.ts
git commit -m "feat: itemized restaurant split with tax/tip proration"
```

### Task 11: Lodging split (simple + tiered)

**Files:**

- Create: `src/lib/lodging.ts`, `src/lib/lodging.test.ts`

- [ ] **Step 1: Write `src/lib/lodging.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { computeLodgingSplit } from './lodging'

describe('computeLodgingSplit — simple', () => {
  it('proportional by nights', () => {
    const r = computeLodgingSplit({
      total: 600,
      mode: 'simple',
      nights: { a: 3, b: 3 },
    })
    expect(r.a).toBe(300)
    expect(r.b).toBe(300)
  })

  it('uneven nights', () => {
    const r = computeLodgingSplit({
      total: 600,
      mode: 'simple',
      nights: { a: 4, b: 2 },
    })
    expect(r.a).toBe(400)
    expect(r.b).toBe(200)
  })

  it('penny-exact', () => {
    const r = computeLodgingSplit({
      total: 100,
      mode: 'simple',
      nights: { a: 1, b: 1, c: 1 },
    })
    const sum = Object.values(r).reduce((s, v) => s + v, 0)
    expect(sum).toBeCloseTo(100, 10)
  })

  it('excludes zero-night participants', () => {
    const r = computeLodgingSplit({
      total: 100,
      mode: 'simple',
      nights: { a: 5, b: 0 },
    })
    expect(r).toEqual({ a: 100 })
  })
})

describe('computeLodgingSplit — tiered', () => {
  it('weights by room rate × nights', () => {
    const r = computeLodgingSplit({
      total: 600,
      mode: 'tiered',
      nights: { a: 3, b: 3 },
      rooms: [
        { id: 'r1', name: 'Master', nightlyRate: 200 },
        { id: 'r2', name: 'Twin', nightlyRate: 100 },
      ],
      assignments: { a: 'r1', b: 'r2' },
    })
    // a: 200*3=600 weight, b: 100*3=300 weight, total=900. a's share=600*(600/900)=400, b=200
    expect(r.a).toBe(400)
    expect(r.b).toBe(200)
  })

  it('prorates discrepancy when room totals do not equal total', () => {
    const r = computeLodgingSplit({
      total: 1000, // includes cleaning fee
      mode: 'tiered',
      nights: { a: 3, b: 3 },
      rooms: [
        { id: 'r1', name: 'Master', nightlyRate: 200 },
        { id: 'r2', name: 'Twin', nightlyRate: 100 },
      ],
      assignments: { a: 'r1', b: 'r2' },
    })
    // weights: a=600, b=300. total=1000. a gets 666.67, b gets 333.33
    expect(r.a + r.b).toBeCloseTo(1000, 10)
    expect(r.a).toBeGreaterThan(r.b)
  })

  it('falls back to simple if any assignment missing', () => {
    const r = computeLodgingSplit({
      total: 100,
      mode: 'tiered',
      nights: { a: 1, b: 1 },
      rooms: [{ id: 'r1', name: 'Master', nightlyRate: 100 }],
      assignments: { a: 'r1' },
    })
    // b has no room assignment → falls back to nights-only
    expect(r.a + r.b).toBeCloseTo(100, 10)
  })
})
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Write `src/lib/lodging.ts`**

```ts
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
```

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Commit**

```bash
git add src/lib/lodging.ts src/lib/lodging.test.ts
git commit -m "feat: lodging split simple + tiered"
```

### Task 12: Compute balances and simplify debts

**Files:**

- Create: `src/lib/compute-balances.ts`, `src/lib/simplify-debts.ts`, plus tests

- [ ] **Step 1: Write `src/lib/compute-balances.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { computeBalances } from './compute-balances'
import type { Expense, Person } from '../types'

const people: Person[] = [
  { id: 'a', name: 'Alice' },
  { id: 'b', name: 'Bob' },
]

describe('computeBalances', () => {
  it('one expense — payer owed nothing, others owe', () => {
    const expenses: Expense[] = [
      { id: 'e1', type: 'equal', title: 'd', total: 100, paidById: 'a', participantIds: ['a', 'b'] },
    ]
    const r = computeBalances(people, expenses)
    expect(r.find((b) => b.memberId === 'a')!.net).toBeCloseTo(50, 2)
    expect(r.find((b) => b.memberId === 'b')!.net).toBeCloseTo(-50, 2)
  })

  it('zero net when alice pays for bob and bob pays for alice equally', () => {
    const expenses: Expense[] = [
      { id: 'e1', type: 'equal', title: 'd', total: 50, paidById: 'a', participantIds: ['a', 'b'] },
      { id: 'e2', type: 'equal', title: 'd', total: 50, paidById: 'b', participantIds: ['a', 'b'] },
    ]
    const r = computeBalances(people, expenses)
    expect(r.find((b) => b.memberId === 'a')!.net).toBeCloseTo(0, 2)
    expect(r.find((b) => b.memberId === 'b')!.net).toBeCloseTo(0, 2)
  })
})
```

- [ ] **Step 2: Write `src/lib/compute-balances.ts`**

```ts
import type { Expense, Person } from '../types'
import {
  computeEqualSplit,
  computeSharesSplit,
  computeExactSplit,
  computeItemizedSplit,
  type SplitResult,
} from './splits'
import { computeLodgingSplit } from './lodging'

export interface MemberBalance {
  memberId: string
  name: string
  net: number
}

export function computeExpenseSplits(expense: Expense): SplitResult {
  switch (expense.type) {
    case 'equal':
      return computeEqualSplit({ total: expense.total, participantKeys: expense.participantIds })
    case 'shares':
      return computeSharesSplit({ total: expense.total, multipliers: expense.shares })
    case 'exact':
      return computeExactSplit({ total: expense.total, amounts: expense.amounts })
    case 'mileage':
      return computeSharesSplit({ total: expense.total, multipliers: expense.units })
    case 'restaurant':
      return computeItemizedSplit({
        items: expense.items.map((i) => ({ price: i.price, assignedKeys: i.assignedIds })),
        tax: expense.tax,
        tip: expense.tip,
        serviceFee: expense.serviceFee,
      })
    case 'lodging':
      return computeLodgingSplit({
        total: expense.total,
        mode: expense.mode,
        nights: expense.nights,
        rooms: expense.rooms,
        assignments: expense.assignments,
      })
  }
}

function expenseTotal(expense: Expense): number {
  if (expense.type === 'restaurant') {
    return expense.items.reduce((s, i) => s + i.price, 0) + expense.tax + expense.tip + expense.serviceFee
  }
  return expense.total
}

export function computeBalances(people: Person[], expenses: Expense[]): MemberBalance[] {
  const paid: Record<string, number> = {}
  const owed: Record<string, number> = {}
  for (const p of people) {
    paid[p.id] = 0
    owed[p.id] = 0
  }
  for (const e of expenses) {
    paid[e.paidById] = (paid[e.paidById] ?? 0) + expenseTotal(e)
    try {
      const splits = computeExpenseSplits(e)
      for (const [personId, amount] of Object.entries(splits)) {
        owed[personId] = (owed[personId] ?? 0) + amount
      }
    } catch {
      // skip expenses that fail to compute (e.g. mid-edit exact mismatch)
    }
  }
  return people
    .map((p) => ({ memberId: p.id, name: p.name, net: (paid[p.id] ?? 0) - (owed[p.id] ?? 0) }))
    .filter((b) => Math.abs(b.net) > 0.005)
}
```

- [ ] **Step 3: Write `src/lib/simplify-debts.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { simplifyDebts } from './simplify-debts'

describe('simplifyDebts', () => {
  it('two-person settlement', () => {
    const r = simplifyDebts([
      { memberId: 'a', name: 'A', net: 50 },
      { memberId: 'b', name: 'B', net: -50 },
    ])
    expect(r).toEqual([{ fromMemberId: 'b', fromName: 'B', toMemberId: 'a', toName: 'A', amount: 50 }])
  })

  it('three-person reduces to 2 transactions', () => {
    const r = simplifyDebts([
      { memberId: 'a', name: 'A', net: 60 },
      { memberId: 'b', name: 'B', net: -40 },
      { memberId: 'c', name: 'C', net: -20 },
    ])
    expect(r.length).toBe(2)
    expect(r.every((t) => t.toMemberId === 'a')).toBe(true)
  })
})
```

- [ ] **Step 4: Write `src/lib/simplify-debts.ts`**

```ts
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
```

- [ ] **Step 5: Run all tests, verify pass**

```bash
npm run test
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/compute-balances.ts src/lib/compute-balances.test.ts src/lib/simplify-debts.ts src/lib/simplify-debts.test.ts
git commit -m "feat: balance computation and debt simplification"
```

---

## Phase 4 — Store, URL Sharing, Shell

### Task 13: Zustand session store with localStorage

**Files:**

- Create: `src/store/session.ts`, `src/store/session.test.ts`

- [ ] **Step 1: Write `src/store/session.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useSession, resetSession } from './session'

describe('session store', () => {
  beforeEach(() => {
    localStorage.clear()
    resetSession()
  })

  it('starts with empty people and expenses', () => {
    const s = useSession.getState()
    expect(s.people).toEqual([])
    expect(s.expenses).toEqual([])
  })

  it('adds people', () => {
    useSession.getState().addPerson('Alice')
    expect(useSession.getState().people).toHaveLength(1)
    expect(useSession.getState().people[0].name).toBe('Alice')
  })

  it('removes person and cleans up references in equal expense', () => {
    useSession.getState().addPerson('Alice')
    useSession.getState().addPerson('Bob')
    const ids = useSession.getState().people.map((p) => p.id)
    useSession.getState().addExpense({
      type: 'equal',
      title: 'Dinner',
      total: 50,
      paidById: ids[0],
      participantIds: ids,
    })
    useSession.getState().removePerson(ids[1])
    const exp = useSession.getState().expenses[0]
    expect(exp.type).toBe('equal')
    if (exp.type === 'equal') {
      expect(exp.participantIds).not.toContain(ids[1])
    }
  })

  it('rejects over-limit name length', () => {
    const long = 'a'.repeat(100)
    useSession.getState().addPerson(long)
    expect(useSession.getState().people[0].name.length).toBe(30)
  })
})
```

- [ ] **Step 2: Write `src/store/session.ts`**

```ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { SCHEMA_VERSION, type Expense, type Person, type Session } from '../types'
import {
  sanitizeName,
  sanitizeTitle,
  sanitizeItemName,
  sanitizeUnitLabel,
  sanitizeSessionTitle,
  LIMITS,
} from '../lib/validation'
import { DEFAULT_CURRENCY } from '../lib/currencies'

function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function freshSession(): Session {
  return {
    v: SCHEMA_VERSION,
    currency: DEFAULT_CURRENCY,
    title: null,
    people: [],
    expenses: [],
    createdAt: new Date().toISOString(),
  }
}

type SessionStore = Session & {
  addPerson: (name: string) => void
  renamePerson: (id: string, name: string) => void
  removePerson: (id: string) => void
  setCurrency: (code: string) => void
  setTitle: (title: string) => void
  addExpense: (input: Omit<Expense, 'id'>) => string
  updateExpense: (id: string, patch: Partial<Expense>) => void
  removeExpense: (id: string) => void
  replaceSession: (next: Session) => void
  reset: () => void
}

function cleanupExpenseAfterPersonRemoval(expense: Expense, removedId: string): Expense | null {
  if (expense.paidById === removedId) return null
  switch (expense.type) {
    case 'equal':
      return { ...expense, participantIds: expense.participantIds.filter((id) => id !== removedId) }
    case 'shares': {
      const { [removedId]: _, ...rest } = expense.shares
      return { ...expense, shares: rest }
    }
    case 'exact': {
      const { [removedId]: _, ...rest } = expense.amounts
      return { ...expense, amounts: rest }
    }
    case 'mileage': {
      const { [removedId]: _, ...rest } = expense.units
      return { ...expense, units: rest }
    }
    case 'restaurant':
      return {
        ...expense,
        items: expense.items.map((i) => ({
          ...i,
          assignedIds: i.assignedIds.filter((id) => id !== removedId),
        })),
      }
    case 'lodging': {
      const { [removedId]: _, ...restNights } = expense.nights
      const { [removedId]: __, ...restAssignments } = expense.assignments ?? {}
      return { ...expense, nights: restNights, assignments: restAssignments }
    }
  }
}

export const useSession = create<SessionStore>()(
  persist(
    (set, get) => ({
      ...freshSession(),

      addPerson: (name) => {
        const sanitized = sanitizeName(name)
        if (!sanitized) return
        if (get().people.length >= LIMITS.maxPeople) return
        set({ people: [...get().people, { id: newId('p'), name: sanitized }] })
      },

      renamePerson: (id, name) => {
        const sanitized = sanitizeName(name)
        if (!sanitized) return
        set({ people: get().people.map((p) => (p.id === id ? { ...p, name: sanitized } : p)) })
      },

      removePerson: (id) => {
        const next: Expense[] = []
        for (const e of get().expenses) {
          const cleaned = cleanupExpenseAfterPersonRemoval(e, id)
          if (cleaned) next.push(cleaned)
        }
        set({ people: get().people.filter((p) => p.id !== id), expenses: next })
      },

      setCurrency: (code) => set({ currency: code }),

      setTitle: (title) => set({ title: sanitizeSessionTitle(title) || null }),

      addExpense: (input) => {
        if (get().expenses.length >= LIMITS.maxExpenses) return ''
        const id = newId('e')
        const sanitized: Expense = { ...input, id, title: sanitizeTitle(input.title) } as Expense
        if (sanitized.type === 'restaurant') {
          sanitized.items = sanitized.items.map((i) => ({ ...i, name: sanitizeItemName(i.name) }))
        }
        if (sanitized.type === 'mileage') {
          sanitized.unitLabel = sanitizeUnitLabel(sanitized.unitLabel)
        }
        set({ expenses: [...get().expenses, sanitized] })
        return id
      },

      updateExpense: (id, patch) => {
        set({
          expenses: get().expenses.map((e) => {
            if (e.id !== id) return e
            const merged = { ...e, ...patch } as Expense
            if (patch.title !== undefined) merged.title = sanitizeTitle(patch.title)
            return merged
          }),
        })
      },

      removeExpense: (id) => set({ expenses: get().expenses.filter((e) => e.id !== id) }),

      replaceSession: (next) => set({ ...next }),

      reset: () => set({ ...freshSession() }),
    }),
    {
      name: 'expense-calculator-session',
      storage: createJSONStorage(() => localStorage),
      version: SCHEMA_VERSION,
    }
  )
)

export function resetSession(): void {
  useSession.getState().reset()
}
```

- [ ] **Step 3: Run, verify pass**

```bash
npm run test -- session
```

- [ ] **Step 4: Commit**

```bash
git add src/store/session.ts src/store/session.test.ts
git commit -m "feat: zustand session store with localStorage persistence"
```

### Task 14: URL share encode/decode

**Files:**

- Create: `src/lib/url-share.ts`, `src/lib/url-share.test.ts`

- [ ] **Step 1: Write `src/lib/url-share.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { encodeSession, decodeShareHash, URL_WARN_LENGTH } from './url-share'
import { SCHEMA_VERSION, type Session } from '../types'

const fixture: Session = {
  v: SCHEMA_VERSION,
  currency: 'USD',
  title: 'Tahoe',
  people: [{ id: 'p1', name: 'Alice' }],
  expenses: [
    {
      id: 'e1',
      type: 'equal',
      title: 'Gas',
      total: 50,
      paidById: 'p1',
      participantIds: ['p1'],
    },
  ],
  createdAt: '2026-03-08T00:00:00.000Z',
}

describe('encodeSession / decodeShareHash', () => {
  it('round-trips a session', () => {
    const encoded = encodeSession(fixture)
    const result = decodeShareHash(`#d=${encoded}`)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.session).toEqual(fixture)
  })

  it('produces a URL-safe payload (no + / =)', () => {
    const encoded = encodeSession(fixture)
    expect(encoded).not.toMatch(/[+/=]/)
  })

  it('decodes #d= prefix', () => {
    const encoded = encodeSession(fixture)
    expect(decodeShareHash(`#d=${encoded}`).ok).toBe(true)
  })

  it('returns ok:false for malformed hash', () => {
    expect(decodeShareHash('#d=notvalid').ok).toBe(false)
  })

  it('returns ok:false for missing prefix', () => {
    expect(decodeShareHash('#other=abc').ok).toBe(false)
  })

  it('rejects wrong schema version', () => {
    const old = encodeSession({ ...fixture, v: 99 as 1 })
    expect(decodeShareHash(`#d=${old}`).ok).toBe(false)
  })

  it('exposes a length-warning threshold', () => {
    expect(URL_WARN_LENGTH).toBe(2000)
  })
})
```

- [ ] **Step 2: Write `src/lib/url-share.ts`**

```ts
import { deflate, inflate } from 'pako'
import { type Session } from '../types'
import { validateSession } from './validation'

export const URL_WARN_LENGTH = 2000
const HASH_PREFIX = '#d='

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

export function encodeSession(session: Session): string {
  const json = JSON.stringify(session)
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
    const result = validateSession(parsed)
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
```

- [ ] **Step 3: Run, verify pass**

```bash
npm run test -- url-share
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/url-share.ts src/lib/url-share.test.ts
git commit -m "feat: URL share encode/decode with pako gzip"
```

### Task 15: UI primitives — Button, Input, Sheet, Dialog

**Files:**

- Create: `src/components/ui/Button.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/Sheet.tsx`, `src/components/ui/Dialog.tsx`, `src/components/ui/index.ts`

- [ ] **Step 1: Write `Button.tsx`**

```tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-[--color-accent] text-white hover:opacity-90 disabled:opacity-50',
  ghost: 'bg-transparent text-[--color-ink] hover:bg-[--color-border] disabled:opacity-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-md',
  md: 'h-10 px-4 text-sm rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 font-medium transition-opacity ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
```

- [ ] **Step 2: Write `Input.tsx`**

```tsx
import { forwardRef, type InputHTMLAttributes } from 'react'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`h-10 w-full rounded-lg border bg-[--color-surface] px-3 text-sm text-[--color-ink] outline-none transition-colors ${
          invalid ? 'border-red-500' : 'border-[--color-border] focus:border-[--color-accent]'
        } ${className}`}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'
```

- [ ] **Step 3: Write `Sheet.tsx`**

```tsx
import { AnimatePresence, motion } from 'framer-motion'
import { type ReactNode, useEffect } from 'react'

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-[--color-surface] p-5 shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[28rem] md:rounded-l-2xl md:rounded-tr-none"
          >
            <h2 className="mb-4 text-lg font-semibold">{title}</h2>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 4: Write `Dialog.tsx`**

```tsx
import { AnimatePresence, motion } from 'framer-motion'
import { type ReactNode } from 'react'

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 z-50 w-[min(28rem,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[--color-surface] p-6 shadow-2xl"
          >
            <h2 className="mb-3 text-lg font-semibold">{title}</h2>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 5: Write `src/components/ui/index.ts`**

```ts
export * from './Button'
export * from './Input'
export * from './Sheet'
export * from './Dialog'
```

- [ ] **Step 6: Verify build**

```bash
npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add src/components/ui
git commit -m "feat: UI primitives — Button, Input, Sheet, Dialog"
```

---

## Phase 5 — App Shell, People, Bento Layout

### Task 16: App shell + header + bento grid

**Files:**

- Modify: `src/App.tsx`, `src/main.tsx`
- Create: `src/components/Header.tsx`

- [ ] **Step 1: Write `src/components/Header.tsx`**

```tsx
import { useSession } from '../store/session'
import { CURRENCIES } from '../lib/currencies'
import { Button } from './ui'

export function Header({
  onOpenSummary,
  onOpenShare,
}: {
  onOpenSummary: () => void
  onOpenShare: () => void
}) {
  const currency = useSession((s) => s.currency)
  const setCurrency = useSession((s) => s.setCurrency)
  return (
    <header className="flex items-center justify-between gap-3 border-b border-[--color-border] px-4 py-3 md:px-6">
      <h1 className="text-lg font-semibold tracking-tight md:text-xl">Expense Calculator</h1>
      <div className="flex items-center gap-2">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="h-9 rounded-md border border-[--color-border] bg-[--color-surface] px-2 text-sm"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code}
            </option>
          ))}
        </select>
        <Button variant="ghost" size="sm" onClick={onOpenSummary}>
          Summary
        </Button>
        <Button size="sm" onClick={onOpenShare}>
          Share
        </Button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Replace `src/App.tsx`**

```tsx
import { useState } from 'react'
import { Header } from './components/Header'

export default function App() {
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  return (
    <div className="min-h-dvh bg-[--color-bg] text-[--color-ink]">
      <Header onOpenSummary={() => setSummaryOpen(true)} onOpenShare={() => setShareOpen(true)} />
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <section className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-4">
            People (placeholder)
          </section>
          <section className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-4">
            Balances (placeholder)
          </section>
          <section className="rounded-2xl border border-[--color-border] bg-[--color-surface] p-4">
            Settle Up (placeholder)
          </section>
          <section className="md:col-span-3 rounded-2xl border border-[--color-border] bg-[--color-surface] p-4">
            Expenses (placeholder)
          </section>
        </div>
      </main>
      {summaryOpen && <div onClick={() => setSummaryOpen(false)}>Summary placeholder</div>}
      {shareOpen && <div onClick={() => setShareOpen(false)}>Share placeholder</div>}
    </div>
  )
}
```

- [ ] **Step 3: Replace `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 4: Run dev server, visually verify**

```bash
npm run dev
```

Open `http://localhost:5173/expense-calculator/` and confirm header + 4 placeholder panels render in a responsive bento layout.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/main.tsx src/components/Header.tsx
git commit -m "feat: app shell with header and bento grid placeholders"
```

### Task 17: People panel

**Files:**

- Create: `src/components/PeoplePanel.tsx`, `src/components/PeoplePanel.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write `PeoplePanel.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PeoplePanel } from './PeoplePanel'
import { resetSession } from '../store/session'

beforeEach(() => {
  localStorage.clear()
  resetSession()
})

describe('PeoplePanel', () => {
  it('adds a person', async () => {
    render(<PeoplePanel />)
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText(/add a name/i), 'Alice')
    await user.click(screen.getByRole('button', { name: /add/i }))
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('removes a person', async () => {
    render(<PeoplePanel />)
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText(/add a name/i), 'Alice')
    await user.click(screen.getByRole('button', { name: /add/i }))
    await user.click(screen.getByRole('button', { name: /remove Alice/i }))
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  })

  it('disables add when at max', async () => {
    const { addPerson } = (await import('../store/session')).useSession.getState()
    for (let i = 0; i < 25; i++) addPerson(`P${i}`)
    render(<PeoplePanel />)
    expect(screen.getByRole('button', { name: /add/i })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Write `PeoplePanel.tsx`**

```tsx
import { useState } from 'react'
import { Trash2, UserPlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from '../store/session'
import { LIMITS } from '../lib/validation'
import { Button, Input } from './ui'

export function PeoplePanel() {
  const people = useSession((s) => s.people)
  const addPerson = useSession((s) => s.addPerson)
  const removePerson = useSession((s) => s.removePerson)
  const [name, setName] = useState('')

  const atMax = people.length >= LIMITS.maxPeople

  const submit = () => {
    if (!name.trim() || atMax) return
    addPerson(name)
    setName('')
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[--color-border] bg-[--color-surface] p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">
          People <span className="text-[--color-muted]">({people.length})</span>
        </h2>
      </div>
      <ul className="flex flex-col gap-1">
        <AnimatePresence initial={false}>
          {people.map((p) => (
            <motion.li
              key={p.id}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-[--color-border]/30"
            >
              <span className="truncate">{p.name}</span>
              <button
                aria-label={`remove ${p.name}`}
                onClick={() => removePerson(p.id)}
                className="text-[--color-muted] hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex gap-2"
      >
        <Input
          placeholder="Add a name"
          maxLength={LIMITS.personName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={atMax}
        />
        <Button type="submit" size="md" disabled={atMax || !name.trim()}>
          <UserPlus className="size-4" /> Add
        </Button>
      </form>
      {atMax && <p className="text-xs text-[--color-muted]">Limit of {LIMITS.maxPeople} people reached.</p>}
    </section>
  )
}
```

- [ ] **Step 3: Replace the placeholder in `App.tsx`**

In `App.tsx`, replace `<section ...>People (placeholder)</section>` with `<PeoplePanel />` and import it.

- [ ] **Step 4: Run tests, verify pass**

```bash
npm run test -- PeoplePanel
```

- [ ] **Step 5: Commit**

```bash
git add src/components/PeoplePanel.tsx src/components/PeoplePanel.test.tsx src/App.tsx
git commit -m "feat: People panel — add, remove, animated list"
```

---

## Phase 6 — Expense Forms

### Task 18: Expense list + add-expense sheet shell + mode picker

**Files:**

- Create: `src/components/ExpensesPanel.tsx`, `src/components/expense-forms/ModePicker.tsx`, `src/components/expense-forms/ExpenseSheet.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write `ModePicker.tsx`**

```tsx
import { Equal, Hash, Receipt, Bed, Car, X } from 'lucide-react'
import type { ExpenseType } from '../../types'

const MODES: Array<{
  type: ExpenseType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { type: 'equal', label: 'Equal', description: 'Even split among selected people', icon: Equal },
  { type: 'shares', label: 'Shares', description: 'Proportional weights (e.g. 2:1:1)', icon: X },
  { type: 'exact', label: 'Exact', description: "Manually enter each person's amount", icon: Hash },
  { type: 'mileage', label: 'Mileage', description: 'Split by miles, hours, or other units', icon: Car },
  { type: 'restaurant', label: 'Restaurant', description: 'Itemized bill with tax & tip', icon: Receipt },
  { type: 'lodging', label: 'Lodging', description: 'Airbnb/hotel by nights and rooms', icon: Bed },
]

export function ModePicker({ onPick }: { onPick: (type: ExpenseType) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {MODES.map(({ type, label, description, icon: Icon }) => (
        <button
          key={type}
          onClick={() => onPick(type)}
          className="flex flex-col items-start gap-1 rounded-xl border border-[--color-border] bg-[--color-surface] p-3 text-left transition-colors hover:border-[--color-accent]"
        >
          <Icon className="size-5 text-[--color-accent]" />
          <span className="font-medium text-sm">{label}</span>
          <span className="text-xs text-[--color-muted]">{description}</span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Write `ExpenseSheet.tsx`**

```tsx
import { useState } from 'react'
import { Sheet } from '../ui'
import { ModePicker } from './ModePicker'
import { EqualForm } from './EqualForm'
import { SharesForm } from './SharesForm'
import { ExactForm } from './ExactForm'
import { MileageForm } from './MileageForm'
import { RestaurantForm } from './RestaurantForm'
import { LodgingForm } from './LodgingForm'
import type { Expense, ExpenseType } from '../../types'

export function ExpenseSheet({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: Expense | null
}) {
  const [type, setType] = useState<ExpenseType | null>(null)

  const activeType = editing?.type ?? type
  const title = editing ? 'Edit expense' : activeType ? `New ${activeType} expense` : 'New expense'

  function done() {
    setType(null)
    onClose()
  }

  return (
    <Sheet open={open} onClose={done} title={title}>
      {!activeType && <ModePicker onPick={setType} />}
      {activeType === 'equal' && <EqualForm editing={editing as Expense | null} onDone={done} />}
      {activeType === 'shares' && <SharesForm editing={editing as Expense | null} onDone={done} />}
      {activeType === 'exact' && <ExactForm editing={editing as Expense | null} onDone={done} />}
      {activeType === 'mileage' && <MileageForm editing={editing as Expense | null} onDone={done} />}
      {activeType === 'restaurant' && <RestaurantForm editing={editing as Expense | null} onDone={done} />}
      {activeType === 'lodging' && <LodgingForm editing={editing as Expense | null} onDone={done} />}
    </Sheet>
  )
}
```

(Form imports will be added in next tasks — for now create stub files so this compiles.)

- [ ] **Step 3: Create stub form files**

For each of `EqualForm.tsx`, `SharesForm.tsx`, `ExactForm.tsx`, `MileageForm.tsx`, `RestaurantForm.tsx`, `LodgingForm.tsx`, create a stub at `src/components/expense-forms/<Name>.tsx`:

```tsx
import type { Expense } from '../../types'
export function EqualForm({ editing: _e, onDone }: { editing: Expense | null; onDone: () => void }) {
  return (
    <div>
      <button onClick={onDone}>cancel</button>
    </div>
  )
}
```

Rename `EqualForm` to match each filename.

- [ ] **Step 4: Write `ExpensesPanel.tsx`**

```tsx
import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from '../store/session'
import { Button } from './ui'
import { ExpenseSheet } from './expense-forms/ExpenseSheet'
import type { Expense } from '../types'
import { formatMoney } from '../lib/format'
import { expenseTotal } from '../types'
import { LIMITS } from '../lib/validation'

const TYPE_LABELS: Record<Expense['type'], string> = {
  equal: 'equal',
  shares: 'shares',
  exact: 'exact',
  mileage: 'mileage',
  restaurant: 'itemized',
  lodging: 'lodging',
}

export function ExpensesPanel() {
  const expenses = useSession((s) => s.expenses)
  const currency = useSession((s) => s.currency)
  const removeExpense = useSession((s) => s.removeExpense)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)

  const atMax = expenses.length >= LIMITS.maxExpenses

  function openNew() {
    setEditing(null)
    setOpen(true)
  }
  function openEdit(e: Expense) {
    setEditing(e)
    setOpen(true)
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[--color-border] bg-[--color-surface] p-4 md:col-span-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">
          Expenses <span className="text-[--color-muted]">({expenses.length})</span>
        </h2>
        <Button size="sm" onClick={openNew} disabled={atMax}>
          <Plus className="size-4" /> Add expense
        </Button>
      </div>
      <ul className="flex flex-col gap-1">
        <AnimatePresence initial={false}>
          {expenses.map((e) => (
            <motion.li
              key={e.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-[--color-border]/30"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{e.title}</div>
                <div className="text-xs text-[--color-muted]">{TYPE_LABELS[e.type]}</div>
              </div>
              <div className="ml-3 font-mono tabular-nums">
                {formatMoney(expenseTotal(e), currency as 'USD')}
              </div>
              <div className="ml-3 flex gap-1">
                <button
                  onClick={() => openEdit(e)}
                  className="text-[--color-muted] hover:text-[--color-ink]"
                  aria-label={`edit ${e.title}`}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => removeExpense(e.id)}
                  className="text-[--color-muted] hover:text-red-600"
                  aria-label={`delete ${e.title}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {expenses.length === 0 && (
        <p className="text-sm text-[--color-muted]">No expenses yet. Add your first one.</p>
      )}
      <ExpenseSheet open={open} onClose={() => setOpen(false)} editing={editing} />
    </section>
  )
}
```

- [ ] **Step 5: Wire into `App.tsx`**

Replace the Expenses placeholder with `<ExpensesPanel />`.

- [ ] **Step 6: Verify typecheck + dev server**

```bash
npm run typecheck
npm run dev
```

Confirm clicking "Add expense" opens the mode-picker sheet.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: expenses list panel + mode-picker sheet shell"
```

### Task 19: EqualForm

**Files:**

- Replace stub: `src/components/expense-forms/EqualForm.tsx`
- Create: `src/components/expense-forms/EqualForm.test.tsx`
- Create: `src/components/expense-forms/form-utils.ts`

- [ ] **Step 1: Write `form-utils.ts`**

```ts
import { useSession } from '../../store/session'
import { useMemo } from 'react'

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

export function useDefaultPayerId() {
  const people = usePeople()
  return useMemo(() => people[0]?.id ?? '', [people])
}
```

- [ ] **Step 2: Write `EqualForm.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EqualForm } from './EqualForm'
import { resetSession, useSession } from '../../store/session'

beforeEach(() => {
  localStorage.clear()
  resetSession()
  const s = useSession.getState()
  s.addPerson('Alice')
  s.addPerson('Bob')
})

describe('EqualForm', () => {
  it('creates an equal expense', async () => {
    const user = userEvent.setup()
    render(<EqualForm editing={null} onDone={() => {}} />)
    await user.type(screen.getByLabelText(/title/i), 'Dinner')
    await user.clear(screen.getByLabelText(/total/i))
    await user.type(screen.getByLabelText(/total/i), '100')
    await user.click(screen.getByRole('button', { name: /save/i }))
    const expenses = useSession.getState().expenses
    expect(expenses).toHaveLength(1)
    expect(expenses[0].type).toBe('equal')
    expect(expenses[0].total).toBe(100)
  })

  it('requires title and total', async () => {
    const user = userEvent.setup()
    render(<EqualForm editing={null} onDone={() => {}} />)
    const save = screen.getByRole('button', { name: /save/i })
    await user.click(save)
    expect(useSession.getState().expenses).toHaveLength(0)
  })
})
```

- [ ] **Step 3: Write `EqualForm.tsx`**

```tsx
import { useState } from 'react'
import { Button, Input } from '../ui'
import { useSession } from '../../store/session'
import { LIMITS } from '../../lib/validation'
import { usePeople, parseMoney, clampMoney } from './form-utils'
import type { Expense, EqualExpense } from '../../types'

export function EqualForm({ editing, onDone }: { editing: Expense | null; onDone: () => void }) {
  const people = usePeople()
  const addExpense = useSession((s) => s.addExpense)
  const updateExpense = useSession((s) => s.updateExpense)
  const initial = editing && editing.type === 'equal' ? (editing as EqualExpense) : null

  const [title, setTitle] = useState(initial?.title ?? '')
  const [total, setTotal] = useState<string>(initial?.total != null ? String(initial.total) : '')
  const [paidById, setPaidById] = useState(initial?.paidById ?? people[0]?.id ?? '')
  const [participantIds, setParticipantIds] = useState<string[]>(
    initial?.participantIds ?? people.map((p) => p.id)
  )

  function toggle(id: string) {
    setParticipantIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  function save() {
    const amount = clampMoney(parseMoney(total))
    if (!title.trim() || amount <= 0 || !paidById || participantIds.length === 0) return
    if (initial) {
      updateExpense(initial.id, { title, total: amount, paidById, participantIds })
    } else {
      addExpense({ type: 'equal', title, total: amount, paidById, participantIds })
    }
    onDone()
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Title
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={LIMITS.expenseTitle} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Total
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          max={LIMITS.moneyMax}
          step={0.01}
          value={total}
          onChange={(e) => setTotal(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Paid by
        <select
          value={paidById}
          onChange={(e) => setPaidById(e.target.value)}
          className="h-10 rounded-lg border border-[--color-border] bg-[--color-surface] px-3 text-sm"
        >
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="text-[--color-muted]">Split between</legend>
        {people.map((p) => (
          <label key={p.id} className="flex items-center gap-2">
            <input type="checkbox" checked={participantIds.includes(p.id)} onChange={() => toggle(p.id)} />
            {p.name}
          </label>
        ))}
      </fieldset>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={save}>Save</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
npm run test -- EqualForm
```

- [ ] **Step 5: Commit**

```bash
git add src/components/expense-forms/EqualForm.tsx src/components/expense-forms/EqualForm.test.tsx src/components/expense-forms/form-utils.ts
git commit -m "feat: EqualForm with validation"
```

### Task 20: SharesForm

**Files:**

- Replace stub: `src/components/expense-forms/SharesForm.tsx`
- Create: `src/components/expense-forms/SharesForm.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SharesForm } from './SharesForm'
import { resetSession, useSession } from '../../store/session'

beforeEach(() => {
  localStorage.clear()
  resetSession()
  const s = useSession.getState()
  s.addPerson('Alice')
  s.addPerson('Bob')
})

describe('SharesForm', () => {
  it('creates a shares expense with multipliers', async () => {
    const user = userEvent.setup()
    render(<SharesForm editing={null} onDone={() => {}} />)
    await user.type(screen.getByLabelText(/title/i), 'Groceries')
    await user.clear(screen.getByLabelText(/total/i))
    await user.type(screen.getByLabelText(/total/i), '90')
    const shareInputs = screen.getAllByLabelText(/shares for/i)
    await user.clear(shareInputs[0])
    await user.type(shareInputs[0], '2')
    await user.clear(shareInputs[1])
    await user.type(shareInputs[1], '1')
    await user.click(screen.getByRole('button', { name: /save/i }))
    const exp = useSession.getState().expenses[0]
    expect(exp.type).toBe('shares')
    if (exp.type === 'shares') {
      expect(Object.values(exp.shares).reduce((s, v) => s + v, 0)).toBe(3)
    }
  })
})
```

- [ ] **Step 2: Write `SharesForm.tsx`**

```tsx
import { useState } from 'react'
import { Button, Input } from '../ui'
import { useSession } from '../../store/session'
import { LIMITS } from '../../lib/validation'
import { usePeople, parseMoney, clampMoney } from './form-utils'
import type { Expense, SharesExpense } from '../../types'

export function SharesForm({ editing, onDone }: { editing: Expense | null; onDone: () => void }) {
  const people = usePeople()
  const addExpense = useSession((s) => s.addExpense)
  const updateExpense = useSession((s) => s.updateExpense)
  const initial = editing?.type === 'shares' ? (editing as SharesExpense) : null

  const [title, setTitle] = useState(initial?.title ?? '')
  const [total, setTotal] = useState<string>(initial?.total != null ? String(initial.total) : '')
  const [paidById, setPaidById] = useState(initial?.paidById ?? people[0]?.id ?? '')
  const [shares, setShares] = useState<Record<string, string>>(() => {
    const obj: Record<string, string> = {}
    for (const p of people) obj[p.id] = String(initial?.shares?.[p.id] ?? 1)
    return obj
  })

  function save() {
    const amount = clampMoney(parseMoney(total))
    const parsedShares: Record<string, number> = {}
    for (const [id, v] of Object.entries(shares)) {
      const n = Number(v)
      if (Number.isFinite(n) && n > 0) parsedShares[id] = Math.min(n, LIMITS.sharesMax)
    }
    if (!title.trim() || amount <= 0 || Object.keys(parsedShares).length === 0) return
    if (initial) {
      updateExpense(initial.id, { title, total: amount, paidById, shares: parsedShares })
    } else {
      addExpense({ type: 'shares', title, total: amount, paidById, shares: parsedShares })
    }
    onDone()
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Title
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={LIMITS.expenseTitle} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Total
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          max={LIMITS.moneyMax}
          step={0.01}
          value={total}
          onChange={(e) => setTotal(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Paid by
        <select
          value={paidById}
          onChange={(e) => setPaidById(e.target.value)}
          className="h-10 rounded-lg border border-[--color-border] bg-[--color-surface] px-3 text-sm"
        >
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-col gap-2 text-sm">
        <span className="text-[--color-muted]">Shares per person</span>
        {people.map((p) => (
          <label key={p.id} className="flex items-center gap-2">
            <span className="flex-1">{p.name}</span>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              max={LIMITS.sharesMax}
              step={0.5}
              aria-label={`shares for ${p.name}`}
              value={shares[p.id] ?? '0'}
              onChange={(e) => setShares({ ...shares, [p.id]: e.target.value })}
              className="w-20"
            />
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={save}>Save</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run, verify pass; commit**

```bash
npm run test -- SharesForm
git add -A
git commit -m "feat: SharesForm"
```

### Task 21: ExactForm with live delta

**Files:**

- Replace stub: `src/components/expense-forms/ExactForm.tsx`
- Create: `src/components/expense-forms/ExactForm.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExactForm } from './ExactForm'
import { resetSession, useSession } from '../../store/session'

beforeEach(() => {
  localStorage.clear()
  resetSession()
  const s = useSession.getState()
  s.addPerson('Alice')
  s.addPerson('Bob')
})

describe('ExactForm', () => {
  it('blocks save when delta != 0', async () => {
    const user = userEvent.setup()
    render(<ExactForm editing={null} onDone={() => {}} />)
    await user.type(screen.getByLabelText(/title/i), 'Bill')
    await user.clear(screen.getByLabelText(/^total/i))
    await user.type(screen.getByLabelText(/^total/i), '100')
    const amountInputs = screen.getAllByLabelText(/amount for/i)
    await user.clear(amountInputs[0])
    await user.type(amountInputs[0], '60')
    await user.clear(amountInputs[1])
    await user.type(amountInputs[1], '41')
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  it('saves when amounts match total', async () => {
    const user = userEvent.setup()
    render(<ExactForm editing={null} onDone={() => {}} />)
    await user.type(screen.getByLabelText(/title/i), 'Bill')
    await user.clear(screen.getByLabelText(/^total/i))
    await user.type(screen.getByLabelText(/^total/i), '100')
    const amountInputs = screen.getAllByLabelText(/amount for/i)
    await user.clear(amountInputs[0])
    await user.type(amountInputs[0], '60')
    await user.clear(amountInputs[1])
    await user.type(amountInputs[1], '40')
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(useSession.getState().expenses).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Implementation**

```tsx
import { useState, useMemo } from 'react'
import { Button, Input } from '../ui'
import { useSession } from '../../store/session'
import { LIMITS } from '../../lib/validation'
import { usePeople, parseMoney, clampMoney } from './form-utils'
import type { Expense, ExactExpense } from '../../types'
import { formatMoney } from '../../lib/format'

export function ExactForm({ editing, onDone }: { editing: Expense | null; onDone: () => void }) {
  const people = usePeople()
  const currency = useSession((s) => s.currency)
  const addExpense = useSession((s) => s.addExpense)
  const updateExpense = useSession((s) => s.updateExpense)
  const initial = editing?.type === 'exact' ? (editing as ExactExpense) : null

  const [title, setTitle] = useState(initial?.title ?? '')
  const [total, setTotal] = useState<string>(initial?.total != null ? String(initial.total) : '')
  const [paidById, setPaidById] = useState(initial?.paidById ?? people[0]?.id ?? '')
  const [amounts, setAmounts] = useState<Record<string, string>>(() => {
    const obj: Record<string, string> = {}
    for (const p of people) obj[p.id] = String(initial?.amounts?.[p.id] ?? 0)
    return obj
  })

  const totalNum = clampMoney(parseMoney(total))
  const sum = useMemo(() => Object.values(amounts).reduce((s, v) => s + parseMoney(v), 0), [amounts])
  const delta = +(totalNum - sum).toFixed(2)
  const valid = title.trim() !== '' && totalNum > 0 && Math.abs(delta) < 0.005

  function save() {
    if (!valid) return
    const parsed: Record<string, number> = {}
    for (const [id, v] of Object.entries(amounts)) {
      const n = clampMoney(parseMoney(v))
      if (n > 0) parsed[id] = n
    }
    if (initial) {
      updateExpense(initial.id, { title, total: totalNum, paidById, amounts: parsed })
    } else {
      addExpense({ type: 'exact', title, total: totalNum, paidById, amounts: parsed })
    }
    onDone()
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Title
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={LIMITS.expenseTitle} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Total
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          step={0.01}
          value={total}
          onChange={(e) => setTotal(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Paid by
        <select
          value={paidById}
          onChange={(e) => setPaidById(e.target.value)}
          className="h-10 rounded-lg border border-[--color-border] bg-[--color-surface] px-3 text-sm"
        >
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-col gap-2 text-sm">
        <span className="text-[--color-muted]">Amounts</span>
        {people.map((p) => (
          <label key={p.id} className="flex items-center gap-2">
            <span className="flex-1">{p.name}</span>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              aria-label={`amount for ${p.name}`}
              value={amounts[p.id] ?? '0'}
              onChange={(e) => setAmounts({ ...amounts, [p.id]: e.target.value })}
              className="w-28"
            />
          </label>
        ))}
        <p className={`text-xs ${Math.abs(delta) < 0.005 ? 'text-[--color-muted]' : 'text-red-500'}`}>
          Sum: {formatMoney(sum, currency as 'USD')} · Delta: {formatMoney(delta, currency as 'USD')}
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={save} disabled={!valid}>
          Save
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run, verify pass; commit**

```bash
npm run test -- ExactForm
git add -A
git commit -m "feat: ExactForm with live delta validation"
```

### Task 22: MileageForm

**Files:**

- Replace stub: `src/components/expense-forms/MileageForm.tsx`
- Create: `src/components/expense-forms/MileageForm.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MileageForm } from './MileageForm'
import { resetSession, useSession } from '../../store/session'

beforeEach(() => {
  localStorage.clear()
  resetSession()
  const s = useSession.getState()
  s.addPerson('Alice')
  s.addPerson('Bob')
})

describe('MileageForm', () => {
  it('creates a mileage expense with unit label', async () => {
    const user = userEvent.setup()
    render(<MileageForm editing={null} onDone={() => {}} />)
    await user.type(screen.getByLabelText(/title/i), 'Gas')
    await user.clear(screen.getByLabelText(/^total/i))
    await user.type(screen.getByLabelText(/^total/i), '60')
    await user.clear(screen.getByLabelText(/unit/i))
    await user.type(screen.getByLabelText(/unit/i), 'miles')
    const inputs = screen.getAllByLabelText(/units for/i)
    await user.clear(inputs[0])
    await user.type(inputs[0], '100')
    await user.clear(inputs[1])
    await user.type(inputs[1], '50')
    await user.click(screen.getByRole('button', { name: /save/i }))
    const e = useSession.getState().expenses[0]
    expect(e.type).toBe('mileage')
    if (e.type === 'mileage') {
      expect(e.unitLabel).toBe('miles')
      expect(Object.values(e.units).reduce((s, v) => s + v, 0)).toBe(150)
    }
  })
})
```

- [ ] **Step 2: Implementation**

```tsx
import { useState } from 'react'
import { Button, Input } from '../ui'
import { useSession } from '../../store/session'
import { LIMITS } from '../../lib/validation'
import { usePeople, parseMoney, clampMoney } from './form-utils'
import type { Expense, MileageExpense } from '../../types'

export function MileageForm({ editing, onDone }: { editing: Expense | null; onDone: () => void }) {
  const people = usePeople()
  const addExpense = useSession((s) => s.addExpense)
  const updateExpense = useSession((s) => s.updateExpense)
  const initial = editing?.type === 'mileage' ? (editing as MileageExpense) : null

  const [title, setTitle] = useState(initial?.title ?? '')
  const [total, setTotal] = useState<string>(initial?.total != null ? String(initial.total) : '')
  const [paidById, setPaidById] = useState(initial?.paidById ?? people[0]?.id ?? '')
  const [unitLabel, setUnitLabel] = useState(initial?.unitLabel ?? 'miles')
  const [units, setUnits] = useState<Record<string, string>>(() => {
    const obj: Record<string, string> = {}
    for (const p of people) obj[p.id] = String(initial?.units?.[p.id] ?? 0)
    return obj
  })

  function save() {
    const amount = clampMoney(parseMoney(total))
    const parsed: Record<string, number> = {}
    for (const [id, v] of Object.entries(units)) {
      const n = Number(v)
      if (Number.isFinite(n) && n > 0) parsed[id] = Math.min(n, LIMITS.unitsMax)
    }
    if (!title.trim() || amount <= 0 || !unitLabel.trim() || Object.keys(parsed).length === 0) return
    if (initial) {
      updateExpense(initial.id, { title, total: amount, paidById, unitLabel, units: parsed })
    } else {
      addExpense({ type: 'mileage', title, total: amount, paidById, unitLabel, units: parsed })
    }
    onDone()
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Title
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={LIMITS.expenseTitle} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Total
        <Input type="number" min={0} step={0.01} value={total} onChange={(e) => setTotal(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Paid by
        <select
          value={paidById}
          onChange={(e) => setPaidById(e.target.value)}
          className="h-10 rounded-lg border border-[--color-border] bg-[--color-surface] px-3 text-sm"
        >
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Unit label
        <Input
          value={unitLabel}
          onChange={(e) => setUnitLabel(e.target.value)}
          maxLength={LIMITS.unitLabel}
        />
      </label>
      <div className="flex flex-col gap-2 text-sm">
        <span className="text-[--color-muted]">{unitLabel || 'units'} per person</span>
        {people.map((p) => (
          <label key={p.id} className="flex items-center gap-2">
            <span className="flex-1">{p.name}</span>
            <Input
              type="number"
              min={0}
              step={0.1}
              aria-label={`units for ${p.name}`}
              value={units[p.id] ?? '0'}
              onChange={(e) => setUnits({ ...units, [p.id]: e.target.value })}
              className="w-24"
            />
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={save}>Save</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run, verify pass; commit**

```bash
npm run test -- MileageForm
git add -A
git commit -m "feat: MileageForm"
```

### Task 23: RestaurantForm (itemized)

**Files:**

- Replace stub: `src/components/expense-forms/RestaurantForm.tsx`
- Create: `src/components/expense-forms/RestaurantForm.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RestaurantForm } from './RestaurantForm'
import { resetSession, useSession } from '../../store/session'

beforeEach(() => {
  localStorage.clear()
  resetSession()
  const s = useSession.getState()
  s.addPerson('Alice')
  s.addPerson('Bob')
})

describe('RestaurantForm', () => {
  it('creates a restaurant expense with items + tax + tip', async () => {
    const user = userEvent.setup()
    render(<RestaurantForm editing={null} onDone={() => {}} />)
    await user.type(screen.getByLabelText(/title/i), 'Pizza night')
    await user.click(screen.getByRole('button', { name: /add item/i }))
    const itemName = screen.getAllByLabelText(/item name/i)[0]
    const itemPrice = screen.getAllByLabelText(/item price/i)[0]
    await user.type(itemName, 'Pizza')
    await user.clear(itemPrice)
    await user.type(itemPrice, '40')
    // assign first item to Alice
    const aliceCheckbox = screen.getAllByLabelText(/assign Alice/i)[0]
    await user.click(aliceCheckbox)
    const taxInput = screen.getByLabelText(/^tax/i)
    await user.clear(taxInput)
    await user.type(taxInput, '4')
    await user.click(screen.getByRole('button', { name: /save/i }))
    const e = useSession.getState().expenses[0]
    expect(e.type).toBe('restaurant')
    if (e.type === 'restaurant') {
      expect(e.items).toHaveLength(1)
      expect(e.tax).toBe(4)
    }
  })
})
```

- [ ] **Step 2: Implementation**

```tsx
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Input } from '../ui'
import { useSession } from '../../store/session'
import { LIMITS } from '../../lib/validation'
import { usePeople, parseMoney, clampMoney } from './form-utils'
import type { Expense, RestaurantExpense, RestaurantItem } from '../../types'

function newItem(): RestaurantItem {
  return { id: `i_${Math.random().toString(36).slice(2, 10)}`, name: '', price: 0, assignedIds: [] }
}

export function RestaurantForm({ editing, onDone }: { editing: Expense | null; onDone: () => void }) {
  const people = usePeople()
  const addExpense = useSession((s) => s.addExpense)
  const updateExpense = useSession((s) => s.updateExpense)
  const initial = editing?.type === 'restaurant' ? (editing as RestaurantExpense) : null

  const [title, setTitle] = useState(initial?.title ?? '')
  const [paidById, setPaidById] = useState(initial?.paidById ?? people[0]?.id ?? '')
  const [items, setItems] = useState<RestaurantItem[]>(initial?.items ?? [])
  const [tax, setTax] = useState<string>(initial?.tax != null ? String(initial.tax) : '0')
  const [tip, setTip] = useState<string>(initial?.tip != null ? String(initial.tip) : '0')
  const [serviceFee, setServiceFee] = useState<string>(
    initial?.serviceFee != null ? String(initial.serviceFee) : '0'
  )

  function updateItem(idx: number, patch: Partial<RestaurantItem>) {
    setItems((cur) => cur.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }
  function toggleAssign(idx: number, personId: string) {
    setItems((cur) =>
      cur.map((it, i) =>
        i === idx
          ? {
              ...it,
              assignedIds: it.assignedIds.includes(personId)
                ? it.assignedIds.filter((id) => id !== personId)
                : [...it.assignedIds, personId],
            }
          : it
      )
    )
  }
  function addItem() {
    if (items.length >= LIMITS.maxItemsPerExpense) return
    setItems((cur) => [...cur, newItem()])
  }
  function removeItem(idx: number) {
    setItems((cur) => cur.filter((_, i) => i !== idx))
  }

  function save() {
    if (!title.trim() || items.length === 0) return
    const cleanItems = items.map((it) => ({ ...it, price: clampMoney(it.price) }))
    if (cleanItems.some((it) => !it.name.trim() || it.assignedIds.length === 0 || it.price <= 0)) return
    const payload = {
      title,
      paidById,
      items: cleanItems,
      tax: clampMoney(parseMoney(tax)),
      tip: clampMoney(parseMoney(tip)),
      serviceFee: clampMoney(parseMoney(serviceFee)),
    } as const
    if (initial) updateExpense(initial.id, payload)
    else addExpense({ type: 'restaurant', ...payload })
    onDone()
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Title
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={LIMITS.expenseTitle} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Paid by
        <select
          value={paidById}
          onChange={(e) => setPaidById(e.target.value)}
          className="h-10 rounded-lg border border-[--color-border] bg-[--color-surface] px-3 text-sm"
        >
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-col gap-2 text-sm">
        <span className="text-[--color-muted]">Items</span>
        {items.map((it, idx) => (
          <div key={it.id} className="rounded-lg border border-[--color-border] p-2">
            <div className="flex gap-2">
              <Input
                aria-label="item name"
                placeholder="Item name"
                value={it.name}
                onChange={(e) => updateItem(idx, { name: e.target.value })}
                maxLength={LIMITS.itemName}
              />
              <Input
                aria-label="item price"
                type="number"
                min={0}
                step={0.01}
                placeholder="Price"
                value={String(it.price)}
                onChange={(e) => updateItem(idx, { price: parseMoney(e.target.value) })}
                className="w-24"
              />
              <button
                onClick={() => removeItem(idx)}
                aria-label="remove item"
                className="text-[--color-muted] hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {people.map((p) => (
                <label key={p.id} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    aria-label={`assign ${p.name}`}
                    checked={it.assignedIds.includes(p.id)}
                    onChange={() => toggleAssign(idx, p.id)}
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={addItem}
          disabled={items.length >= LIMITS.maxItemsPerExpense}
        >
          <Plus className="size-4" /> Add item
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1 text-sm">
          Tax
          <Input
            type="number"
            min={0}
            step={0.01}
            aria-label="tax"
            value={tax}
            onChange={(e) => setTax(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Tip
          <Input type="number" min={0} step={0.01} value={tip} onChange={(e) => setTip(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Service
          <Input
            type="number"
            min={0}
            step={0.01}
            value={serviceFee}
            onChange={(e) => setServiceFee(e.target.value)}
          />
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={save}>Save</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run, verify pass; commit**

```bash
npm run test -- RestaurantForm
git add -A
git commit -m "feat: RestaurantForm with items, tax, tip, service"
```

### Task 24: LodgingForm (simple + tiered toggle)

**Files:**

- Replace stub: `src/components/expense-forms/LodgingForm.tsx`
- Create: `src/components/expense-forms/LodgingForm.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LodgingForm } from './LodgingForm'
import { resetSession, useSession } from '../../store/session'

beforeEach(() => {
  localStorage.clear()
  resetSession()
  const s = useSession.getState()
  s.addPerson('Alice')
  s.addPerson('Bob')
})

describe('LodgingForm', () => {
  it('creates a simple lodging expense', async () => {
    const user = userEvent.setup()
    render(<LodgingForm editing={null} onDone={() => {}} />)
    await user.type(screen.getByLabelText(/title/i), 'Airbnb')
    await user.clear(screen.getByLabelText(/^total/i))
    await user.type(screen.getByLabelText(/^total/i), '600')
    const nightInputs = screen.getAllByLabelText(/nights for/i)
    await user.clear(nightInputs[0])
    await user.type(nightInputs[0], '3')
    await user.clear(nightInputs[1])
    await user.type(nightInputs[1], '3')
    await user.click(screen.getByRole('button', { name: /save/i }))
    const e = useSession.getState().expenses[0]
    expect(e.type).toBe('lodging')
    if (e.type === 'lodging') {
      expect(e.mode).toBe('simple')
      expect(e.total).toBe(600)
    }
  })
})
```

- [ ] **Step 2: Implementation**

```tsx
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Input } from '../ui'
import { useSession } from '../../store/session'
import { LIMITS } from '../../lib/validation'
import { usePeople, parseMoney, clampMoney } from './form-utils'
import type { Expense, LodgingExpense, Room } from '../../types'

function newRoom(): Room {
  return { id: `r_${Math.random().toString(36).slice(2, 10)}`, name: '', nightlyRate: 0 }
}

export function LodgingForm({ editing, onDone }: { editing: Expense | null; onDone: () => void }) {
  const people = usePeople()
  const addExpense = useSession((s) => s.addExpense)
  const updateExpense = useSession((s) => s.updateExpense)
  const initial = editing?.type === 'lodging' ? (editing as LodgingExpense) : null

  const [title, setTitle] = useState(initial?.title ?? '')
  const [total, setTotal] = useState<string>(initial?.total != null ? String(initial.total) : '')
  const [paidById, setPaidById] = useState(initial?.paidById ?? people[0]?.id ?? '')
  const [mode, setMode] = useState<'simple' | 'tiered'>(initial?.mode ?? 'simple')
  const [nights, setNights] = useState<Record<string, string>>(() => {
    const obj: Record<string, string> = {}
    for (const p of people) obj[p.id] = String(initial?.nights?.[p.id] ?? 0)
    return obj
  })
  const [rooms, setRooms] = useState<Room[]>(initial?.rooms ?? [])
  const [assignments, setAssignments] = useState<Record<string, string>>(initial?.assignments ?? {})

  function save() {
    const amount = clampMoney(parseMoney(total))
    const parsedNights: Record<string, number> = {}
    for (const [id, v] of Object.entries(nights)) {
      const n = Number(v)
      if (Number.isFinite(n) && n > 0) parsedNights[id] = Math.min(Math.floor(n), LIMITS.nightsMax)
    }
    if (!title.trim() || amount <= 0 || Object.keys(parsedNights).length === 0) return
    const payload = {
      title,
      total: amount,
      paidById,
      mode,
      nights: parsedNights,
      ...(mode === 'tiered' ? { rooms, assignments } : {}),
    } as const
    if (initial) updateExpense(initial.id, payload)
    else addExpense({ type: 'lodging', ...payload })
    onDone()
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Title
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={LIMITS.expenseTitle} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Total
        <Input type="number" min={0} step={0.01} value={total} onChange={(e) => setTotal(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Paid by
        <select
          value={paidById}
          onChange={(e) => setPaidById(e.target.value)}
          className="h-10 rounded-lg border border-[--color-border] bg-[--color-surface] px-3 text-sm"
        >
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={mode === 'tiered'}
          onChange={(e) => setMode(e.target.checked ? 'tiered' : 'simple')}
        />
        Rooms have different prices
      </label>
      {mode === 'tiered' && (
        <div className="flex flex-col gap-2 text-sm">
          <span className="text-[--color-muted]">Rooms</span>
          {rooms.map((r, idx) => (
            <div key={r.id} className="flex gap-2">
              <Input
                aria-label="room name"
                placeholder="Room name"
                value={r.name}
                onChange={(e) =>
                  setRooms((cur) => cur.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))
                }
                maxLength={LIMITS.roomName}
              />
              <Input
                aria-label="nightly rate"
                type="number"
                min={0}
                step={0.01}
                placeholder="Nightly rate"
                value={String(r.nightlyRate)}
                onChange={(e) =>
                  setRooms((cur) =>
                    cur.map((x, i) => (i === idx ? { ...x, nightlyRate: parseMoney(e.target.value) } : x))
                  )
                }
                className="w-32"
              />
              <button
                onClick={() => setRooms((cur) => cur.filter((_, i) => i !== idx))}
                aria-label="remove room"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRooms((cur) => [...cur, newRoom()])}
            disabled={rooms.length >= LIMITS.maxRoomsPerLodging}
          >
            <Plus className="size-4" /> Add room
          </Button>
        </div>
      )}
      <div className="flex flex-col gap-2 text-sm">
        <span className="text-[--color-muted]">Nights per person</span>
        {people.map((p) => (
          <label key={p.id} className="flex items-center gap-2">
            <span className="flex-1">{p.name}</span>
            <Input
              type="number"
              min={0}
              step={1}
              aria-label={`nights for ${p.name}`}
              value={nights[p.id] ?? '0'}
              onChange={(e) => setNights({ ...nights, [p.id]: e.target.value })}
              className="w-20"
            />
            {mode === 'tiered' && rooms.length > 0 && (
              <select
                aria-label={`room for ${p.name}`}
                value={assignments[p.id] ?? ''}
                onChange={(e) => setAssignments({ ...assignments, [p.id]: e.target.value })}
                className="h-10 rounded-lg border border-[--color-border] bg-[--color-surface] px-2 text-sm"
              >
                <option value="">— room —</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name || 'Unnamed'}
                  </option>
                ))}
              </select>
            )}
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={save}>Save</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run, verify pass; commit**

```bash
npm run test -- LodgingForm
git add -A
git commit -m "feat: LodgingForm with simple + tiered modes"
```

---

## Phase 7 — Balances, Settle Up, Summary, Share

### Task 25: Balances and Settle Up panels

**Files:**

- Create: `src/components/BalancesPanel.tsx`, `src/components/SettleUpPanel.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write `BalancesPanel.tsx`**

```tsx
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useSession } from '../store/session'
import { computeBalances } from '../lib/compute-balances'
import { formatSigned } from '../lib/format'
import type { CurrencyCode } from '../lib/currencies'

export function BalancesPanel() {
  const people = useSession((s) => s.people)
  const expenses = useSession((s) => s.expenses)
  const currency = useSession((s) => s.currency)

  const balances = useMemo(() => computeBalances(people, expenses), [people, expenses])
  const max = Math.max(1, ...balances.map((b) => Math.abs(b.net)))

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[--color-border] bg-[--color-surface] p-4">
      <h2 className="font-semibold">Balances</h2>
      {balances.length === 0 ? (
        <p className="text-sm text-[--color-muted]">Add people and expenses to see balances.</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          {balances.map((b) => {
            const pct = (Math.abs(b.net) / max) * 100
            const positive = b.net > 0
            return (
              <li key={b.memberId} className="flex flex-col gap-1">
                <div className="flex justify-between font-mono">
                  <span className="font-sans">{b.name}</span>
                  <span className={positive ? 'text-emerald-600' : 'text-rose-600'}>
                    {formatSigned(b.net, currency as CurrencyCode)}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[--color-border]/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className={`h-full rounded-full ${positive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Write `SettleUpPanel.tsx`**

```tsx
import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useSession } from '../store/session'
import { computeBalances } from '../lib/compute-balances'
import { simplifyDebts } from '../lib/simplify-debts'
import { formatMoney } from '../lib/format'
import type { CurrencyCode } from '../lib/currencies'

export function SettleUpPanel() {
  const people = useSession((s) => s.people)
  const expenses = useSession((s) => s.expenses)
  const currency = useSession((s) => s.currency)
  const debts = useMemo(() => simplifyDebts(computeBalances(people, expenses)), [people, expenses])

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[--color-border] bg-[--color-surface] p-4">
      <h2 className="font-semibold">Settle Up</h2>
      {debts.length === 0 ? (
        <p className="text-sm text-[--color-muted]">All even. Add expenses to see who owes whom.</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          <AnimatePresence initial={false}>
            {debts.map((d) => (
              <motion.li
                key={`${d.fromMemberId}-${d.toMemberId}`}
                layout
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between rounded-md px-2 py-1"
              >
                <span className="flex items-center gap-2">
                  <span>{d.fromName}</span>
                  <ArrowRight className="size-3 text-[--color-muted]" />
                  <span>{d.toName}</span>
                </span>
                <span className="font-mono tabular-nums">
                  {formatMoney(d.amount, currency as CurrencyCode)}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      {debts.length > 0 && (
        <p className="text-xs text-[--color-muted]">
          {debts.length} transaction{debts.length === 1 ? '' : 's'}
        </p>
      )}
    </section>
  )
}
```

- [ ] **Step 3: Wire into `App.tsx`**

Replace the two remaining placeholders with `<BalancesPanel />` and `<SettleUpPanel />`.

- [ ] **Step 4: Verify build + run dev server, manually test**

```bash
npm run typecheck
npm run dev
```

Open the app, add 3 people and an equal expense, confirm balances and settle-up panels update.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Balances and Settle Up panels"
```

### Task 26: Summary view + exports

**Files:**

- Create: `src/components/summary/SummaryView.tsx`, `src/components/summary/exports.ts`, `src/components/summary/exports.test.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write `exports.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { buildSummaryText } from './exports'
import { SCHEMA_VERSION, type Session } from '../../types'

const session: Session = {
  v: SCHEMA_VERSION,
  currency: 'USD',
  title: 'Tahoe',
  people: [
    { id: 'a', name: 'Alice' },
    { id: 'b', name: 'Bob' },
  ],
  expenses: [
    { id: 'e1', type: 'equal', title: 'Dinner', total: 100, paidById: 'a', participantIds: ['a', 'b'] },
  ],
  createdAt: '2026-03-08T00:00:00.000Z',
}

describe('buildSummaryText', () => {
  it('includes total and settle-up lines', () => {
    const text = buildSummaryText(session)
    expect(text).toContain('Tahoe')
    expect(text).toContain('Settle up')
    expect(text).toMatch(/Bob.*Alice.*\$50/)
  })
})
```

- [ ] **Step 2: Write `exports.ts`**

```ts
import type { Session } from '../../types'
import { computeBalances } from '../../lib/compute-balances'
import { simplifyDebts } from '../../lib/simplify-debts'
import { formatMoney, formatDate } from '../../lib/format'
import type { CurrencyCode } from '../../lib/currencies'
import { expenseTotal } from '../../types'

export function buildSummaryText(session: Session): string {
  const debts = simplifyDebts(computeBalances(session.people, session.expenses))
  const totalSpent = session.expenses.reduce((s, e) => s + expenseTotal(e), 0)
  const title = session.title ?? 'Expense Summary'
  const date = formatDate(session.createdAt)
  const lines: string[] = [
    `${title} (${date})`,
    `Total: ${formatMoney(totalSpent, session.currency as CurrencyCode)} across ${session.people.length} people, ${session.expenses.length} expenses`,
    '',
    'Settle up:',
  ]
  if (debts.length === 0) lines.push('• All even')
  for (const d of debts) {
    lines.push(`• ${d.fromName} → ${d.toName}  ${formatMoney(d.amount, session.currency as CurrencyCode)}`)
  }
  return lines.join('\n')
}

export function downloadJson(session: Session): void {
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(session.title ?? 'expense-summary').replace(/[^a-z0-9-]/gi, '-').toLowerCase()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadImage(node: HTMLElement, filename: string): Promise<void> {
  const { toPng } = await import('html-to-image')
  const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: '#ffffff' })
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}
```

- [ ] **Step 3: Write `SummaryView.tsx`**

```tsx
import { useMemo, useRef } from 'react'
import { Dialog, Button } from '../ui'
import { useSession } from '../../store/session'
import { computeBalances } from '../../lib/compute-balances'
import { simplifyDebts } from '../../lib/simplify-debts'
import { formatMoney, formatDate } from '../../lib/format'
import { buildSummaryText, downloadJson, downloadImage } from './exports'
import { expenseTotal } from '../../types'
import type { CurrencyCode } from '../../lib/currencies'

const TYPE_LABELS: Record<string, string> = {
  equal: 'split equally',
  shares: 'by shares',
  exact: 'exact amounts',
  mileage: 'by mileage',
  restaurant: 'itemized',
  lodging: 'by nights',
}

export function SummaryView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const session = useSession((s) => ({
    v: s.v,
    currency: s.currency,
    title: s.title,
    people: s.people,
    expenses: s.expenses,
    createdAt: s.createdAt,
  }))
  const cardRef = useRef<HTMLDivElement>(null)
  const debts = useMemo(() => simplifyDebts(computeBalances(session.people, session.expenses)), [session])
  const totalSpent = session.expenses.reduce((s, e) => s + expenseTotal(e), 0)
  const c = session.currency as CurrencyCode

  return (
    <Dialog open={open} onClose={onClose} title="Summary">
      <div className="flex flex-col gap-3">
        <div ref={cardRef} className="flex flex-col gap-4 rounded-xl bg-white p-5 text-slate-900">
          <header className="text-center">
            <h3 className="text-xl font-semibold">{session.title ?? 'Expense Summary'}</h3>
            <p className="text-xs text-slate-500">{formatDate(session.createdAt)}</p>
          </header>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total spent</p>
            <p className="font-mono text-3xl font-semibold">{formatMoney(totalSpent, c)}</p>
            <p className="text-xs text-slate-500">
              {session.people.length} people · {session.expenses.length} expenses
            </p>
          </div>
          <div>
            <h4 className="mb-1 text-sm font-semibold">Settle Up</h4>
            {debts.length === 0 ? (
              <p className="text-sm text-slate-500">All even.</p>
            ) : (
              <ul className="flex flex-col gap-1 font-mono text-sm">
                {debts.map((d) => (
                  <li key={`${d.fromMemberId}-${d.toMemberId}`} className="flex justify-between">
                    <span>
                      {d.fromName} → {d.toName}
                    </span>
                    <span className="tabular-nums">{formatMoney(d.amount, c)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h4 className="mb-1 text-sm font-semibold">Breakdown</h4>
            <ul className="flex flex-col gap-1 text-sm">
              {session.expenses.map((e) => {
                const payer = session.people.find((p) => p.id === e.paidById)?.name ?? '?'
                return (
                  <li key={e.id} className="flex flex-col">
                    <div className="flex justify-between font-mono">
                      <span className="font-sans">{e.title}</span>
                      <span className="tabular-nums">{formatMoney(expenseTotal(e), c)}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {payer} paid · {TYPE_LABELS[e.type]}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
          <p className="pt-2 text-center text-xs text-slate-400">expensecalc</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigator.clipboard.writeText(buildSummaryText(session as never))}
          >
            Copy as Text
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              cardRef.current &&
              downloadImage(
                cardRef.current,
                `${(session.title ?? 'expense-summary').replace(/[^a-z0-9-]/gi, '-')}.png`
              )
            }
          >
            Download Image
          </Button>
          <Button size="sm" variant="ghost" onClick={() => downloadJson(session as never)}>
            Download JSON
          </Button>
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
```

- [ ] **Step 4: Wire into `App.tsx`**

Replace the placeholder `{summaryOpen && ...}` block with `<SummaryView open={summaryOpen} onClose={() => setSummaryOpen(false)} />`.

- [ ] **Step 5: Run tests, verify dev**

```bash
npm run test -- exports
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: Summary view with text, image, and JSON exports"
```

### Task 27: Share dialog + URL import handler

**Files:**

- Create: `src/components/share/ShareDialog.tsx`, `src/hooks/useUrlImport.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write `useUrlImport.ts`**

```ts
import { useEffect, useState } from 'react'
import { decodeShareHash } from '../lib/url-share'
import { useSession } from '../store/session'
import type { Session } from '../types'

export type PendingImport =
  | { kind: 'overwrite'; session: Session }
  | { kind: 'fresh'; session: Session }
  | null

export function useUrlImport(): { pending: PendingImport; accept: () => void; reject: () => void } {
  const [pending, setPending] = useState<PendingImport>(null)

  useEffect(() => {
    if (!window.location.hash.startsWith('#d=')) return
    const result = decodeShareHash(window.location.hash)
    if (!result.ok) return
    const existing = useSession.getState()
    const hasWork = existing.people.length > 0 || existing.expenses.length > 0
    setPending(
      hasWork ? { kind: 'overwrite', session: result.session } : { kind: 'fresh', session: result.session }
    )
  }, [])

  function accept() {
    if (!pending) return
    if (pending.kind === 'overwrite') {
      const backup = JSON.stringify({
        v: useSession.getState().v,
        currency: useSession.getState().currency,
        title: useSession.getState().title,
        people: useSession.getState().people,
        expenses: useSession.getState().expenses,
        createdAt: useSession.getState().createdAt,
      })
      localStorage.setItem(`expense-calculator-backup-${Date.now()}`, backup)
    }
    useSession.getState().replaceSession(pending.session)
    history.replaceState(null, '', window.location.pathname + window.location.search)
    setPending(null)
  }

  function reject() {
    history.replaceState(null, '', window.location.pathname + window.location.search)
    setPending(null)
  }

  return { pending, accept, reject }
}
```

- [ ] **Step 2: Write `ShareDialog.tsx`**

```tsx
import { useMemo, useState } from 'react'
import { Dialog, Button, Input } from '../ui'
import { useSession } from '../../store/session'
import { buildShareUrl, encodeSession, URL_WARN_LENGTH } from '../../lib/url-share'

export function ShareDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const session = useSession((s) => ({
    v: s.v,
    currency: s.currency,
    title: s.title,
    people: s.people,
    expenses: s.expenses,
    createdAt: s.createdAt,
  }))
  const [copied, setCopied] = useState(false)
  const { url, length } = useMemo(() => {
    const url = buildShareUrl(window.location.href, session as never)
    return { url, length: encodeSession(session as never).length }
  }, [session])

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <Dialog open={open} onClose={onClose} title="Share session">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[--color-muted]">
          Anyone with this link can see the session. Names are the only personal data stored.
        </p>
        <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
        {length > URL_WARN_LENGTH && (
          <p className="text-xs text-amber-600">
            Long URL — may not render in some chat apps. Use the JSON download from Summary as a fallback.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={copy}>{copied ? 'Copied!' : 'Copy link'}</Button>
        </div>
      </div>
    </Dialog>
  )
}
```

- [ ] **Step 3: Wire into `App.tsx`**

```tsx
import { useState } from 'react'
import { Header } from './components/Header'
import { PeoplePanel } from './components/PeoplePanel'
import { BalancesPanel } from './components/BalancesPanel'
import { SettleUpPanel } from './components/SettleUpPanel'
import { ExpensesPanel } from './components/ExpensesPanel'
import { SummaryView } from './components/summary/SummaryView'
import { ShareDialog } from './components/share/ShareDialog'
import { useUrlImport } from './hooks/useUrlImport'
import { Dialog, Button } from './components/ui'

export default function App() {
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const { pending, accept, reject } = useUrlImport()

  return (
    <div className="min-h-dvh bg-[--color-bg] text-[--color-ink]">
      <Header onOpenSummary={() => setSummaryOpen(true)} onOpenShare={() => setShareOpen(true)} />
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PeoplePanel />
          <BalancesPanel />
          <SettleUpPanel />
          <ExpensesPanel />
        </div>
      </main>
      <SummaryView open={summaryOpen} onClose={() => setSummaryOpen(false)} />
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} />
      <Dialog open={pending !== null} onClose={reject} title="Import shared session?">
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            {pending?.kind === 'overwrite'
              ? 'You have an existing session. Importing this link will replace it. Your current session will be saved as a backup.'
              : 'Load the shared session?'}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={reject}>
              Keep current
            </Button>
            <Button onClick={accept}>Import</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 4: Verify dev**

```bash
npm run typecheck
npm run dev
```

Manually verify: fill out a session, click Share, copy the link, open it in an incognito window, see the import dialog.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Share dialog and URL import with conflict resolution"
```

---

## Phase 8 — Polish, E2E, CI

### Task 28: Add session title + reset button

**Files:**

- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Add a reset button + title field to header**

Replace `Header.tsx` with:

```tsx
import { useState } from 'react'
import { useSession } from '../store/session'
import { CURRENCIES } from '../lib/currencies'
import { Button, Dialog } from './ui'
import { LIMITS } from '../lib/validation'
import { RotateCcw } from 'lucide-react'

export function Header({
  onOpenSummary,
  onOpenShare,
}: {
  onOpenSummary: () => void
  onOpenShare: () => void
}) {
  const currency = useSession((s) => s.currency)
  const setCurrency = useSession((s) => s.setCurrency)
  const title = useSession((s) => s.title)
  const setTitle = useSession((s) => s.setTitle)
  const reset = useSession((s) => s.reset)
  const [confirming, setConfirming] = useState(false)

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[--color-border] px-4 py-3 md:px-6">
      <div className="flex flex-1 items-center gap-2">
        <input
          aria-label="session title"
          placeholder="Session title (optional)"
          value={title ?? ''}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={LIMITS.sessionTitle}
          className="bg-transparent text-lg font-semibold tracking-tight outline-none placeholder:text-[--color-muted] md:text-xl"
        />
      </div>
      <div className="flex items-center gap-2">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="h-9 rounded-md border border-[--color-border] bg-[--color-surface] px-2 text-sm"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code}
            </option>
          ))}
        </select>
        <Button variant="ghost" size="sm" onClick={onOpenSummary}>
          Summary
        </Button>
        <Button size="sm" onClick={onOpenShare}>
          Share
        </Button>
        <button
          onClick={() => setConfirming(true)}
          aria-label="reset"
          className="text-[--color-muted] hover:text-[--color-ink]"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>
      <Dialog open={confirming} onClose={() => setConfirming(false)} title="Reset session?">
        <div className="flex flex-col gap-3">
          <p className="text-sm">This clears all people and expenses. This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                reset()
                setConfirming(false)
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Dialog>
    </header>
  )
}
```

- [ ] **Step 2: Verify, commit**

```bash
npm run typecheck
git add -A
git commit -m "feat: session title and reset button"
```

### Task 29: Playwright config + first E2E (equal split)

**Files:**

- Create: `playwright.config.ts`, `tests/e2e/equal-split.spec.ts`

- [ ] **Step 1: Write `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173/expense-calculator/',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: 'http://localhost:4173/expense-calculator/', headless: true },
})
```

- [ ] **Step 2: Write `tests/e2e/equal-split.spec.ts`**

```ts
import { test, expect } from '@playwright/test'

test('equal split — three people, one expense', async ({ page }) => {
  await page.goto('/')

  // Add 3 people
  for (const name of ['Alice', 'Bob', 'Carol']) {
    await page.getByPlaceholder('Add a name').fill(name)
    await page.getByRole('button', { name: /^Add$/ }).click()
  }
  await expect(page.getByText('People (3)')).toBeVisible()

  // Add an equal expense
  await page.getByRole('button', { name: /Add expense/ }).click()
  await page.getByRole('button', { name: 'Equal' }).click()
  await page.getByLabel('Title').fill('Dinner')
  await page.getByLabel('Total').fill('90')
  await page.getByRole('button', { name: 'Save' }).click()

  // Verify settle-up shows 2 transactions of $30 to Alice
  await expect(page.getByText('Settle Up')).toBeVisible()
  await expect(page.getByText('$30.00').first()).toBeVisible()
})
```

- [ ] **Step 3: Run**

```bash
npm run test:e2e -- equal-split
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test: e2e equal split happy path"
```

### Task 30: E2E — itemized restaurant + lodging

**Files:**

- Create: `tests/e2e/itemized.spec.ts`, `tests/e2e/lodging.spec.ts`

- [ ] **Step 1: Write `itemized.spec.ts`**

```ts
import { test, expect } from '@playwright/test'

test('restaurant itemized — items + tax + tip', async ({ page }) => {
  await page.goto('/')
  for (const name of ['Alice', 'Bob']) {
    await page.getByPlaceholder('Add a name').fill(name)
    await page.getByRole('button', { name: /^Add$/ }).click()
  }
  await page.getByRole('button', { name: /Add expense/ }).click()
  await page.getByRole('button', { name: 'Restaurant' }).click()
  await page.getByLabel('Title').fill('Pizza')
  await page.getByRole('button', { name: /Add item/ }).click()
  await page.getByLabel('item name').fill('Margherita')
  await page.getByLabel('item price').fill('30')
  await page.getByLabel(/assign Alice/i).check()
  await page.getByLabel(/assign Bob/i).check()
  await page.getByLabel('tax').fill('6')
  await page.getByRole('button', { name: 'Save' }).click()
  // Expense saved
  await expect(page.getByText('Pizza')).toBeVisible()
})
```

- [ ] **Step 2: Write `lodging.spec.ts`**

```ts
import { test, expect } from '@playwright/test'

test('lodging — split by nights', async ({ page }) => {
  await page.goto('/')
  for (const name of ['Alice', 'Bob']) {
    await page.getByPlaceholder('Add a name').fill(name)
    await page.getByRole('button', { name: /^Add$/ }).click()
  }
  await page.getByRole('button', { name: /Add expense/ }).click()
  await page.getByRole('button', { name: 'Lodging' }).click()
  await page.getByLabel('Title').fill('Airbnb')
  await page.getByLabel('Total').fill('600')
  await page.getByLabel('nights for Alice').fill('4')
  await page.getByLabel('nights for Bob').fill('2')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Airbnb')).toBeVisible()
  // Settle up: Bob owes Alice $200 (Alice paid 600, Bob's share = 200, Alice's share = 400)
  await expect(page.getByText('$200.00')).toBeVisible()
})
```

- [ ] **Step 3: Run, verify pass; commit**

```bash
npm run test:e2e
git add -A
git commit -m "test: e2e itemized and lodging flows"
```

### Task 31: E2E — URL share round-trip + persistence

**Files:**

- Create: `tests/e2e/share-and-persist.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from '@playwright/test'

test('URL share round-trip and localStorage persistence', async ({ page, context }) => {
  await page.goto('/')
  await page.getByPlaceholder('Add a name').fill('Alice')
  await page.getByRole('button', { name: /^Add$/ }).click()
  await page.getByRole('button', { name: /Add expense/ }).click()
  await page.getByRole('button', { name: 'Equal' }).click()
  await page.getByLabel('Title').fill('Coffee')
  await page.getByLabel('Total').fill('20')
  await page.getByRole('button', { name: 'Save' }).click()

  // Reload — persistence
  await page.reload()
  await expect(page.getByText('Coffee')).toBeVisible()

  // Open Share dialog and grab URL
  await page.getByRole('button', { name: 'Share' }).click()
  const shareUrl = await page.locator('input[readonly]').inputValue()

  // Open in a clean context
  const fresh = await context.newPage()
  await fresh.goto(shareUrl)
  // Import dialog should not appear since this is a new context (empty storage)
  await expect(fresh.getByText('Coffee')).toBeVisible()
})
```

- [ ] **Step 2: Run, verify pass; commit**

```bash
npm run test:e2e -- share-and-persist
git add -A
git commit -m "test: e2e URL share and localStorage persistence"
```

### Task 32: CI workflow

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run format:check
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - run: npm run build
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: lint, typecheck, unit + e2e tests, build"
```

### Task 33: GitHub Pages deploy workflow

**Files:**

- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write workflow**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Commit + push**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: GitHub Pages deploy on main"
```

After pushing to GitHub, enable Pages in the repo settings: Source = "GitHub Actions".

### Task 34: README + final design audit

**Files:**

- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

````markdown
# Expense Calculator

Standalone static expense calculator for splitting bills with friends. No accounts, no backend, no database.

Six split modes: equal, shares, exact, mileage/per-unit, restaurant itemized, lodging by nights/rooms.

## Develop

```sh
npm install
npm run dev
```
````

## Test

```sh
npm run test          # unit
npm run test:e2e      # playwright
npm run check         # full CI suite
```

## Deploy

Auto-deployed to GitHub Pages on push to `main`.

````

- [ ] **Step 2: Run a design audit pass**

Open the live dev server and run through the user flows. Note any visual issues. Run the `impeccable:polish` or `interface-design:critique` skill on the app shell + summary view if a polish pass is desired.

- [ ] **Step 3: Final commit**

```bash
git add README.md
git commit -m "docs: README"
````

---

## Self-Review Checklist

After execution, verify the spec is fully covered:

- [ ] All six split modes have a form, a test, and a working save path
- [ ] `LIMITS` enforced in store and zod schema
- [ ] URL share round-trips a session through encode → decode
- [ ] Schema version `v: 1` set on every session, checked on decode
- [ ] localStorage conflict dialog appears when importing onto an existing session
- [ ] Summary view exports as text, image, and JSON
- [ ] Settle Up shows minimum-transaction simplification
- [ ] CI runs lint, typecheck, unit tests, e2e tests, build
- [ ] GitHub Pages deploys from `main`
- [ ] No `Co-Authored-By` lines in commits
