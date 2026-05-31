import { test, expect } from './fixtures'

// Each person renders a "remove <name>" button in the People panel — that
// label is unique even though the switcher trigger now also surfaces the
// person's name when the title is a placeholder ("Alice's split").
const inPeopleList = (page: import('@playwright/test').Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^remove ${name}$`, 'i') })

test.describe('Updated-import dialog', () => {
  test('Replace updates the matched entry in place', async ({ page }) => {
    await page.goto('/')

    // Seed initial session — add Alice and capture the share URL
    await page.getByPlaceholder('Add a name').fill('Alice')
    await page.getByRole('button', { name: /^Add$/ }).click()
    await page.getByRole('button', { name: 'Share' }).click()
    const originalUrl = await page.locator('input[readonly]').inputValue()
    await page.getByRole('button', { name: 'Close' }).click()

    // Mutate locally (add Bob), grab the updated URL.
    await page.getByPlaceholder('Add a name').fill('Bob')
    await page.getByRole('button', { name: /^Add$/ }).click()
    await page.getByRole('button', { name: 'Share' }).click()
    const updatedUrl = await page.locator('input[readonly]').inputValue()
    await page.getByRole('button', { name: 'Close' }).click()

    expect(originalUrl).not.toBe(updatedUrl)

    await page.evaluate(() => localStorage.clear())
    await page.goto('about:blank')
    await page.goto(originalUrl)
    await expect(inPeopleList(page, 'Alice')).toBeVisible()
    await expect(inPeopleList(page, 'Bob')).toHaveCount(0)

    await page.goto(updatedUrl)
    await expect(page.getByText(/Updated version of/)).toBeVisible()

    await page.getByRole('button', { name: /^Replace$/ }).click()
    await expect(inPeopleList(page, 'Alice')).toBeVisible()
    await expect(inPeopleList(page, 'Bob')).toBeVisible()
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
    await expect(inPeopleList(page, 'Alice')).toBeVisible()
    await page.goto(updatedUrl)
    await expect(page.getByText(/Updated version of/)).toBeVisible()

    await page.getByRole('button', { name: /Keep both/ }).click()

    const switcher = page.locator('header button[aria-haspopup="listbox"]:not([aria-label*="Currency"])')
    await switcher.click()
    const dropdown = page.getByRole('listbox')
    const rows = await dropdown.getByRole('option').count()
    expect(rows).toBe(3)
  })
})
