# Expense Calculator — Design Spec

**Date:** 2026-05-11
**Repo:** `expense-calculator` (new standalone repo, sibling to `trip-proposal`)
**Status:** Approved design, ready for implementation planning

## Summary

A standalone, static, single-page expense calculator for splitting bills with friends. Supports six split modes (equal, shares, exact, mileage/per-unit, restaurant itemized, lodging by nights/rooms), aggregates net balances across an unlimited number of expenses in a session, and produces a clean "Settle Up" output plus a screenshot-friendly summary view. No backend, no accounts, no database — entirely client-side. Hosted on GitHub Pages. Session state persists in localStorage and can be shared via a URL-hash-encoded payload.

## Goals

- One-shot publishable site for casual receipt splitting (dinners, Airbnbs, gas, generic group costs)
- All six split modes feel native, not bolted on
- Screenshot-friendly summary for sharing reimbursement amounts in group chats
- Zero hosting cost, zero backend, zero auth
- Reuse battle-tested split math from the `trip-proposal` repo

## Non-Goals

- Plus-ones / nested guest accounts (named people only)
- Multi-currency or FX conversion (single currency per session)
- Payment tracking / settlement history (calculator output only)
- Real-time collaboration across devices
- Cross-device sync without manual URL/JSON sharing

## Tech Stack

- **Build:** Vite + React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **Animation:** framer-motion
- **Icons:** lucide-react
- **State:** Zustand with localStorage middleware
- **Compression:** pako (for URL hash encoding)
- **Image export:** html-to-image
- **Testing:** Vitest (unit), Playwright CLI (E2E)
- **Hosting:** GitHub Pages via `actions/deploy-pages`
- **Build target:** static SPA, `vite.config.ts` with `base: '/expense-calculator/'` for the GitHub Pages subpath; deploy step copies `index.html` to `404.html` for SPA deep-link support

## Architecture

### Directory layout

```
expense-calculator/
├── public/
├── src/
│   ├── components/
│   │   ├── bento/                  # Top-level bento panels
│   │   │   ├── PeoplePanel.tsx
│   │   │   ├── ExpensesPanel.tsx
│   │   │   ├── BalancesPanel.tsx
│   │   │   └── SettleUpPanel.tsx
│   │   ├── expense-forms/          # One file per split mode
│   │   │   ├── EqualForm.tsx
│   │   │   ├── SharesForm.tsx
│   │   │   ├── ExactForm.tsx
│   │   │   ├── MileageForm.tsx
│   │   │   ├── RestaurantForm.tsx
│   │   │   └── LodgingForm.tsx
│   │   ├── summary/
│   │   │   ├── SummaryView.tsx     # Screenshot-optimized layout
│   │   │   └── exports.ts          # Copy-as-text, image, JSON export functions
│   │   ├── share/
│   │   │   └── ShareDialog.tsx
│   │   └── ui/                     # Generic primitives (Button, Sheet, Input, etc.)
│   ├── lib/
│   │   ├── splits.ts               # Pure split math (ported from trip-proposal)
│   │   ├── lodging.ts              # New: nights/tiered-room split logic
│   │   ├── simplify-debts.ts       # Pure: minimum-transaction settle-up
│   │   ├── compute-balances.ts     # Pure: paid - owed per person
│   │   ├── url-share.ts            # encode/decode session ↔ URL hash
│   │   ├── validation.ts           # Input limits + schema validation
│   │   ├── format.ts               # Currency, number formatting
│   │   └── currencies.ts           # Supported currency list
│   ├── store/
│   │   └── session.ts              # Zustand store + localStorage persistence
│   ├── types.ts                    # Session, Person, Expense (discriminated union)
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── unit/                       # Co-located *.test.ts next to source
│   └── e2e/                        # Playwright specs
├── .github/workflows/
│   ├── ci.yml                      # Lint, typecheck, test, build
│   └── deploy.yml                  # GitHub Pages deploy on push to main
├── docs/superpowers/specs/         # This file lives here
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

### State management

Single Zustand store (`useSession`) holding the whole session. localStorage middleware persists on every mutation, debounced 200ms. URL hash imports replace the store atomically after an import-conflict check.

```ts
type Session = {
  v: 1 // Schema version for future migrations
  currency: string // ISO-4217 code
  title: string | null // Optional session title (shown in Summary)
  people: Person[]
  expenses: Expense[]
  createdAt: string // ISO timestamp, used in Summary view
}

