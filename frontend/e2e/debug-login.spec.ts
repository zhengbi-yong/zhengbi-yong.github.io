import { test, expect } from '@playwright/test'

test('debug login flow', async ({ page }) => {
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')

  const loginResult = await page.evaluate(async () => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', password: 'xK9#mP2$vL8@nQ5*wR4' }),
        credentials: 'include',
      })
      const data = await res.json()
      return { status: res.status, hasToken: !!data.access_token }
    } catch (e) {
      return { error: e.message }
    }
  })
  console.log('Login result:', JSON.stringify(loginResult))

  await page.goto('http://localhost:3001/admin', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)

  const info = await page.evaluate(() => {
    const modal = document.querySelector('[data-testid="auth-modal"]')
    return {
      url: window.location.href,
      modalVisible: modal ? (modal as HTMLElement).offsetParent !== null : false,
      hasSpinner: !!document.querySelector('.animate-spin'),
    }
  })
  console.log('Admin page info:', JSON.stringify(info))
})
