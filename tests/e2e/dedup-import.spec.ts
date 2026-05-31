import { test, expect } from './fixtures'

test.describe('Import dedup — silent switch on re-import', () => {
  test('clicking the same share link twice silently switches without dialog', async ({ page }) => {
    await page.goto('/')

    const inPeopleList = (name: string) =>
      page.getByRole('button', { name: new RegExp(`^remove ${name}$`, 'i') })

    // Seed first entry — add Alice, grab the share URL
    await page.getByPlaceholder('Add a name').fill('Alice')
    await page.getByRole('button', { name: /^Add$/ }).click()
    await expect(inPeopleList('Alice')).toBeVisible()

    await page.getByRole('button', { name: 'Share' }).click()
    const shareUrl = await page.locator('input[readonly]').inputValue()
    await page.getByRole('button', { name: 'Close' }).click()

    // Create a second blank entry so the matching first is NOT active.
    const switcher = page.locator('header button[aria-haspopup="listbox"]:not([aria-label*="Currency"])')
    await switcher.click()
    await page.getByRole('button', { name: /New session/ }).click()
    // Visit the share URL — should silent-switch back to the Alice entry.
    await page.goto(shareUrl)
    await expect(inPeopleList('Alice')).toBeVisible()
    await expect(page.getByText(/Updated version of/)).toHaveCount(0)
  })
})
