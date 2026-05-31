import { test, expect } from './fixtures'

// Person-name assertions scoped to the People panel's remove-button labels —
// otherwise the switcher trigger's "X's split" placeholder collides with the
// person's name in the People list.
const inPeopleList = (page: import('@playwright/test').Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^remove ${name}$`, 'i') })

test.describe('Sessions library', () => {
  test('create three sessions, switch between them, delete one', async ({ page }) => {
    await page.goto('/')

    // Always re-acquire the switcher: its accessible name is the active
    // session label which changes as we add people / switch entries.
    const switcher = () =>
      page.locator('header button[aria-haspopup="listbox"]:not([aria-label*="Currency"])')

    // Seed entry 1
    await page.getByPlaceholder('Add a name').fill('Alice')
    await page.getByRole('button', { name: /^Add$/ }).click()
    await expect(inPeopleList(page, 'Alice')).toBeVisible()

    // Create entry 2
    await switcher().click()
    await page.getByRole('button', { name: /New session/ }).click()
    await expect(inPeopleList(page, 'Alice')).toHaveCount(0)
    await page.getByPlaceholder('Add a name').fill('Bob')
    await page.getByRole('button', { name: /^Add$/ }).click()
    await expect(inPeopleList(page, 'Bob')).toBeVisible()

    // Create entry 3
    await switcher().click()
    await page.getByRole('button', { name: /New session/ }).click()
    await expect(inPeopleList(page, 'Bob')).toHaveCount(0)
    await page.getByPlaceholder('Add a name').fill('Carol')
    await page.getByRole('button', { name: /^Add$/ }).click()
    await expect(inPeopleList(page, 'Carol')).toBeVisible()

    // Switch back to entry 1 via dropdown. Most-recent-first: Carol entry,
    // Bob entry, Alice entry. Entry rows are role="option".
    await switcher().click()
    const dropdown = page.getByRole('listbox')
    await dropdown.getByRole('option').nth(2).click()
    await expect(inPeopleList(page, 'Alice')).toBeVisible()

    // Open manage library, delete the Bob entry. Default label is "Bob's split".
    await switcher().click()
    await page.getByRole('button', { name: /Manage library/ }).click()
    await page.getByLabel(/More actions for Bob's split/i).click()
    await page.getByRole('menuitem', { name: /Delete/i }).click()
    await page.getByRole('button', { name: /^Delete$/ }).click()

    await page.keyboard.press('Escape')
    await switcher().click()
    const remaining = await page.getByRole('listbox').getByRole('option').count()
    expect(remaining).toBe(2)
  })
})
