# Expense Calculator

A standalone, static, single-page expense calculator for splitting bills with friends. No backend, no accounts, no database. All state lives in the browser; sessions are shared via URL hash.

Six split modes:

- **Equal** — even split among selected people
- **Shares** — proportional weights (e.g. 2:1:1)
- **Exact** — manually enter each person's amount, with live delta validation
- **Mileage** — split by miles, hours, or other units
- **Restaurant** — itemized bill with tax, tip, service fee
- **Lodging** — split by nights stayed; optional room tiers with different rates

## Local development

```sh
npm install
npm run dev
```

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
```

## Architecture

- Vite + React 19 + TypeScript
- Tailwind v4 (CSS-first `@theme` tokens, no `tailwind.config.js`)
- Zustand store with localStorage persistence
- framer-motion for transitions
- pako gzip + base64url for URL hash sharing
- html-to-image for the Summary screenshot export
- Vitest for unit/component tests; Playwright for E2E

## Deployment

GitHub Pages, auto-deployed on push to `main` via `.github/workflows/deploy.yml`. The Vite `base` is `/expense-calculator/`; the build copies `index.html` to `404.html` so deep links resolve client-side.

After the first push, enable Pages in the repo settings → "Build and deployment" → Source = "GitHub Actions".
