import { test, expect } from './fixtures'

// Each person renders a remove-button labelled "remove <name>" inside the
// People panel — that label is unique even when the switcher trigger now
// shows the same name (because the active entry is "Alice's split" when
// untitled). Using the aria-label keeps the assertion targeted at the
// people list specifically.
const inPeopleList = (page: import('@playwright/test').Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^remove ${name}$`, 'i') })

test('SessionSwitcher keyboard nav: ArrowDown + Enter selects', async ({ page }) => {
  await page.goto('/')

  await page.getByPlaceholder('Add a name').fill('Alice')
  await page.getByRole('button', { name: /^Add$/ }).click()
  await expect(inPeopleList(page, 'Alice')).toBeVisible()

  const switcher = page.getByRole('button', { name: /Untitled split|Alice/i }).first()
  await switcher.click()
  await page.getByRole('button', { name: /New session/ }).click()
  await page.getByPlaceholder('Add a name').fill('Bob')
  await page.getByRole('button', { name: /^Add$/ }).click()
  await expect(inPeopleList(page, 'Bob')).toBeVisible()

  // Open switcher; most-recent first means Bob entry is at index 0 (active),
  // Alice entry is index 1. ArrowDown moves focus, Enter selects.
  const switcher2 = page.getByRole('button', { name: /Bob/i }).first()
  await switcher2.click()
  await expect(page.getByRole('listbox')).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')

  await expect(inPeopleList(page, 'Alice')).toBeVisible()
  await expect(inPeopleList(page, 'Bob')).toHaveCount(0)
})
