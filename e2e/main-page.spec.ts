import { test, expect } from '@playwright/test'

test.describe('Main page', () => {
  test('shows hero section and navigation', async ({ page }) => {
    await page.goto('/')
    // Hero badge
    await expect(page.getByText('Swap Books')).toBeVisible()
    // How-it-works steps
    await expect(page.getByText('Register')).toBeVisible()
    await expect(page.getByText('Read & Share')).toBeVisible()
  })

  test('shows public swap requests section', async ({ page }) => {
    await page.goto('/')
    // The section heading
    await expect(page.getByText(/공개 교환 모집|Public Request/i)).toBeVisible()
  })

  test('authenticated user sees navigation links', async ({ page }) => {
    await page.goto('/')
    // Header should show My page link for authenticated users
    await expect(page.getByRole('link', { name: /My|마이/i })).toBeVisible()
  })

  test('recent books section loads', async ({ page }) => {
    await page.goto('/')
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle')
    // Page should not show loading errors
    await expect(page.locator('body')).not.toContainText('Error')
    await expect(page.locator('body')).not.toContainText('500')
  })
})
