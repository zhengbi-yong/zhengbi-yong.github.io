import { expect, test } from '@playwright/test'

const trendingKeywords = [
  { keyword: 'Rust', count: 12 },
  { keyword: 'Chemistry', count: 7 },
]

const searchResults = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'rust-ownership-guide',
    title: 'Rust Ownership Guide',
    summary: 'A practical introduction to ownership, borrowing, and lifetimes.',
    published_at: '2026-03-20T08:00:00Z',
    rank: 1,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    slug: 'rust-axum-search',
    title: 'Building Search with Axum',
    summary: 'How to wire Meilisearch into an Axum backend.',
    published_at: '2026-03-18T08:00:00Z',
    rank: 0.9,
  },
]

test.describe('Search Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/search/trending', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(trendingKeywords),
      })
    })

    await page.route('**/api/v1/search/suggest?*', async (route) => {
      const requestUrl = new URL(route.request().url())
      const query = requestUrl.searchParams.get('q')?.toLowerCase() || ''

      const suggestions =
        query.length >= 2 ? ['Rust Ownership Guide', 'Building Search with Axum'] : []

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(suggestions),
      })
    })

    await page.route('**/api/v1/search?*', async (route) => {
      const requestUrl = new URL(route.request().url())
      const query = requestUrl.searchParams.get('q')?.toLowerCase() || ''

      const body =
        query.length >= 2
          ? { results: searchResults, total: searchResults.length, query }
          : { results: [], total: 0, query }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      })
    })
  })

  test('shows trending keywords before a search starts', async ({ page }) => {
    await page.goto('/search')

    await expect(page.getByTestId('search-input')).toBeVisible()
    await expect(page.getByTestId('search-trending-chip')).toHaveCount(2)
    await expect(page.getByTestId('search-trending-chip').first()).toContainText('Rust')
  })

  test('renders debounced suggestions and results for a query', async ({ page }) => {
    await page.goto('/search')

    await page.getByTestId('search-input').fill('rust')

    await expect(page).toHaveURL(/\/search\?q=rust/)
    await expect(page.getByTestId('search-suggestion-chip')).toHaveCount(2)
    await expect(page.getByTestId('search-result-card')).toHaveCount(2)
    await expect(page.getByTestId('search-result-card').first()).toContainText(
      'Rust Ownership Guide'
    )
    await expect(page.getByTestId('search-status')).toContainText('2 matching posts')
  })

  test('reuses a suggestion chip to update the active query', async ({ page }) => {
    await page.goto('/search')

    await page.getByTestId('search-input').fill('ru')
    await expect(page.getByTestId('search-suggestion-chip').first()).toBeVisible()

    await page.getByTestId('search-suggestion-chip').first().click()

    await expect(page.getByTestId('search-input')).toHaveValue('Rust Ownership Guide')
    await expect(page).toHaveURL(/\/search\?q=Rust%20Ownership%20Guide/)
  })
})
