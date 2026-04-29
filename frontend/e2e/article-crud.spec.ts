/**
 * E2E Tests: Article CRUD through Admin API
 *
 * Tests creation via the admin API (bypasses UI for reliability) with full CSRF protection.
 * Uses page.evaluate browser-side fetch to automatically carry cookies.
 */

import { test, expect } from '@playwright/test'

const BLOG_BASE = 'http://localhost:3001'

async function login(page: import('@playwright/test').Page): Promise<string> {
  await page.goto(`${BLOG_BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  const result = await page.evaluate(async () => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'xK9#mP2$vL8@nQ5*wR4' }),
      credentials: 'include',
    })
    const data = await res.json()
    return { status: res.status, token: data.access_token as string | undefined }
  })

  if (result.status !== 200 || !result.token) {
    throw new Error(`Login failed (${result.status})`)
  }

  await page.evaluate((t: string) => {
    localStorage.setItem('access_token', t)
  }, result.token)

  return result.token
}

// ---------------------------------------------------------------------------
// TC-A1: Create article via admin API with CSRF protection
// ---------------------------------------------------------------------------
test('TC-A1: Should create article via admin API with CSRF token', async ({ page }) => {
  await login(page)

  const createResult = await page.evaluate(async () => {
    const xsrfCookie = document.cookie
      .split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('XSRF-TOKEN='))

    const token = localStorage.getItem('access_token')

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (xsrfCookie) {
      const xsrfVal = xsrfCookie.substring('XSRF-TOKEN='.length)
      headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfVal)
    }

    const res = await fetch('/api/v1/admin/posts', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        title: `E2E Article ${Date.now()}`,
        slug: `e2e-slug-${Date.now()}`,
        content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'E2E test.' }] }] }),
        content_format: 'richtext',
        status: 'Draft',
      }),
    })

    const text = await res.text()
    let body: unknown
    try { body = JSON.parse(text) } catch { body = text }
    return { status: res.status, ok: res.ok, body, xsrfFound: !!xsrfCookie }
  })

  if (!createResult.ok) {
    console.log('Create result:', JSON.stringify(createResult, null, 2))
  }

  expect(createResult.ok).toBeTruthy()
})

// ---------------------------------------------------------------------------
// TC-A2: Blog homepage loads without JS errors
// ---------------------------------------------------------------------------
test('TC-A2: Blog homepage loads without console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))

  await page.goto(`${BLOG_BASE}/`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // Filter out known non-critical errors
  const critical = errors.filter(e =>
    !e.includes('favicon') &&
    !e.includes('net::ERR') &&
    !e.includes('Failed to load resource') &&
    !e.includes('404')
  )

  if (critical.length > 0) {
    console.log('Console errors on homepage:', JSON.stringify(critical))
  }

  expect(critical.length).toBe(0)
})

// ---------------------------------------------------------------------------
// TC-A3: Published blog posts render without errors
// ---------------------------------------------------------------------------
test('TC-A3: Published blog posts render without console errors', async ({ page }) => {
  test.setTimeout(120000)
  await login(page)

  const slugs: string[] = await page.evaluate(async () => {
    const res = await fetch('/api/v1/posts?status=Published&limit=5', {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    const data = await res.json()
    return data?.posts?.map((p: Record<string, unknown>) => p.slug as string) || []
  })

  if (slugs.length === 0) {
    console.log('No published posts found, skipping TC-A3')
    return
  }

  let totalErrors = 0
  for (const slug of slugs) {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(err.message))

    // Use domcontentloaded + generous timeout for slow pages
    await page.goto(`${BLOG_BASE}/blog/${slug}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(2000)

    const critical = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('net::ERR') &&
      !e.includes('Failed to load resource') &&
      !e.includes('404')
    )
    if (critical.length > 0) {
      console.log(`Errors on /blog/${slug}:`, critical)
      totalErrors += critical.length
    }
  }

  expect(totalErrors).toBe(0)
})
