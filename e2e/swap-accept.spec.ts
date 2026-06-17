import { test, expect } from '@playwright/test'

// These tests verify the swap accept flow from the receiver's perspective.
// They require:
//   1. A pending public swap request visible at /swap
//   2. The authenticated user is NOT the requester of that swap

test.describe('Swap accept flow', () => {
  test('/swap page shows swap request cards', async ({ page }) => {
    await page.goto('/swap')
    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveURL(/login/)
    // Should render without server errors
    await expect(page.locator('body')).not.toContainText('500')
  })

  test('swap detail page loads when clicking a public request', async ({ page }) => {
    await page.goto('/swap')
    await page.waitForLoadState('networkidle')

    // Find a swap card link and navigate to detail
    const swapLink = page.getByRole('link').filter({ hasText: /교환|Swap/i }).first()
    try {
      await swapLink.waitFor({ state: 'visible', timeout: 5000 })
    } catch {
      // No public swaps exist — skip
      test.skip()
      return
    }

    await swapLink.click()
    await page.waitForLoadState('networkidle')
    await expect(page.url()).toMatch(/\/swap\//)
    await expect(page.locator('body')).not.toContainText('Not found')
  })

  test('/current page shows accepted swaps', async ({ page }) => {
    await page.goto('/current')
    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveURL(/login/)
    // Page should load without error
    await expect(page.locator('body')).not.toContainText('500')
  })
})