type Person = {
  id: string // CUID, stable across renames
  name: string // Max 30 chars, required
}

type ExpenseBase = {
  id: string
  title: string // Max 60 chars, required
  paidById: string // Person.id
}

type Expense =
  | (ExpenseBase & { type: 'equal'; total: number; participantIds: string[] })
  | (ExpenseBase & { type: 'shares'; total: number; shares: Record<string, number> })
  | (ExpenseBase & { type: 'exact'; total: number; amounts: Record<string, number> })
  | (ExpenseBase & { type: 'mileage'; total: number; unitLabel: string; units: Record<string, number> })
  | (ExpenseBase & {
      type: 'restaurant'
      items: RestaurantItem[]
      tax: number
      tip: number
      serviceFee: number
    })
  | (ExpenseBase & {
      type: 'lodging'
      total: number
      mode: 'simple' | 'tiered'
      nights: Record<string, number>
      rooms?: Room[]
      assignments?: Record<string, string>
    })

type RestaurantItem = {
  id: string
  name: string // Max 40 chars
  price: number
  assignedIds: string[] // Person.ids (no duplicates — no +1 support)
}

type Room = {
  id: string
  name: string // Max 30 chars
  nightlyRate: number
}
```

### Pure split math (ported from `trip-proposal/lib/finance/`)

- `computeEqualSplit({ total, participantKeys })` — even split
- `computeSharesSplit({ total, multipliers })` — proportional weights
- `computeExactSplit({ total, amounts })` — validates sum, throws on mismatch
- `computeItemizedSplit({ items, tax, tip, serviceFee })` — restaurant
- `simplifyDebts(balances)` — greedy creditor↔debtor matching
- `computeBalances(people, expenses)` — paid minus owed per person
- **All use the largest-remainder rounding helper to ensure `sum(splits) === total` to the penny**

**Adaptations from trip-proposal:**

- Drop `tripMemberId` → use `personId`
- Drop plus-one duplicate-key handling (no +1 in this app)
- Drop settlement input from `computeBalances` (no payment tracking)
- Same penny-exact rounding guarantees

### New: lodging split (`lib/lodging.ts`)

**Simple mode:**

```
weight_i = nights_i
person_i_share = total × (weight_i / Σ weight_j)
```

Wraps `computeSharesSplit` with `multipliers = nights`.

**Tiered mode:**

```
weight_i = room_rate(assignments_i) × nights_i
person_i_share = total × (weight_i / Σ weight_j)
```

Wraps `computeSharesSplit` with computed weights. If `Σ (room_rate × nights)` ≠ `total` (e.g. cleaning fees), the difference is prorated implicitly by the proportional split — same behavior as itemized tax/tip proration.

## URL Sharing

### Pipeline

```
Session
  → JSON.stringify (minified)
  → pako.deflate (gzip)
  → base64url encode (URL-safe, no padding)
  → location.hash = '#d=' + encoded
