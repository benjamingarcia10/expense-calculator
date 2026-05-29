import { test, expect } from './fixtures'

test('SessionSwitcher keyboard nav: ArrowDown + Enter selects', async ({ page }) => {
  await page.goto('/')

  // Add a person to entry 1 (so it has identifying content)
  await page.getByPlaceholder('Add a name').fill('Alice')
  await page.getByRole('button', { name: /^Add$/ }).click()
  await expect(page.getByText('Alice')).toBeVisible()

  // Create entry 2 via switcher
  const switcher = page.getByRole('button', { name: /Untitled split/i }).first()
  await switcher.click()
  await page.getByRole('button', { name: /New session/ }).click()
  await page.getByPlaceholder('Add a name').fill('Bob')
  await page.getByRole('button', { name: /^Add$/ }).click()
  await expect(page.getByText('Bob')).toBeVisible()

  // Open the switcher (most-recent first: Bob entry, then Alice entry).
  // Initial focus is on the active row (Bob = index 0).
  await switcher.click()
  await expect(page.getByRole('listbox')).toBeVisible()

  // ArrowDown moves focus to the Alice row; Enter selects it.
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')

  // We should now be on the Alice entry (Bob hidden).
  await expect(page.getByText('Alice')).toBeVisible()
  await expect(page.getByText('Bob')).toHaveCount(0)
})
