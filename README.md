# Receipt — Expense Calculator

A standalone, static, single-page app for splitting bills with friends. No backend, no accounts, no database — every session lives in your browser and is shared by URL.

**Live:** https://benjamingarcia10.github.io/expense-calculator/

## Features

**Six split modes**

- **Equal** — even split among selected people
- **Shares** — proportional weights (e.g. 2:1:1)
- **Exact** — manually enter each person's amount, with live delta validation
- **Mileage** — split by miles, hours, or any custom unit
- **Restaurant** — itemized bill with tax, tip, service fee, per-item assignees
- **Lodging** — split by nights stayed; optional room tiers with different rates

**Receipt summary**

- Print-style export with a `Fraunces` italic display face, dashed rules, leader dots, monospaced numbers
- Three export paths: copy as text, download PNG (via `html-to-image`), download JSON
- Cosmetic "receipt number" derived from `createdAt + total`

**Share by URL**

- Entire session encodes into the URL hash fragment — never sent to a server
- Positional-tuple format → `pako.deflate` → `base64url`; ~44% smaller than naive JSON-gzip on a realistic 4-person/10-expense trip
- Length is surfaced to the user; warning past 2000 chars

**Polish**

- 26 currencies, picker pill styled to match the wordmark
- Currency-aware money input: format-on-blur (`12` → `12.00` USD, `12` → `12` JPY) using `Intl.NumberFormat.resolvedOptions().maximumFractionDigits`
- Light + dark themes drawn from a warm cream-paper palette; `prefers-color-scheme`-driven
- Penny-exact split math; balance and itemized breakdown agree to the cent

## Local development

```sh
npm install
npm run dev
```

App runs at http://localhost:5173/expense-calculator/.

## Scripts

```sh
npm run dev          # vite dev server
npm run build        # production build (writes dist/ + 404.html SPA shim)
npm run preview      # preview the production build
npm run test         # vitest unit + component tests
npm run test:e2e     # playwright end-to-end
npm run typecheck    # tsc --noEmit
npm run lint         # eslint --max-warnings 0
npm run format       # prettier --write .
npm run format:check # prettier --check .
```

## Architecture

| Concern         | Choice                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| Framework       | Vite + React 19 + TypeScript                                                                            |
| Styling         | Tailwind v4 (CSS-first `@theme` tokens, no `tailwind.config.js`)                                        |
| State           | Zustand with localStorage persistence                                                                   |
| Routing         | None — single page; deep links resolved client-side via the URL hash fragment                           |
| Sharing         | `pako` gzip + `base64url`, encoded over a positional tuple (see `src/lib/url-share.ts`)                 |
| Animation       | `framer-motion`                                                                                         |
| Image export    | `html-to-image`                                                                                         |
| Tests           | Vitest (`happy-dom` + `@testing-library/react`) for unit/component, Playwright for E2E                  |
| Validation      | Zod schema (`src/lib/validation.ts`) — validates incoming share-URL data                                |
| Icons           | `lucide-react`                                                                                          |
| Typography      | Fraunces (italic display serif), Inter (body), JetBrains Mono (numerics/tags)                           |

## Deployment

GitHub Pages, auto-deployed on push to `main`:

- `.github/workflows/ci.yml` runs format-check → lint → typecheck → tests → e2e → build on every push and PR
- `.github/workflows/deploy.yml` is triggered by a successful CI run on `main` and uploads `dist/` to Pages

The Vite `base` is `/expense-calculator/`; the build copies `index.html` to `404.html` so deep links resolve client-side without a server redirect. Pages source must be set to "GitHub Actions" in repo settings → Pages.

## License

Personal project — not open for contributions.