```

On mount: if `location.hash.startsWith('#d=')`, decode and check for localStorage conflict. If localStorage has unsaved work, show "Import shared session?" dialog with a backup-on-import safety net (existing state saved to `session_backup_<timestamp>`).

### Why hash, not query string

- Never sent to the server (privacy: GitHub Pages logs see nothing)
- No `Referer` leakage to outbound links
- No page reload when set programmatically
- Opaque to most link-preview crawlers

### Schema versioning

`Session.v: 1` is included in every payload. On decode, an unknown or missing version triggers a friendly error ("This link was created by a different version") rather than a crash. Future versions add a migration function.

### Failure modes & mitigations

| Failure                                 | Mitigation                                                              |
| --------------------------------------- | ----------------------------------------------------------------------- |
| URL too long for SMS/Slack              | Show warning toast at 2 KB encoded, suggest "Download as JSON" fallback |
| Decode error (truncated paste, bit-rot) | try/catch around decode, non-blocking toast, fall back to localStorage  |
| Schema mismatch                         | Version check on decode                                                 |
| localStorage conflict                   | Confirm dialog, backup existing state on overwrite                      |
| Hash dropped by link cleaners           | "Copy as JSON" fallback exists for manual import                        |

### Privacy note

The URL hash is human-unreadable but not encrypted. Anyone with the link sees the data. The UI surfaces this in the Share dialog. Names are the only personal data — no emails, phone numbers, or financial accounts are ever stored.

## Input Validation & URL Size Discipline

To keep encoded URLs under realistic chat-app thresholds (~2 KB ideal, ~4 KB hard limit), every input field has a length/range cap and the form layer rejects out-of-bounds values before they reach the store.

### Length limits

| Field                | Max      | Rationale                                                                             |
| -------------------- | -------- | ------------------------------------------------------------------------------------- |
| Person name          | 30 chars | "Alice Garcia-Smith" fits comfortably; URL gain per char is real                      |
| Expense title        | 60 chars | "Dinner at Roberta's Pizza in Bushwick" fits; longer titles encourage notes elsewhere |
| Restaurant item name | 40 chars | "Truffle pizza, half pepperoni" fits                                                  |
| Mileage unit label   | 12 chars | "kWh", "miles", "kilometers" all fit                                                  |
| Session title        | 50 chars | "Tahoe weekend with the gang"                                                         |
| Room name            | 30 chars | "Master suite", "Loft"                                                                |

### Cardinality limits

| Item                         | Max                               | Behavior past limit                                                    |
| ---------------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| People per session           | 25                                | "Add" button disabled with tooltip                                     |
| Expenses per session         | 100                               | "Add" button disabled with tooltip + suggestion to start fresh session |
| Restaurant items per expense | 50                                | Item add disabled with tooltip                                         |
| Rooms per lodging expense    | 10                                | Room add disabled with tooltip                                         |
| Currency code                | ISO-4217 list of ~30 common codes | Dropdown, no free text                                                 |

### Numeric limits

| Field                        | Range        | Precision                    |
| ---------------------------- | ------------ | ---------------------------- |
| Money (total, prices, rates) | 0–999,999.99 | 2 decimals (rounded on blur) |
| Nights                       | 0–365        | Integer                      |
| Mileage units                | 0–99,999     | 2 decimals                   |
| Share count                  | 0–99         | 2 decimals                   |

### Character set

- Names, titles: allow letters, digits, spaces, common punctuation (`-`, `'`, `.`, `,`, `&`, `!`, `?`, `(`, `)`). Emojis allowed (cost ~4 bytes each).
- Strip leading/trailing whitespace on blur.
- Reject control characters and zero-width spaces.

### Validation enforcement

- Forms use `<input maxLength>` for hard UI caps + zod (or hand-rolled) schemas validating on submit
- The Zustand store re-validates on `setSession` (defense in depth — URL imports go through the same validator)
- Validation failures show inline field errors, never a toast; the form blocks submit
- A URL-import payload that fails validation triggers the same "Couldn't read this share link" error path as a decode failure

## UI/UX Design

### Aesthetic direction

Bento + playful color. Warm neutral base, single calibrated accent. Inter for UI, JetBrains Mono for numbers. Designed mobile-first (single-column on phones, 2-column bento on tablet+, 3-column wide layout on desktop). Dark mode supported via `prefers-color-scheme` and a manual toggle.

### Main page layout (desktop)

