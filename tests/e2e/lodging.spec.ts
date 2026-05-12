import { test, expect } from '@playwright/test'

test('lodging — split by nights', async ({ page }) => {
  await page.goto('/')
  for (const name of ['Alice', 'Bob']) {
    await page.getByPlaceholder('Add a name').fill(name)
    await page.getByRole('button', { name: /^Add$/ }).click()
  }
  await page.getByRole('button', { name: /Add expense/ }).click()
  await page.getByRole('button', { name: 'Lodging' }).click()
  await page.getByLabel('Title', { exact: true }).fill('Airbnb')
  await page.getByLabel('Total', { exact: true }).fill('600')
  await page.getByLabel('nights for Alice').fill('4')
  await page.getByLabel('nights for Bob').fill('2')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Airbnb')).toBeVisible()
  // Settle up: Alice paid 600, Bob's share = 200, Alice's share = 400, so Bob → Alice = $200
  await expect(page.getByText('$200.00', { exact: true })).toBeVisible()
})
