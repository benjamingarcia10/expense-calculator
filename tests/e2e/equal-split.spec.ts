import { test, expect } from '@playwright/test'

test('equal split — three people, one expense', async ({ page }) => {
  await page.goto('/')

  for (const name of ['Alice', 'Bob', 'Carol']) {
    await page.getByPlaceholder('Add a name').fill(name)
    await page.getByRole('button', { name: /^Add$/ }).click()
  }
  await expect(page.getByRole('heading', { name: 'People', level: 2 })).toBeVisible()
  await expect(page.getByText('Carol')).toBeVisible()

  await page.getByRole('button', { name: /Add expense/ }).click()
  await page.getByRole('button', { name: 'Equal' }).click()
  await page.getByLabel('Title', { exact: true }).fill('Dinner')
  await page.getByLabel('Total', { exact: true }).fill('90')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('Settle Up')).toBeVisible()
  await expect(page.getByText('$30.00').first()).toBeVisible()
})
