import { test, expect } from './fixtures'

test.describe('Import dedup — silent switch on re-import', () => {
  test('clicking the same share link twice silently switches without dialog', async ({ page }) => {
    await page.goto('/')

    // Seed first entry — add Alice, grab the share URL
    await page.getByPlaceholder('Add a name').fill('Alice')
    await page.getByRole('button', { name: /^Add$/ }).click()
    await expect(page.getByText('Alice')).toBeVisible()

    await page.getByRole('button', { name: 'Share' }).click()
    const shareUrl = await page.locator('input[readonly]').inputValue()
    await page.getByRole('button', { name: 'Close' }).click()

    // Create a second blank entry so the matching first is NOT active.
    // The switcher trigger renders the active session's title (untitled by default).
    const switcher = page.getByRole('button', { name: /Untitled split/i }).first()
    await switcher.click()
    await page.getByRole('button', { name: /New session/ }).click()
    // The active entry is now blank. Visit the share URL — should silent-switch
    // back to the Alice entry. No "Updated version of" dialog should appear.
    await page.goto(shareUrl)
    await expect(page.getByText('Alice')).toBeVisible()
    await expect(page.getByText(/Updated version of/)).toHaveCount(0)
  })
})
