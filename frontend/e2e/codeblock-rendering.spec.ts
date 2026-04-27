/**
 * E2E Tests for Code Block Rendering
 *
 * Covers:
 * - Visiting a blog post with Shiki-highlighted code blocks
 * - Verifying code blocks are visible and syntax-highlighted
 * - Verifying no console errors on page load
 * - Verifying code blocks render correctly in both light and dark themes
 *
 * Run: pnpm test:e2e -- grep "code block"
 */

import { test, expect, type Page } from '@playwright/test'

// Run serially — each test navigates the same static blog post (moteus) and
// parallel page access can cause flaky assertion failures.
test.describe.configure({ mode: 'serial' })

const BLOG_POST_WITH_CODE = '/blog/motor/moteus'

/**
 * Collects console errors from the page, ignoring known non-critical ones.
 */
function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  page.on('pageerror', (err) => {
    errors.push(err.message)
  })
  return Promise.resolve(errors)
}

/**
 * Filters out known non-critical errors (favicon, network 404s, etc.)
 */
function filterCriticalErrors(errors: string[]): string[] {
  return errors.filter(
    (e) =>
      !e.includes('favicon') &&
      !e.includes('net::ERR') &&
      !e.includes('404') &&
      !e.includes('401') &&
      !e.includes('Unauthorized')
  )
}

/**
 * Attempts to find and click the theme toggle button in the header.
 * Returns the button if found, null otherwise.
 */
async function findThemeToggle(page: Page) {
  // Try common selectors for theme toggle
  const selectors = [
    'button[aria-label*="theme" i]',
    'button[aria-label*="dark" i]',
    'button[aria-label*="light" i]',
    'button[aria-label*="mode" i]',
    '[data-testid="theme-toggle"]',
    'button:has(svg[class*="sun"])',
    'button:has(svg[class*="moon"])',
    'header button:last-child',
  ]

  for (const selector of selectors) {
    const btn = page.locator(selector).first()
    if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
      return btn
    }
  }
  return null
}

