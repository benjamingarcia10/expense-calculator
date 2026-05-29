import { test, expect } from './fixtures'

test.describe('Updated-import dialog', () => {
  test('Replace updates the matched entry in place', async ({ page }) => {
    await page.goto('/')

    // Seed initial session — add Alice and capture the share URL
    await page.getByPlaceholder('Add a name').fill('Alice')
    await page.getByRole('button', { name: /^Add$/ }).click()
    await page.getByRole('button', { name: 'Share' }).click()
    const originalUrl = await page.locator('input[readonly]').inputValue()
    await page.getByRole('button', { name: 'Close' }).click()

    // Mutate locally (add Bob), grab the updated URL. The sessionId is
    // already minted on the first share, so the second URL carries the
    // same sessionId with different content — this is what triggers the
    // "Updated version of" dialog when re-imported.
    await page.getByPlaceholder('Add a name').fill('Bob')
    await page.getByRole('button', { name: /^Add$/ }).click()
    await page.getByRole('button', { name: 'Share' }).click()
    const updatedUrl = await page.locator('input[readonly]').inputValue()
    await page.getByRole('button', { name: 'Close' }).click()

    expect(originalUrl).not.toBe(updatedUrl)

    // Simulate a different device: wipe localStorage, navigate to a blank
    // page to ensure the SPA's in-memory state is dropped, then visit the
    // original share URL. After that, visit the updated URL — sessionId
    // matches but content differs, so the "Updated version of" dialog appears.
    await page.evaluate(() => localStorage.clear())
    await page.goto('about:blank')
    await page.goto(originalUrl)
    await expect(page.getByText('Alice')).toBeVisible()
    await expect(page.getByText('Bob')).toHaveCount(0)

    await page.goto(updatedUrl)
    await expect(page.getByText(/Updated version of/)).toBeVisible()

    await page.getByRole('button', { name: /^Replace$/ }).click()
    await expect(page.getByText('Alice')).toBeVisible()
    await expect(page.getByText('Bob')).toBeVisible()
  })

  test('Keep both creates a second entry', async ({ page }) => {
    await page.goto('/')

    await page.getByPlaceholder('Add a name').fill('Alice')
    await page.getByRole('button', { name: /^Add$/ }).click()
    await page.getByRole('button', { name: 'Share' }).click()
    const originalUrl = await page.locator('input[readonly]').inputValue()
    await page.getByRole('button', { name: 'Close' }).click()

    await page.getByPlaceholder('Add a name').fill('Bob')
    await page.getByRole('button', { name: /^Add$/ }).click()
    await page.getByRole('button', { name: 'Share' }).click()
    const updatedUrl = await page.locator('input[readonly]').inputValue()
    await page.getByRole('button', { name: 'Close' }).click()

    await page.evaluate(() => localStorage.clear())
    await page.goto('about:blank')
    await page.goto(originalUrl)
    // Wait for the originalUrl import to settle before navigating again —
    // otherwise the updated import sees a fresh library and creates a new
    // entry without a sessionId match (no dialog).
    await expect(page.getByText('Alice')).toBeVisible()
    await page.goto(updatedUrl)
    await expect(page.getByText(/Updated version of/)).toBeVisible()

    await page.getByRole('button', { name: /Keep both/ }).click()

    // After Keep-both, the new entry (with the imported suffix) is active.
    // Open the switcher and confirm two non-action rows.
    const switcher = page.getByRole('button', { name: /imported|Untitled split/i }).first()
    await switcher.click()
    const dropdown = page.getByRole('listbox')
    // The listbox holds the entry rows (buttons whose names contain titles)
    // plus the New/Manage footer actions.
    const rows = await dropdown.getByRole('button').count()
    // 3 entries (initial blank after wipe + Alice import + Keep-both copy) + 2 footer actions
    expect(rows).toBe(5)
  })
})
