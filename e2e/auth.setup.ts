import { test as setup, expect } from '@playwright/test'
import path from 'path'

const AUTH_FILE = path.join(__dirname, '.auth/user.json')

// Signs in using NextAuth's dev-credentials provider (only available in development).
// Requires a user with nickname "testuser" to exist in the database.
// To create one: POST /api/users with { nickname: 'testuser' } while authenticated via Kakao,
// or insert directly into the users table in Supabase for the dev environment.
setup('authenticate as testuser', async ({ page }) => {
  // Navigate to the NextAuth-provided sign-in page
  await page.goto('/api/auth/signin')

  // The NextAuth sign-in page shows providers — click "개발자 로그인 (Dev Only)"
  const devButton = page.getByRole('button', { name: /개발자 로그인/i }).or(
    page.getByRole('link', { name: /개발자 로그인/i })
  )
  await expect(devButton).toBeVisible({ timeout: 10_000 })
  await devButton.click()

  // Fill in the nickname credential form
  await page.getByLabel('닉네임').fill('testuser')
  await page.getByRole('button', { name: /sign in|로그인/i }).click()

  // Wait for redirect back to the app after successful sign-in
  await page.waitForURL('/', { timeout: 15_000 })

  // Save the authenticated session state
  await page.context().storageState({ path: AUTH_FILE })
})
