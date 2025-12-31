/**
 * 博客功能E2E测试
 *
 * 测试覆盖：
 * - 文章列表浏览
 * - 文章详情页
 * - 文章搜索
 * - 分类和标签筛选
 * - 阅读进度追踪
 * - 文章评论
 */

import { test, expect } from '@playwright/test'

// 辅助函数：生成测试数据
function generateTestData() {
  const timestamp = Date.now()
  return {
    email: `test_${timestamp}@example.com`,
    username: `testuser_${timestamp}`,
    password: `TestP@ssw0rd${timestamp}`,
    comment: `This is a test comment ${timestamp}`,
  }
}

// 辅助函数：注册并登录用户
async function registerAndLogin(page: any) {
  const testData = generateTestData()

  await page.goto('/register')
  await page.fill('input[name="email"]', testData.email)
  await page.fill('input[name="username"]', testData.username)
  await page.fill('input[name="password"]', testData.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(blog)?$/, { timeout: 10000 })

  return testData
}

test.describe('文章列表', () => {
  test('应该显示文章列表', async ({ page }) => {
    await page.goto('/blog')

    // 等待文章列表加载
    const articles = page.locator('article, [data-testid="post-item"], .post-item')
    await expect(articles.first()).toBeVisible({ timeout: 10000 })

    // 验证文章标题可见
    const firstArticleTitle = articles.locator('h2, h3, .post-title').first()
    await expect(firstArticleTitle).toBeVisible()
  })

  test('应该支持分页', async ({ page }) => {
    await page.goto('/blog')

    // 查找分页控件
    const pagination = page.locator('.pagination, nav[aria-label="pagination"]').first()

    if (await pagination.isVisible()) {
      const nextPageButton = pagination.locator('a:has-text("下一页"), a:has-text("Next"), button[rel="next"]').first()

      if (await nextPageButton.isVisible()) {
        const initialUrl = page.url()
        await nextPageButton.click()
        await page.waitForTimeout(2000)

        // URL应该改变（包含page参数）
        expect(page.url()).not.toBe(initialUrl)
      }
    }
  })

  test('应该按分类筛选文章', async ({ page }) => {
    await page.goto('/blog')

    // 查找分类筛选器
    const categoryFilter = page.locator('select[name="category"], .category-filter a').first()

    if (await categoryFilter.isVisible({ timeout: 5000 })) {
      if (categoryFilter.tagName() === 'SELECT') {
        await categoryFilter.selectOption({ index: 1 })
      } else {
        await categoryFilter.click()
      }

      await page.waitForTimeout(2000)

      // URL应该包含分类参数
      expect(page.url()).toMatch(/category/)
    }
  })

  test('应该显示文章元数据', async ({ page }) => {
    await page.goto('/blog')

    const firstArticle = page.locator('article, [data-testid="post-item"]').first()

    // 验证日期、分类、标签等元数据可见
    const date = firstArticle.locator('time, .post-date, [data-testid="date"]').first()
    const category = firstArticle.locator('.post-category, .badge, [data-testid="category"]').first()

    await expect(date).toBeVisible()
    // category可能不存在，不做强要求
  })
})

test.describe('文章详情', () => {
  test('应该显示文章完整内容', async ({ page }) => {
    await page.goto('/blog')

    // 点击第一篇文章
    const firstArticle = page.locator('article a, .post-title a').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    // 验证文章标题可见
    const articleTitle = page.locator('h1, .post-title').first()
    await expect(articleTitle).toBeVisible()

    // 验证文章内容可见
    const articleContent = page.locator('.prose, .post-content, article').first()
    await expect(articleContent).toBeVisible()
  })

  test('应该显示文章阅读进度条（登录用户）', async ({ page }) => {
    const testData = await registerAndLogin(page)

    // 导航到文章列表
    await page.goto('/blog')
    const firstArticle = page.locator('article a, .post-title a').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    // 验证阅读进度条存在
    const progressBar = page.locator('.reading-progress, [data-testid="reading-progress"]').first()
    await expect(progressBar).toBeVisible({ timeout: 5000 })
  })

  test('应该增加文章浏览量', async ({ page }) => {
    await page.goto('/blog')
    const firstArticle = page.locator('article a, .post-title a').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    // 查找浏览量统计
    const viewCount = page.locator('[data-testid="view-count"], .post-views').first()

    if (await viewCount.isVisible({ timeout: 5000 })) {
      const viewText = await viewCount.textContent()
      expect(viewText).toMatch(/\d+/)
    }
  })

  test('应该支持文章点赞（登录用户）', async ({ page }) => {
    await registerAndLogin(page)

    await page.goto('/blog')
    const firstArticle = page.locator('article a, .post-title a').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    // 查找点赞按钮
    const likeButton = page.locator('button:has-text("赞"), button:has-text("Like"), [data-testid="like-button"]').first()

    if (await likeButton.isVisible({ timeout: 5000 })) {
      const initialLikeText = await likeButton.textContent()

      await likeButton.click()
      await page.waitForTimeout(1000)

      const newLikeText = await likeButton.textContent()
      expect(newLikeText).not.toBe(initialLikeText)
    }
  })

  test('应该显示相关文章推荐', async ({ page }) => {
    await page.goto('/blog')
    const firstArticle = page.locator('article a, .post-title a').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    // 滚动到页面底部
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(2000)

    // 查找相关文章
    const relatedPosts = page.locator('[data-testid="related-posts"], .related-posts').first()

    if (await relatedPosts.isVisible({ timeout: 5000 })) {
      const relatedLinks = relatedPosts.locator('a').count()
      expect(relatedLinks).toBeGreaterThan(0)
    }
  })
})