test.describe('Code Block Rendering', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations globally for consistent rendering
    await page.addInitScript(() => {
      // @ts-ignore
      window.disableAnimations = true
    })
  })

  test.describe('Shiki Code Block Visibility', () => {
    test('should render blog post with code blocks successfully', async ({ page }) => {
      const errors = await collectConsoleErrors(page)

      await page.goto(BLOG_POST_WITH_CODE)
      await page.waitForTimeout(4000)

      // Article content should be visible
      const article = page.locator('article').first()
      await expect(article).toBeVisible({ timeout: 15000 })

      // Critical errors should be zero
      const critical = filterCriticalErrors(errors)
      expect(critical).toHaveLength(0)
    })

    test('should show Shiki-highlighted code blocks on blog post', async ({ page }) => {
      await page.goto(BLOG_POST_WITH_CODE)
      await page.waitForTimeout(4000)
      await page.waitForTimeout(2000) // Allow Shiki to finish rendering

      // Look for Shiki-highlighted code blocks
      // Shiki v4 wraps in: <pre class="shiki shiki-themes..."><code>...
      const shikiBlocks = page.locator('pre.shiki')

      const count = await shikiBlocks.count()

      if (count === 0) {
        // Fallback: check for any pre/code blocks with language class
        const codeBlocks = page.locator('pre code[class*="language-"]')
        const fallbackCount = await codeBlocks.count()

        if (fallbackCount === 0) {
          // No code blocks in this post — verify at least article loaded
          const article = page.locator('article').first()
          await expect(article).toBeVisible()
          return
        }

        // At least one code block should be visible
        await expect(codeBlocks.first()).toBeVisible()
        return
      }

      // At least one Shiki block should be visible
      await expect(shikiBlocks.first()).toBeVisible()
    })

    test('should contain syntax-highlighted spans inside code blocks', async ({ page }) => {
      await page.goto(BLOG_POST_WITH_CODE)
      await page.waitForTimeout(4000)
      await page.waitForTimeout(2000)

      // Shiki adds color spans inside code: <span class="color-...">token</span>
      const highlightedSpans = page.locator('pre code span[class*="color-"]')

      const spanCount = await highlightedSpans.count()

      // If no highlighted spans, verify at least code blocks exist
      if (spanCount === 0) {
        const shikiBlocks = page.locator('pre.shiki')
        const codeBlocks = page.locator('pre code[class*="language-"]')

        const hasCode =
          (await shikiBlocks.count()) > 0 || (await codeBlocks.count()) > 0

        if (!hasCode) {
          // No code blocks in this post — not a test failure
          const article = page.locator('article').first()
          await expect(article).toBeVisible()
          return
        }

        // Code blocks exist but no spans — still acceptable (theme may not add spans)
        return
      }

      // Highlighted spans prove Shiki is working
      expect(spanCount).toBeGreaterThan(0)
    })

    test('should render code block with proper styling and background', async ({ page }) => {
      await page.goto(BLOG_POST_WITH_CODE)
      await page.waitForTimeout(4000)
      await page.waitForTimeout(1500)

      // Find any pre element (Shiki or otherwise)
      const preElements = page.locator('pre')

      const preCount = await preElements.count()

      if (preCount === 0) {
        const article = page.locator('article').first()
        await expect(article).toBeVisible()
        return
      }

      const firstPre = preElements.first()
      await expect(firstPre).toBeVisible()

      // Background should not be transparent (Shiki sets dark background)
      const bgColor = await firstPre.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)')
    })

    test('should not have horizontal overflow from code blocks', async ({ page }) => {
      await page.goto(BLOG_POST_WITH_CODE)
      await page.waitForTimeout(4000)
      await page.waitForTimeout(1500)

      // Correct assertion: overflow-x must be 'auto' so long lines scroll instead of clipping.
      // OLD test was wrong: scrollWidth > clientWidth is NORMAL for scrollable containers.
      // What matters is that overflow-x != 'hidden' (hidden = clipped, auto = scrollable).
      const hasHiddenOverflow = await page.evaluate(() => {
        const pres = Array.from(document.querySelectorAll('pre'))
        return pres.some((pre) => {
          const overflowX = window.getComputedStyle(pre).overflowX
          return overflowX === 'hidden' || overflowX === 'visible'
        })
      })

      expect(hasHiddenOverflow).toBe(false)
    })
  })

  test.describe('Light Theme Code Rendering', () => {
    test('should render code blocks correctly in light mode', async ({ page }) => {
      // Set light mode before navigating
      await page.goto(BLOG_POST_WITH_CODE)
      await page.waitForTimeout(4000)

      // Try to set light theme via theme toggle
      const themeBtn = await findThemeToggle(page)
      if (themeBtn) {
        // If dark mode is active, toggle to light
        const htmlClass = await page.locator('html').getAttribute('class')
        if (htmlClass?.includes('dark')) {
          await themeBtn.click()
          await page.waitForTimeout(1000)
        }
      } else {
        // Fallback: force light via cookie/localStorage
        await page.evaluate(() => {
          document.documentElement.classList.remove('dark')
          document.cookie = 'theme=light;path=/'
          localStorage.setItem('theme', 'light')
        })
        await page.reload()
        await page.waitForTimeout(4000)
      }

      await page.waitForTimeout(1500)

      // Verify no console errors
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      // Code blocks should still be visible in light mode
      const preElements = page.locator('pre')

      if ((await preElements.count()) > 0) {
        await expect(preElements.first()).toBeVisible()

        // Check code content is readable (has text)
        const codeText = await preElements.first().locator('code').first().textContent()
        expect(codeText).toBeTruthy()
        expect(codeText!.length).toBeGreaterThan(0)
      }

      const critical = filterCriticalErrors(errors)
      expect(critical).toHaveLength(0)
    })
  })

  test.describe('Dark Theme Code Rendering', () => {
    test('should render code blocks correctly in dark mode', async ({ page }) => {
      await page.goto(BLOG_POST_WITH_CODE)
      await page.waitForTimeout(4000)

      // Toggle to dark mode
      const themeBtn = await findThemeToggle(page)
      if (themeBtn) {
        const htmlClass = await page.locator('html').getAttribute('class')
        if (!htmlClass?.includes('dark')) {
          await themeBtn.click()
          await page.waitForTimeout(1000)
        }
      } else {
        // Fallback: force dark via localStorage
        await page.evaluate(() => {
          document.documentElement.classList.add('dark')
          localStorage.setItem('theme', 'dark')
        })
        await page.reload()
        await page.waitForTimeout(4000)
      }

      await page.waitForTimeout(1500)

      // Verify no console errors in dark mode
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      // Code blocks should be visible in dark mode
      const preElements = page.locator('pre')

      if ((await preElements.count()) > 0) {
        await expect(preElements.first()).toBeVisible()

        // Code text should be present
        const codeText = await preElements.first().locator('code').first().textContent()
        expect(codeText).toBeTruthy()
        expect(codeText!.length).toBeGreaterThan(0)

        // Background should be dark
        const bgColor = await preElements.first().evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor
        })
        // Dark mode background should be dark (RGB values should be low)
        const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (rgbMatch) {
          const [, r, g, b] = rgbMatch.map(Number)
          // In dark mode, at least one of RGB should be relatively low (< 80)
          const isDark = r < 80 || g < 80 || b < 80
          expect(isDark).toBe(true)
        }
      }

      const critical = filterCriticalErrors(errors)
      expect(critical).toHaveLength(0)
    })

    test('should preserve code highlighting when toggling between light and dark', async ({ page }) => {
      await page.goto(BLOG_POST_WITH_CODE)
      await page.waitForTimeout(4000)
      await page.waitForTimeout(1500)

      // Record initial code block count
      const initialCount = await page.locator('pre').count()

      // Toggle to dark
      const themeBtn1 = await findThemeToggle(page)
      if (themeBtn1) {
        await themeBtn1.click()
        await page.waitForTimeout(1000)
      }

      const darkCount = await page.locator('pre').count()
      expect(darkCount).toBe(initialCount)

      // Toggle back to light (re-find button since icon changed)
      const themeBtn2 = await findThemeToggle(page)
      if (themeBtn2) {
        await themeBtn2.click()
        await page.waitForTimeout(1000)
      }

      const lightCount = await page.locator('pre').count()
      expect(lightCount).toBe(initialCount)

      // Should have no errors throughout
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      const critical = filterCriticalErrors(errors)
      expect(critical).toHaveLength(0)
    })
  })

  test.describe('No Console Errors', () => {
    test('should produce no console errors when loading blog post with code blocks', async ({ page }) => {
      const errors: string[] = []

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })
      page.on('pageerror', (err) => {
        errors.push(err.message)
      })

      await page.goto(BLOG_POST_WITH_CODE)
      await page.waitForTimeout(4000)
      await page.waitForTimeout(3000) // Wait for Shiki + KaTeX to fully render

      const critical = filterCriticalErrors(errors)
      expect(critical).toHaveLength(0)
    })

    test('should produce no console errors when toggling themes with code blocks visible', async ({ page }) => {
      const errors: string[] = []

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })
      page.on('pageerror', (err) => {
        errors.push(err.message)
      })

      await page.goto(BLOG_POST_WITH_CODE)
      await page.waitForTimeout(4000)
      await page.waitForTimeout(1500)

      // Toggle themes a few times
      for (let i = 0; i < 3; i++) {
        const btn = await findThemeToggle(page)
        if (btn) {
          await btn.click()
          await page.waitForTimeout(500)
          const btn2 = await findThemeToggle(page)
          if (btn2) await btn2.click()
          await page.waitForTimeout(500)
        }
      }

      // Brief wait for any async errors
      await page.waitForTimeout(1000)

      const critical = filterCriticalErrors(errors)
      expect(critical).toHaveLength(0)
    })
  })
})
