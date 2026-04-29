/**
 * Shared E2E Login Helper
 *
 * Authentication strategy:
 * 1. POST to /api/v1/auth/login with credentials (sets HttpOnly refresh_token cookie)
 * 2. Access token returned in JSON body
 * 3. Store access_token in localStorage
 * 4. Navigate to admin page — AuthInitializer and AdminLayout will pick up
 *    the HttpOnly cookie and localStorage token via their own initAuth() flow
 * 5. Poll for the admin sidebar to be visible (or auth modal to disappear)
 *
 * Why this works:
 * - HttpOnly cookie handles "automatic" auth via initAuth() on every page load
 * - localStorage token is the Zustand store's source of truth for the access token
 * - We do NOT use __E2E_INIT_AUTH__ — instead we let the normal app lifecycle handle it
 *   and poll for successful auth via DOM state
 */

import type { Page } from '@playwright/test'

const BLOG_BASE = 'http://localhost:3001'
const ADMIN_EMAIL = 'admin@test.com'
const ADMIN_PASSWORD = 'xK9#mP2$vL8@nQ5*wR4'

/**
 * Logs in as admin using pure API + localStorage approach.
 *
 * @param page - Playwright page
 * @param options.waitForAdmin - If true, waits for admin page content to be visible (default: true)
 */
export async function loginAdmin(
  page: Page,
  options: { waitForAdmin?: boolean } = {},
): Promise<void> {
  const { waitForAdmin = true } = options

  // Step 1: Navigate to establish valid origin
  await page.goto(`${BLOG_BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle')

  // Step 2: Call login API (sets HttpOnly cookie + returns access_token in body)
  const loginResult = await page.evaluate(
    async (creds: { email: string; password: string }) => {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
        credentials: 'include',
      })
      const data = await res.json()
      return { status: res.status, data }
    },
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  ) as { status: number; data: { access_token?: string; user?: Record<string, unknown>; error?: string } }

  if (loginResult.status !== 200 || !loginResult.data.access_token) {
    throw new Error(
      `Login API failed (${loginResult.status}): ${JSON.stringify(loginResult.data)}`,
    )
  }

  const { access_token: token, user } = loginResult.data
  if (!user) {
    throw new Error(`Login succeeded but no user returned`)
  }

  // Step 3: Store token in localStorage (Zustand store reads from here)
  await page.evaluate((t) => {
    localStorage.setItem('access_token', t)
  }, token)

  if (!waitForAdmin) {
    return
  }

  // Step 4: Navigate to admin page — let app lifecycle handle initAuth() automatically
  await page.goto(`${BLOG_BASE}/admin`, { waitUntil: 'domcontentloaded' })

  // Step 5: Poll for successful authentication by checking DOM state.
  const maxAttempts = 30 // 15 seconds total
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const ready = await page.evaluate(() => {
      const sidebar = document.querySelector('.admin-sidebar') as HTMLElement | null
      if (sidebar) {
        return 'ready'
      }

      const dialog = document.querySelector('[role="dialog"]') as HTMLElement | null
      if (dialog) {
        const style = window.getComputedStyle(dialog)
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          return 'waiting'
        }
      }

      return 'waiting'
    })

    if (ready === 'ready') {
      return
    }

    await page.waitForTimeout(500)
  }

  // Timeout reached — diagnostic
  const sidebarReady = await page.evaluate(() => {
    const sidebar = document.querySelector('.admin-sidebar') as HTMLElement | null
    if (!sidebar) return { found: false, reason: 'no element' }
    const style = window.getComputedStyle(sidebar)
    return {
      found: true,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
    }
  })

  const modalStillVisible = await page.evaluate(() => {
    const modal = document.querySelector('[data-testid="auth-modal"]') as HTMLElement | null
    if (!modal) return { found: false }
    const style = window.getComputedStyle(modal)
    return { found: true, display: style.display, visibility: style.visibility }
  })

  if (modalStillVisible.found && modalStillVisible.display !== 'none') {
    throw new Error(
      'loginAdmin timed out waiting for admin page to be ready — auth modal is still visible. ' +
      'Check that the backend is running and the admin credentials are correct.',
    )
  }

  const currentUrl = await page.evaluate(() => window.location.href)
  throw new Error(
    `loginAdmin timed out waiting for admin page to be ready — ` +
    `sidebar diagnostic: ${JSON.stringify(sidebarReady)}. ` +
    `Current URL: ${currentUrl}`,
  )
}

/**
 * Clears authentication state (logout).
 */
export async function logoutAdmin(page: Page): Promise<void> {
  if (page.url() === 'about:blank' || !page.url().startsWith('http')) {
    await page.goto(`${BLOG_BASE}/`, { waitUntil: 'domcontentloaded' })
  }
  try {
    await page.evaluate(() => {
      localStorage.removeItem('access_token')
    })
  } catch {
    // localStorage not accessible
  }
  await page.reload()
  await page.waitForLoadState('networkidle')
}
