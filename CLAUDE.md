# Receipt — AI Assistant Context

A static, single-page expense-splitting web app. No backend, no accounts. Every session lives in the browser and is shared via the URL hash fragment.

## Tech Stack

- Vite 7 + React 19 + TypeScript
- Tailwind CSS v4 (CSS-first `@theme` tokens, no `tailwind.config.js`)
- Zustand 5 for client state + localStorage persistence
- framer-motion for entrance/exit + micro-interactions
- pako for gzip; base64url for URL-safe encoding
- html-to-image for the receipt PNG export
- lucide-react for icons; Fraunces / Inter / JetBrains Mono fonts
- Zod 4 for runtime validation of share-URL payloads
- Vitest + happy-dom + @testing-library/react for unit/component tests
- Playwright for end-to-end
- GitHub Actions for CI + Pages deploy

## Commands

- `npm run dev` — Start Vite dev server (port 5173, base `/expense-calculator/`)
- `npm run build` — Production build; copies `index.html` → `404.html` for SPA deep links
- `npm run preview` — Serve the production build
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` / `lint:fix` — ESLint with `--max-warnings 0`
- `npm run format` / `format:check` — Prettier write / check
- `npm run test` / `test:watch` — Vitest
- `npm run test:e2e` — Playwright

## Directory Structure

```
expense-calculator/
├── src/
│   ├── App.tsx                       # Top-level layout, panel staggered entrance
│   ├── components/
│   │   ├── Header.tsx                # Wordmark + session title + currency pill + Summary/Share/Reset
│   │   ├── PeoplePanel.tsx           # Add/rename/remove people, count tag
│   │   ├── BalancesPanel.tsx         # Per-person running balance + horizontal proportion bars
│   │   ├── SettleUpPanel.tsx         # Simplified A→B settle-up list (hero/featured card)
│   │   ├── ExpensesPanel.tsx         # Expense list, type tag, leader dots, edit/delete
│   │   ├── ExpenseBreakdown.tsx      # Click-to-expand per-expense per-person table
│   │   ├── expense-forms/            # One form per split mode + ModePicker tiles
│   │   ├── share/ShareDialog.tsx     # Build + copy share URL; length warning
│   │   ├── summary/SummaryView.tsx   # Receipt-style print/PNG export
│   │   └── ui/
│   │       ├── Button.tsx            # Variants: primary/ghost/danger; size sm/md
│   │       ├── Dialog.tsx            # Centered modal (flex-centered; framer scale)
│   │       ├── Sheet.tsx             # Mobile bottom-sheet / desktop right-drawer
│   │       ├── Input.tsx             # Plain text input wrapper
│   │       ├── MoneyInput.tsx        # Currency-aware sanitize + format-on-blur
│   │       ├── NumericInput.tsx      # Integer/decimal sanitize, optional unit suffix
│   │       ├── CurrencyPicker.tsx    # Pill button + listbox dropdown
│   │       ├── SectionHeading.tsx    # Fraunces italic title + zero-padded mono count tag
│   │       ├── Wordmark.tsx          # "Receipt" + barcode glyph
│   │       └── index.ts              # Barrel
│   ├── hooks/useUrlImport.ts         # On mount, decode #d= → load session if valid
│   ├── lib/
│   │   ├── compute-balances.ts       # Person → signed net total
│   │   ├── simplify-debts.ts         # Greedy A→B settle-up flow
│   │   ├── splits.ts                 # Penny-exact distribution helpers
│   │   ├── expense-breakdown.ts      # Per-expense per-person amounts (for breakdown table)
│   │   ├── lodging.ts                # Nights + room-tier math
│   │   ├── currencies.ts             # CURRENCIES list + currencyDecimals()
│   │   ├── format.ts                 # formatMoney, formatSigned, formatDate
│   │   ├── validation.ts             # Zod SessionSchema + ref-integrity check
│   │   └── url-share.ts              # Encode/decode session for #d= hash
│   ├── store/session.ts              # Zustand store; reset, people CRUD, expense CRUD
│   ├── types.ts                      # Session, Person, Expense union, expenseTotal()
│   ├── index.css                     # Tailwind import, @theme tokens, base styles
│   └── main.tsx                      # React root
├── scripts/bench-url.ts              # One-off URL size benchmark
├── tests/e2e/                        # Playwright specs
├── public/                           # Static assets
├── .github/workflows/
│   ├── ci.yml                        # format/lint/typecheck/test/e2e/build on every push + PR
│   └── deploy.yml                    # Triggered by CI success on main → Pages
├── vite.config.ts                    # base: '/expense-calculator/', SPA-404 plugin
├── vitest.config.ts                  # happy-dom env, setup file registers jest-dom
└── playwright.config.ts              # Localhost dev-server-managed
```

## Key Patterns

- **Single-screen layout** — Three top cards (People, Balances, Settle Up) + full-width Expenses card. Mobile stacks; desktop uses a responsive 3-column grid.
- **State** — `useSession` Zustand store is the single source of truth; localStorage-persisted under `expense-calc-session-v1`. No React context.
- **Identity** — Person/expense/item/room IDs are cuid-style strings. They have no user-facing meaning; the share-URL encoder strips them to indices and regenerates `p0`, `e0`, `i{e}-{i}`, `r{e}-{i}` on decode.
- **Optimistic UI** — All mutations are local (no server). No loading states. Toast feedback via `sonner` (and only sparingly).
- **Money inputs** — Single `MoneyInput` component everywhere. Local text state preserves trailing decimals while the parent stores numbers. `onBlur` formats to the currency's natural precision via `Intl`.
- **Forms** — One per split mode in `components/expense-forms/`. Each receives `initial?` for edit mode and emits an `ExpenseInput` (no `id`). The Sheet host adds the `id` on save.
- **Confirmations** — Use `Dialog` for destructive confirms (reset session, delete expense). Never `window.confirm()`.
- **Theming** — Tokens live in `@theme` (light) + `@media (prefers-color-scheme: dark) :root { … }` override. Cards/buttons/inputs read `var(--color-bg|surface|ink|muted|accent|border|rule|scrim|tint-warm|accent-soft)`. Receipt card is fixed cream regardless of mode (it's the "physical" output).
- **Typography helpers** — `.h-display` (Fraunces italic 500), `.tag` (mono 10px / 0.18em tracking / uppercase), `.leaders` (dotted leader line), `.dashed-rule`. Defined in `src/index.css`.
- **Penny invariant** — `expense-breakdown` and `compute-balances` agree to the cent. Restaurant breakdown distributes food, tax, tip, and service fee each as their own largest-remainder distribution so the per-person sum equals each component exactly.
- **Schema validation** — Every share-URL load round-trips through `validateSession` (Zod schema + cross-ref integrity for person IDs). Local store writes are trusted (no validation).

## URL Sharing

Wire format (in `src/lib/url-share.ts`):

```
session → positional tuple → JSON.stringify → pako.deflate → base64url → "#d=" prefix
```

Tuple shape:

```
[v, currency, title, createdAt, peopleNames, expenses]

