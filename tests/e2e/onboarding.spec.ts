import { test, expect } from '@playwright/test'
import { APP_NAME } from '../../src/lib/branding'

// Imports from @playwright/test directly (not ./fixtures) so the onboarding
// flag is NOT pre-set — these specs need the first-run overlay to appear.
// The brand name comes from the single-source-of-truth `lib/branding` module
// so whitelabel changes don't break these assertions.

const WELCOME = `Welcome to ${APP_NAME}`

test('first-run tour can be stepped through and completed', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: WELCOME })).toBeVisible()

  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('heading', { name: 'Start with the people' })).toBeVisible()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Get started' }).click()

  await expect(page.getByRole('heading', { name: WELCOME })).toBeHidden()

  // App is usable once the tour closes.
  await page.getByPlaceholder('Add a name').fill('Alice')
  await page.getByRole('button', { name: /^Add$/ }).click()
  await expect(page.getByText('Alice')).toBeVisible()

  // Tour does not reappear after a reload.
  await page.reload()
  await expect(page.getByRole('heading', { name: WELCOME })).toBeHidden()
})

test('first-run tour can be skipped', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: WELCOME })).toBeVisible()
  await page.getByRole('button', { name: 'Skip' }).click()
  await expect(page.getByRole('heading', { name: WELCOME })).toBeHidden()
})
