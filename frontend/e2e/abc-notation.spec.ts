import { test, expect } from '@playwright/test'

test.describe('ABC notation MDX rendering', () => {
  test('renders fenced abc blocks as sheet music with playback controls', async ({ page }) => {
    await page.goto('/test-abc-mdx')

    await expect(page.getByRole('heading', { name: 'ABC MDX Regression Fixture' })).toBeVisible()

    const fixture = page.getByTestId('abc-mdx-fixture')
    const sheetMusic = fixture.getByTestId('sheet-music')
    const score = sheetMusic.getByTestId('sheet-music-score')
    const playback = sheetMusic.getByTestId('sheet-music-playback')
    const playButton = playback.locator('.abcjs-midi-start')

    await expect(score.locator('svg')).toBeVisible()
    await expect(fixture.locator('pre code.language-abc')).toHaveCount(0)
    await expect(playback.locator('.abcjs-inline-audio')).toBeVisible()
    await expect(playButton).toBeVisible()
    await playButton.click({ trial: true })
  })
})
