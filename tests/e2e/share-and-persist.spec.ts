import { test, expect } from '@playwright/test'

test('URL share round-trip and localStorage persistence', async ({ page, context }) => {
  await page.goto('/')
  await page.getByPlaceholder('Add a name').fill('Alice')
  await page.getByRole('button', { name: /^Add$/ }).click()
  await page.getByRole('button', { name: /Add expense/ }).click()
  await page.getByRole('button', { name: 'Equal' }).click()
  await page.getByLabel('Title', { exact: true }).fill('Coffee')
  await page.getByLabel('Total', { exact: true }).fill('20')
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
  await expect(fresh.getByText('Coffee')).toBeVisible()
})