```
┌────────────────────────────────────────────────────────────────┐
│ Expense Calculator       [Currency ▾] [Summary] [Share] [↻]   │
├────────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐│
│ │ People           │ │ Balances         │ │ Settle Up        ││
│ │ • Alice          │ │ Alice  +$60.50   │ │ Bob → Alice $42  ││
│ │ • Bob            │ │ Bob    -$42.50   │ │ Carol → A   $18  ││
│ │ • Carol          │ │ Carol  -$18.00   │ │ 2 transactions   ││
│ │ [+ Add person]   │ │ [bar chart]      │ │                  ││
│ └──────────────────┘ └──────────────────┘ └──────────────────┘│
│ ┌────────────────────────── Expenses ──────────────────────── ┐│
│ │ 🍝 Dinner at Roberta's     $128.40  itemized         ⋮      ││
│ │ 🏠 Airbnb 4 nights         $640.00  lodging          ⋮      ││
│ │ 🚗 Gas to Tahoe             $74.20  mileage          ⋮      ││
│ │ [+ Add expense ▾]                                            ││
│ └──────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

Mobile: panels stack in this order — People · Add Expense FAB · Expenses · Balances · Settle Up. Summary/Share live in a top app bar.

### Expense form flow

"Add expense" opens a slide-in sheet with two phases:

1. **Mode picker** — six tiles: Equal · Shares · Exact · Mileage · Restaurant · Lodging. Each tile has an icon, name, one-line description.
2. **Form** — mode-specific. Common fields at top: title, who paid, total (or auto-computed total for restaurant). Mode-specific section below. "Save" button validates and closes the sheet.

Editing an existing expense opens the same sheet pre-populated, skipping the mode picker (mode is fixed after creation).

### Summary view (screenshot-optimized)

A separate view accessed via the "Summary" button, designed for vertical mobile screenshots and image export.

```
┌────────────────────────────────────┐
│                                    │
│  Tahoe Weekend                     │  ← session title (optional)
│  Mar 8, 2026                       │
│                                    │
├────────────────────────────────────┤
│                                    │
│  Total spent                       │
│  $1,247.30                         │  ← large mono number
│  Across 4 people · 8 expenses      │
│                                    │
├────────────────────────────────────┤
│                                    │
│  Settle Up                         │
│                                    │
│  Bob   → Alice     $142.50         │  ← mono, right-aligned
│  Carol → Alice      $89.00         │
│  Dan   → Bob        $34.25         │
│                                    │
├────────────────────────────────────┤
│                                    │
│  Breakdown                         │
│                                    │
│  🍝 Roberta's dinner    $128.40    │
│     Alice paid · itemized          │
│  🏠 Airbnb 4 nights     $640.00    │
│     Bob paid · by nights           │
│  ...                               │
│                                    │
├────────────────────────────────────┤
│  expensecalc.app                   │
└────────────────────────────────────┘
```

Design rules:

- Mobile portrait aspect, no scroll required (sizes to content)
- High contrast — readable in both light and dark mode screenshots
- No buttons, no hover states, no edit affordances in the rendered output
- Large mono numbers (compresses well in chat apps)
- Plain-language mode labels: "by nights", "itemized", "by mileage"
- A subtle footer with the site domain (acts as soft attribution)

### Export options (on Summary view)

Three primary actions across the top of Summary:

1. **Copy as Text** — plaintext for groupchats that strip images.

   ```
   Tahoe Weekend (Mar 8, 2026)
   Total: $1,247.30 across 4 people, 8 expenses

   Settle up:
   • Bob → Alice  $142.50
   • Carol → Alice  $89.00
   • Dan → Bob  $34.25
   ```

2. **Download as Image** — uses `html-to-image` to render the Summary view to 2×-DPI PNG. Filename derived from the session title (sanitized) or `expense-summary-<date>.png`.
3. **Download as JSON** — full session backup. Universal fallback when URL sharing breaks.

A fourth "Copy Share Link" lives in the main page header (next to Summary). It's also available from inside the Summary view for convenience.

## Animation Budget (framer-motion)

- **Page mount:** 200ms fade + slight y-translate on bento panels, 60ms stagger
- **Expense list:** `<AnimatePresence>` with `layout` for smooth reflow on add/remove/reorder
- **Balance bars:** `<motion.div>` width with spring `{ stiffness: 300, damping: 30 }`
- **Sheet open/close:** y-axis slide + backdrop fade
- **Settle Up rows:** `layoutId` transitions when transactions reshuffle after an expense change
- **No looping animations.** All motion is response-driven, not idle ambient motion.

Respect `prefers-reduced-motion` — transitions collapse to instant.

## Testing

### Unit tests (Vitest, co-located `*.test.ts`)

- Port every existing split-function test from `trip-proposal/lib/finance/`
- Add full coverage for `lib/lodging.ts` (simple + tiered, with and without rate mismatches)
- Validate every form's submit path with the `lib/validation.ts` schemas
- Test `url-share.ts` round-trip: encode → decode → deep equal
- Test version-mismatch decode error
- Test localStorage persistence (mock the API)

### E2E tests (Playwright CLI)

Five flows covering the critical paths:

1. **Equal split happy path** — add 3 people, add equal expense, verify balances and settle-up
2. **Restaurant itemized** — add 2 items with overlapping assignees + tax + tip, verify itemized math matches expected output
3. **Lodging proportional** — add 3 people with different nights, verify each share proportional
4. **URL share round-trip** — fill out a session, click Share, navigate to copied URL in a fresh context, verify state rehydrates identically
5. **localStorage persistence** — fill session, reload page, verify state restored

E2E config: Playwright running against `vite preview` build output, single browser (Chromium), headless in CI.

## CI & Deployment

### `.github/workflows/ci.yml` (runs on every PR + push to main)

- Setup: Node 22, install deps via `npm ci`
- Steps: prettier check, ESLint (`--max-warnings 0`), typecheck (`tsc --noEmit`), Vitest run, Playwright run, Vite build
- All steps blocking; branch protection on `main` requires CI green

### `.github/workflows/deploy.yml` (runs on push to main after CI passes)

- Build with `npm run build`
- Copy `dist/index.html` to `dist/404.html` (SPA shim for GitHub Pages deep links)
- Upload `dist/` as an artifact and deploy via `actions/deploy-pages@v4`
- Site lives at `https://<github-username>.github.io/expense-calculator/`

