import { test, expect } from './fixtures'

test.describe('Sessions library', () => {
  test('create three sessions, switch between them, delete one', async ({ page }) => {
    await page.goto('/')

    // The SessionSwitcher trigger lives in the desktop header. The
    // accessible name of the trigger is the active session's title (or
    // "Untitled split" when blank), followed by the chevron icon.
    const switcher = page.getByRole('button', { name: /Untitled split/i }).first()

    // Seed entry 1 — add a person so it's distinguishable
    await page.getByPlaceholder('Add a name').fill('Alice')
    await page.getByRole('button', { name: /^Add$/ }).click()
    await expect(page.getByText('Alice')).toBeVisible()

    // Create entry 2 via the switcher → New session
    await switcher.click()
    await page.getByRole('button', { name: /New session/ }).click()
    // Now active is a fresh blank entry — Alice should not be visible
    await expect(page.getByText('Alice')).toHaveCount(0)
    await page.getByPlaceholder('Add a name').fill('Bob')
    await page.getByRole('button', { name: /^Add$/ }).click()
    await expect(page.getByText('Bob')).toBeVisible()

    // Create entry 3
    await switcher.click()
    await page.getByRole('button', { name: /New session/ }).click()
    await expect(page.getByText('Alice')).toHaveCount(0)
    await expect(page.getByText('Bob')).toHaveCount(0)
    await page.getByPlaceholder('Add a name').fill('Carol')
    await page.getByRole('button', { name: /^Add$/ }).click()
    await expect(page.getByText('Carol')).toBeVisible()

    // Switch back to entry 1 via dropdown — most-recent-first order means
    // the current (Carol) is at the top, then Bob, then Alice
    await switcher.click()
    const dropdown = page.getByRole('listbox')
    await dropdown.getByRole('button').nth(2).click()
    await expect(page.getByText('Alice')).toBeVisible()

    // Open manage library, delete the Bob entry
    await switcher.click()
    await page.getByRole('button', { name: /Manage library/ }).click()
    // Find the row whose title is the second entry (Bob never had a title,
    // so it's "Untitled split"). The manage row's More-actions button is
    // labelled "More actions for Untitled split".
    await page
      .getByLabel(/More actions for Untitled split/i)
      .first()
      .click()
    await page.getByRole('menuitem', { name: /Delete/i }).click()
    await page.getByRole('button', { name: /^Delete$/ }).click()

    // After delete the entry count in the switcher list drops by one.
    // Close the manage sheet (via close button or Escape) before opening switcher.
    await page.keyboard.press('Escape')
    await switcher.click()
    const remaining = await page.getByRole('listbox').getByRole('button').count()
    // Listbox includes the entry rows plus the two footer actions (New + Manage)
    expect(remaining).toBe(2 + 2)
  })
})