Expense codes (first tuple element):
  0 equal      [0, title, paidByIdx, total, participantIdxs[]]
  1 shares     [1, title, paidByIdx, total, [idx, share][]]
  2 exact      [2, title, paidByIdx, total, [idx, amount][]]
  3 mileage    [3, title, paidByIdx, total, unitLabel, [idx, units][]]
  4 restaurant [4, title, paidByIdx, items[], tax, tip, serviceFee]
                items: [name, price, assignedIdxs[]][]
  5 lodging    [5, title, paidByIdx, total, modeCode, nights, rooms?, assigns?]
                modeCode: 0=simple, 1=tiered
                rooms: [name, rate][]   (room id = array index)
                assigns: [personIdx, roomIdx][]
```

Why a tuple: keys (`title`, `paidById`, `splits`…) and cuid-length IDs (~24 chars each) inflate the post-gzip size more than gzip can recover. Dropping keys + reindexing IDs cuts the URL ~44% on realistic sessions. `scripts/bench-url.ts` reports current numbers.

Why fragments (`#d=`), not query params (`?d=`):

- Fragments never leave the browser — they aren't sent in the HTTP request, so the encoded receipt doesn't land in GitHub Pages logs, analytics, or referrer headers.
- Updating `location.hash` doesn't reload the page (`?` does, without History API).
- The `d=` prefix is a namespace marker, not load-bearing — leaves room for `#draft=` etc. later.

