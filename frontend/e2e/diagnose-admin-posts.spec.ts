import { test, expect } from '@playwright/test'

const BLOG_BASE = 'http://localhost:3001'

test('diagnose admin/posts state', async ({ page }) => {
  // Step 1: Login
  await page.goto(`${BLOG_BASE}/admin`, { waitUntil: 'domcontentloaded' })
  const emailInput = page.locator('[data-testid="auth-email-input"]')
  const passwordInput = page.locator('[data-testid="auth-password-input"]')
  const submitButton = page.locator('[data-testid="auth-submit-button"]')
  await emailInput.waitFor({ state: 'visible', timeout: 15000 })
  await emailInput.fill('admin@test.com')
  await passwordInput.fill('xK9#mP2$vL8@nQ5*wR4')
  await submitButton.click()
  await page.waitForFunction(
    () => {
      const modal = document.querySelector('[data-testid="auth-modal"]')
      if (!modal) return true
      return (modal as HTMLElement).offsetParent === null
    },
    { timeout: 15000 },
  )
  console.log('After login, URL:', page.url())

  // Step 2: Navigate to /admin/posts
  await page.goto(`${BLOG_BASE}/admin/posts`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  console.log('After goto /admin/posts, URL:', page.url())

  // Step 3: Check auth state
  const info = await page.evaluate(() => {
    const modal = document.querySelector('[data-testid="auth-modal"]')
    return {
      url: window.location.href,
      modalExists: !!modal,
      modalVisible: modal ? (modal as HTMLElement).offsetParent !== null : false,
      hasSpinner: !!document.querySelector('.animate-spin'),
      cookie: document.cookie.includes('refresh_token') ? 'has refresh_token' : 'no refresh_token',
      localStorage: localStorage.getItem('access_token') ? 'has token' : 'no token',
    }
  })
  console.log('State at /admin/posts:', JSON.stringify(info, null, 2))
  expect(info.modalVisible).toBe(false)
})