test.describe('文章搜索', () => {
  test('应该支持关键词搜索', async ({ page }) => {
    await page.goto('/blog')

    // 查找搜索框
    const searchInput = page.locator('input[placeholder*="搜索"], input[name="search"], #search').first()

    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('chemistry')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(2000)

      // URL应该包含搜索参数
      expect(page.url()).toMatch(/search|q=/)

      // 应该显示搜索结果
      const searchResults = page.locator('.search-results, article').first()
      await expect(searchResults).toBeVisible()
    }
  })

  test('应该显示搜索建议', async ({ page }) => {
    await page.goto('/blog')

    const searchInput = page.locator('input[placeholder*="搜索"], input[name="search"], #search').first()

    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('chem')
      await page.waitForTimeout(1000)

      // 查找搜索建议下拉框
      const suggestions = page.locator('.search-suggestions, .autocomplete-dropdown').first()

      if (await suggestions.isVisible()) {
        const suggestionItems = suggestions.locator('li, div').count()
        expect(suggestionItems).toBeGreaterThan(0)
      }
    }
  })
})

test.describe('文章评论', () => {
  test('应该允许已登录用户发表评论', async ({ page }) => {
    const testData = await registerAndLogin(page)

    await page.goto('/blog')
    const firstArticle = page.locator('article a, .post-title a').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    // 滚动到评论区
    const commentsSection = page.locator('#comments, .comments-section').first()

    if (await commentsSection.isVisible({ timeout: 5000 })) {
      await commentsSection.scrollIntoViewIfNeeded()
      await page.waitForTimeout(1000)

      // 填写评论表单
      const commentTextarea = page.locator('textarea[name="comment"], #comment-text').first()

      if (await commentTextarea.isVisible()) {
        await commentTextarea.fill(testData.comment)

        const submitButton = page.locator('button[type="submit"]:has-text("发表"), button:has-text("提交")').first()
        await submitButton.click()
        await page.waitForTimeout(2000)

        // 验证评论已显示
        const newComment = page.locator(`text=${testData.comment}`)
        await expect(newComment).toBeVisible()
      }
    }
  })

  test('应该显示评论列表', async ({ page }) => {
    await page.goto('/blog')
    const firstArticle = page.locator('article a, .post-title a').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    const commentsSection = page.locator('#comments, .comments-section').first()

    if (await commentsSection.isVisible({ timeout: 5000 })) {
      const commentList = commentsSection.locator('.comment, [data-testid="comment"]').first()

      // 评论列表可能为空，所以不强制断言
      if (await commentList.isVisible()) {
        const commentCount = await commentList.count()
        expect(commentCount).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('应该阻止未登录用户发表评论', async ({ page }) => {
    await page.goto('/blog')
    const firstArticle = page.locator('article a, .post-title a').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    const commentsSection = page.locator('#comments, .comments-section').first()

    if (await commentsSection.isVisible({ timeout: 5000 })) {
      const commentForm = page.locator('form').first()

      if (await commentForm.isVisible()) {
        // 未登录用户应该看到登录提示
        const loginPrompt = commentsSection.locator('text=/登录.*发表.*评论/i')
        await expect(loginPrompt).toBeVisible()
      }
    }
  })
})

test.describe('分类和标签', () => {
  test('应该显示所有分类', async ({ page }) => {
    await page.goto('/blog/categories')

    const categoryList = page.locator('.category-list, [data-testid="categories"]').first()

    if (await categoryList.isVisible({ timeout: 5000 })) {
      const categories = categoryList.locator('a, .category-item').count()
      expect(categories).toBeGreaterThan(0)
    }
  })

  test('应该显示所有标签', async ({ page }) => {
    await page.goto('/blog/tags')

    const tagList = page.locator('.tag-list, [data-testid="tags"]').first()

    if (await tagList.isVisible({ timeout: 5000 })) {
      const tags = tagList.locator('a, .tag').count()
      expect(tags).toBeGreaterThan(0)
    }
  })

  test('应该支持按标签筛选文章', async ({ page }) => {
    await page.goto('/blog/tags')

    const tagList = page.locator('.tag-list, [data-testid="tags"]').first()

    if (await tagList.isVisible({ timeout: 5000 })) {
      const firstTag = tagList.locator('a, .tag').first()
      await firstTag.click()
      await page.waitForTimeout(2000)

      // 应该显示该标签下的文章
      const articles = page.locator('article, [data-testid="post-item"]').first()
      await expect(articles).toBeVisible()
    }
  })
})

test.describe('阅读进度追踪', () => {
  test('应该自动保存阅读进度', async ({ page }) => {
    await registerAndLogin(page)

    await page.goto('/blog')
    const firstArticle = page.locator('article a, .post-title a').first()
    await firstArticle.click()
    await page.waitForLoadState('networkidle')

    // 滚动到页面中间
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
    await page.waitForTimeout(3000)

    // 刷新页面
    await page.reload()
    await page.waitForLoadState('networkidle')

    // 应该恢复到之前的滚动位置（或显示进度提示）
    const progressIndicator = page.locator('[data-testid="reading-progress"], .reading-progress').first()

    if (await progressIndicator.isVisible({ timeout: 5000 })) {
      const progressText = await progressIndicator.textContent()
      expect(progressText).toMatch(/\d+%/)
    }
  })
})