## Testing

- **Co-locate tests:** `lib/foo.ts` → `lib/foo.test.ts`; components likewise where they have behavior to test.
- **Three tiers (all under `npm run test` or `npm run test:e2e`):**
  - **Pure-function tests** (`*.test.ts`) — no DOM, no mocks. Default for `lib/`. Fast.
  - **Component-render tests** (`*.test.tsx`) — happy-dom + `@testing-library/react` + `userEvent`. Registered matchers in `vitest.setup.ts`; `cleanup()` after each test.
  - **E2E** (`tests/e2e/*.spec.ts`) — Playwright drives a real browser against `npm run dev`. Verifies the full add-person → add-expense → settle-up flow.
- **All three must pass in CI on every PR.** `.github/workflows/ci.yml` runs them; deploy is gated on success.
- **When to write what:**
  - New helper in `lib/` → unit test the helper directly.
  - New UI affordance with branching behavior (visible only in mode X) → component test.
  - New top-level user flow → add a Playwright spec.

## Theming Gotcha (Tailwind v4)

`@theme` blocks inside `@media (prefers-color-scheme: dark) { … }` **do not work**. Tailwind v4 hoists `@theme` declarations to a single global block and ignores media-query nesting. Dark mode is implemented as a plain `:root` override inside the media query (see `src/index.css`). Don't add new dark-mode tokens via `@theme`; use `:root` directly.

## Lockfile (npm)

CI uses `npm install` (not `npm ci`) because npm doesn't always write top-level lockfile entries for platform-conditional deps — `bundleDependencies` of optional platform packages (e.g. `@emnapi/*` inside `@tailwindcss/oxide-wasm32-wasi`) and `optionalDependencies` skipped on the install host (e.g. `yaml` under `lint-staged`). The lockfile generated on macOS dev omits them; Linux CI's `npm ci` then refuses to start. Using `npm install` lets CI fill in the gaps. Trade-off: CI may pick up patch-level drift on newly-resolved transitive deps between runs — acceptable for this project's scale. If reproducibility matters more later, switch to pnpm or bun, both of which handle this correctly.

## Currency Decimals

`currencyDecimals(code)` reads `Intl.NumberFormat(...).resolvedOptions().maximumFractionDigits` to get the right minor-unit count: 0 for JPY/KRW/VND, 2 for USD/EUR/most, 3 for KWD/BHD (not in our list). Use this for:

- Sanitizing money input (block decimal point for 0-decimal currencies)
- Format-on-blur (`12` → `12.00` or `12` based on currency)
- Anywhere else currency precision matters

## Don'ts

- Don't edit `components/ui/` shadcn-like primitives expecting them to be auto-generated — this project doesn't use shadcn. They're hand-rolled and editable directly.
- Don't use `window.confirm()`/`alert()` — use `Dialog` for confirms, `sonner` for toasts.
- Don't add new dark-mode tokens via `@theme` inside `@media` (see Theming Gotcha).
- Don't compare an expense's `paidById` against `person.name` — always against `person.id`. The encoder also depends on this.
- Don't bypass `MoneyInput`/`NumericInput` with raw `<input type="number">` — you'll lose the trailing-decimal behavior and the format-on-blur.
- Don't reach into the URL fragment directly from a component — use `useUrlImport` on mount or `buildShareUrl`/`encodeSession` from `src/lib/url-share.ts`.
- Don't write to `localStorage` directly — go through the Zustand store. The persistence key is `expense-calc-session-v1`; bumping its version invalidates everyone's data.
- Don't push to `main` for risky changes without first verifying CI is green. CI is the gate; Deploy depends on it.
- Don't write benchmarks/scratch scripts to `src/` — `scripts/` is the home for one-off tooling that ships with the repo.
