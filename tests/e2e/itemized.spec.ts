import { test, expect } from '@playwright/test'

test('restaurant itemized — items + tax + tip', async ({ page }) => {
  await page.goto('/')
  for (const name of ['Alice', 'Bob']) {
    await page.getByPlaceholder('Add a name').fill(name)
    await page.getByRole('button', { name: /^Add$/ }).click()
  }
  await page.getByRole('button', { name: /Add expense/ }).click()
  await page.getByRole('button', { name: 'Restaurant' }).click()
  await page.getByLabel('Title', { exact: true }).fill('Pizza')
  // Form starts with one empty item by default.
  await page.getByLabel('item name').fill('Margherita')
  await page.getByLabel('item price').fill('30')
  await page.getByLabel(/assign Alice/i).check()
  await page.getByLabel(/assign Bob/i).check()
  await page.getByLabel('tax').fill('6')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Pizza')).toBeVisible()
})
