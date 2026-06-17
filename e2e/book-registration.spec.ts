import { test, expect } from '@playwright/test'

test.describe('Book registration flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my')
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle')
  })

  test('My page loads for authenticated user', async ({ page }) => {
    await expect(page).not.toHaveURL(/login/)
    await expect(page.getByText(/내 책장|My Books/i)).toBeVisible()
  })

  test('opens register book popup when clicking register button', async ({ page }) => {
    const registerBtn = page.getByRole('button', { name: /책 등록|등록하기/i }).first()
    await expect(registerBtn).toBeVisible()
    await registerBtn.click()

    // Popup should appear
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('책 등록하기')).toBeVisible()
  })

  test('can search for a book and see results', async ({ page }) => {
    const registerBtn = page.getByRole('button', { name: /책 등록|등록하기/i }).first()
    await registerBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Type a search query
    await page.getByPlaceholder('제목 또는 저자를 검색하세요').fill('해리포터')
    await page.getByRole('button', { name: '검색' }).click()

    // Results dropdown should appear (requires real Kakao API key in dev env)
    await expect(page.locator('ul li').first()).toBeVisible({ timeout: 10_000 })
  })

  test('book appears in my books list after registration', async ({ page }) => {
    const registerBtn = page.getByRole('button', { name: /책 등록|등록하기/i }).first()
    await registerBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Search and select a book
    await page.getByPlaceholder('제목 또는 저자를 검색하세요').fill('해리포터')
    await page.getByRole('button', { name: '검색' }).click()
    await page.locator('ul li').first().click()

    // Submit
    await page.getByRole('button', { name: '등록하기' }).click()

    // Popup should close and book should appear in list
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('해리포터')).toBeVisible({ timeout: 10_000 })
  })
})