### Vite config notes

- `base: '/expense-calculator/'` for the subpath (override via env for custom domain later)
- Static assets in `public/` with cache-busting via Vite's default hash
- No service worker in v1

## Build Sequence

Implementation order, each step independently testable:

1. **Scaffold** — Vite + React 19 + TypeScript, Tailwind v4, ESLint/Prettier, basic `App.tsx` shell
2. **Port pure math** — `lib/splits.ts`, `lib/simplify-debts.ts`, `lib/compute-balances.ts` + tests (no UI yet)
3. **Lodging math** — new `lib/lodging.ts` + tests
4. **Validation layer** — `lib/validation.ts` with all length/range/cardinality limits + tests
5. **Store** — Zustand session store with localStorage persistence + tests
6. **People panel** — add/edit/remove people with name validation
7. **Expense forms** — one per mode, in this order:
   1. Equal (simplest, validates the form pattern)
   2. Shares
   3. Exact (live delta UI)
   4. Mileage (variant of shares with unit label)
   5. Restaurant (items + tax/tip)
   6. Lodging (simple, then tiered toggle)
8. **Balances + Settle Up panels**
9. **URL sharing** — `lib/url-share.ts`, Share dialog, import conflict UI
10. **Summary view** — read-only render + Copy as Text + JSON download
11. **Image export** — html-to-image integration on Summary view
12. **Animation pass** — framer-motion for mount, list reflow, balance bars, sheet
13. **Design audit** — run `impeccable:critique` + `ui-ux-pro-max` reviews, polish typography/spacing/color
14. **Playwright E2E suite**
15. **GitHub Actions CI + GH Pages deploy**

## Open Questions Resolved

- **Plus-ones:** not supported. Named people only.
- **Multi-currency:** not supported. Single currency per session, user picks from ISO-4217 list.
- **Payment tracking:** not supported. Calculator output only.
- **Backend:** not in v1. URL hash + localStorage + JSON download covers all sharing.
- **URL too long:** warn at 2 KB encoded, JSON download as fallback.
