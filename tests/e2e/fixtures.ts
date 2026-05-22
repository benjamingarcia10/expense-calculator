import { test as base, expect } from '@playwright/test'

// These specs exercise core flows, not onboarding. Pre-set the onboarding flag
// before any page script runs so the first-run overlay doesn't block them.
// The dedicated onboarding spec imports straight from @playwright/test instead.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('expense-calculator-onboarding', '1')
    })
    // Playwright's fixture callback is named `use` — not the React `use` hook.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page)
  },
})

export { expect }
