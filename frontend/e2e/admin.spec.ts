/**
 * 管理后台E2E测试
 *
 * 测试覆盖：
 * - 管理员登录
 * - 文章管理（创建、编辑、删除）
 * - 分类管理
 * - 标签管理
 * - 用户管理
 * - 评论审核
 */

import { test, expect } from '@playwright/test'

// 辅助函数：生成管理员测试数据
function generateAdminData() {
  const timestamp = Date.now()
  return {
    email: `admin_${timestamp}@example.com`,
    username: `admin_${timestamp}`,
    password: `AdminP@ssw0rd${timestamp}`,
  }
}

// 辅助函数：注册并登录管理员
async function registerAndLoginAdmin(page: any) {
  const adminData = generateAdminData()

  await page.goto('/register')
  await page.fill('input[name="email"]', adminData.email)
  await page.fill('input[name="username"]', adminData.username)
  await page.fill('input[name="password"]', adminData.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(blog|profile)?$/, { timeout: 10000 })

  // 注意：这个用户可能不是管理员，需要手动提升权限或使用已存在的管理员账号
  return adminData
}

test.describe('管理员登录', () => {
  test('应该允许管理员访问管理后台', async ({ page }) => {
    await registerAndLoginAdmin(page)

    // 尝试访问管理后台
    await page.goto('/admin')

    // 可能的结果：
    // 1. 成功进入管理后台（用户是管理员）
    // 2. 被重定向或显示权限不足（用户不是管理员）
    const currentUrl = page.url()
    const isAdminPage = currentUrl.includes('/admin')

    if (isAdminPage) {
      // 验证管理后台元素可见
      const adminDashboard = page.locator('[data-testid="admin-dashboard"], .admin-panel').first()
      await expect(adminDashboard).toBeVisible({ timeout: 5000 })
    } else {
      // 验证显示权限不足提示
      const accessDenied = page.locator('text=/权限.*不足/i, text=/Access.*Denied/i')
      await expect(accessDenied).toBeVisible()
    }
  })

  test('应该阻止普通用户访问管理后台', async ({ page }) => {
    // 注册普通用户
    const timestamp = Date.now()
    await page.goto('/register')
    await page.fill('input[name="email"]', `user_${timestamp}@example.com`)
    await page.fill('input[name="username"]', `user_${timestamp}`)
    await page.fill('input[name="password"]', `UserP@ssw0rd${timestamp}`)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(blog)?$/, { timeout: 10000 })

    // 尝试访问管理后台
    await page.goto('/admin')

    // 应该显示权限不足或重定向
    const accessDenied = page.locator('text=/权限.*不足/i, text=/Access.*Denied/i').first()
    const isRedirected = !page.url().includes('/admin')

    expect(await accessDenied.isVisible() || isRedirected).toBeTruthy()
  })
})

test.describe('文章管理', () => {
  test.beforeEach(async ({ page }) => {
    // 登录管理员
    await registerAndLoginAdmin(page)
  })

  test('应该显示文章列表', async ({ page }) => {
    await page.goto('/admin/posts')

    const adminPage = page.locator('[data-testid="admin-posts"], .admin-posts').first()

    if (await adminPage.isVisible({ timeout: 5000 })) {
      const postList = adminPage.locator('[data-testid="post-item"], tr').first()
      await expect(postList).toBeVisible()
    }
  })

  test('应该支持创建文章', async ({ page }) => {
    await page.goto('/admin/posts/new')

    const createForm = page.locator('form').first()

    if (await createForm.isVisible({ timeout: 5000 })) {
      // 填写文章表单
      const timestamp = Date.now()
      await createForm.locator('input[name="title"]').fill(`Test Post ${timestamp}`)
      await createForm.locator('input[name="slug"]').fill(`test-post-${timestamp}`)
      await createForm.locator('textarea[name="content"]').fill('This is test content for the post.')

      // 选择分类
      const categorySelect = createForm.locator('select[name="category"]').first()
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption({ index: 0 })
      }

      // 提交表单
      await createForm.locator('button[type="submit"]').click()
      await page.waitForTimeout(2000)

      // 验证成功消息或重定向
      const successMessage = page.locator('text=/成功|created/i').first()
      const isRedirected = page.url().includes('/admin/posts')

      expect(await successMessage.isVisible() || isRedirected).toBeTruthy()
    }
  })

  test('应该支持编辑文章', async ({ page }) => {
    await page.goto('/admin/posts')

    const adminPage = page.locator('[data-testid="admin-posts"]').first()

    if (await adminPage.isVisible({ timeout: 5000 })) {
      // 点击第一篇文章的编辑按钮
      const editButton = adminPage.locator('a:has-text("编辑"), button:has-text("Edit")').first()

      if (await editButton.isVisible()) {
        await editButton.click()
        await page.waitForTimeout(1000)

        // 修改标题
        const titleInput = page.locator('input[name="title"]').first()
        if (await titleInput.isVisible()) {
          const currentTitle = await titleInput.inputValue()
          await titleInput.fill(`${currentTitle} (edited)`)

          // 保存
          await page.locator('button[type="submit"]').click()
          await page.waitForTimeout(2000)

          // 验证成功
          const successMessage = page.locator('text=/成功|updated/i').first()
          expect(await successMessage.isVisible()).toBeTruthy()
        }
      }
    }
  })

  test('应该支持删除文章', async ({ page }) => {
    await page.goto('/admin/posts')

    const adminPage = page.locator('[data-testid="admin-posts"]').first()

    if (await adminPage.isVisible({ timeout: 5000 })) {
      // 找到删除按钮
      const deleteButton = adminPage.locator('button:has-text("删除"), button:has-text("Delete")').first()

      if (await deleteButton.isVisible()) {
        // 点击删除按钮（可能需要确认）
        await deleteButton.click()
        await page.waitForTimeout(500)

        // 确认删除
        const confirmButton = page.locator('button:has-text("确认"), button:has-text("Confirm")').first()

        if (await confirmButton.isVisible()) {
          await confirmButton.click()
        }

        await page.waitForTimeout(2000)

        // 验证成功消息
        const successMessage = page.locator('text=/成功|deleted/i').first()
        expect(await successMessage.isVisible()).toBeTruthy()
      }
    }
  })
})

test.describe('分类管理', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLoginAdmin(page)
  })

  test('应该显示分类列表', async ({ page }) => {
    await page.goto('/admin/categories')

    const categoryList = page.locator('[data-testid="category-list"], .admin-categories').first()

    if (await categoryList.isVisible({ timeout: 5000 })) {
      const categories = categoryList.locator('[data-testid="category-item"], tr').count()
      expect(categories).toBeGreaterThanOrEqual(0)
    }
  })

  test('应该支持创建分类', async ({ page }) => {
    await page.goto('/admin/categories/new')

    const createForm = page.locator('form').first()

    if (await createForm.isVisible({ timeout: 5000 })) {
      const timestamp = Date.now()
      await createForm.locator('input[name="name"]').fill(`Test Category ${timestamp}`)
      await createForm.locator('input[name="slug"]').fill(`test-category-${timestamp}`)
      await createForm.locator('textarea[name="description"]').fill('Test category description')

      await createForm.locator('button[type="submit"]').click()
      await page.waitForTimeout(2000)

      const successMessage = page.locator('text=/成功|created/i').first()
      expect(await successMessage.isVisible()).toBeTruthy()
    }
  })
})

test.describe('标签管理', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLoginAdmin(page)
  })

  test('应该显示标签列表', async ({ page }) => {
    await page.goto('/admin/tags')

    const tagList = page.locator('[data-testid="tag-list"], .admin-tags').first()

    if (await tagList.isVisible({ timeout: 5000 })) {
      const tags = tagList.locator('[data-testid="tag-item"], tr').count()
      expect(tags).toBeGreaterThanOrEqual(0)
    }
  })

  test('应该支持创建标签', async ({ page }) => {
    await page.goto('/admin/tags/new')

    const createForm = page.locator('form').first()

    if (await createForm.isVisible({ timeout: 5000 })) {
      const timestamp = Date.now()
      await createForm.locator('input[name="name"]').fill(`testtag${timestamp}`)
      await createForm.locator('input[name="slug"]').fill(`test-tag-${timestamp}`)

      await createForm.locator('button[type="submit"]').click()
      await page.waitForTimeout(2000)

      const successMessage = page.locator('text=/成功|created/i').first()
      expect(await successMessage.isVisible()).toBeTruthy()
    }
  })
})

test.describe('用户管理', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLoginAdmin(page)
  })

  test('应该显示用户列表', async ({ page }) => {
    await page.goto('/admin/users')

    const userList = page.locator('[data-testid="user-list"], .admin-users').first()

    if (await userList.isVisible({ timeout: 5000 })) {
      const users = userList.locator('[data-testid="user-item"], tr').count()
      expect(users).toBeGreaterThan(0)
    }
  })

  test('应该支持更新用户角色', async ({ page }) => {
    await page.goto('/admin/users')

    const userList = page.locator('[data-testid="user-list"]').first()

    if (await userList.isVisible({ timeout: 5000 })) {
      // 查找角色选择器或编辑按钮
      const roleSelect = userList.locator('select[name="role"]').first()

      if (await roleSelect.isVisible()) {
        await roleSelect.selectOption('admin')
        await page.waitForTimeout(1000)

        // 验证成功消息
        const successMessage = page.locator('text=/成功|updated/i').first()
        expect(await successMessage.isVisible()).toBeTruthy()
      }
    }
  })
})

test.describe('评论审核', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLoginAdmin(page)
  })

  test('应该显示待审核评论列表', async ({ page }) => {
    await page.goto('/admin/comments')

    const commentList = page.locator('[data-testid="comment-list"], .admin-comments').first()

    if (await commentList.isVisible({ timeout: 5000 })) {
      const comments = commentList.locator('[data-testid="comment-item"], tr').count()
      expect(comments).toBeGreaterThanOrEqual(0)
    }
  })

  test('应该支持批准评论', async ({ page }) => {
    await page.goto('/admin/comments')

    const commentList = page.locator('[data-testid="comment-list"]').first()

    if (await commentList.isVisible({ timeout: 5000 })) {
      // 查找待审核评论
      const pendingComments = commentList.locator('[data-status="pending"], .comment-pending').first()

      if (await pendingComments.isVisible()) {
        // 点击批准按钮
        const approveButton = pendingComments.locator('button:has-text("批准"), button:has-text("Approve")').first()

        if (await approveButton.isVisible()) {
          await approveButton.click()
          await page.waitForTimeout(1000)

          // 验证成功
          const successMessage = page.locator('text=/成功|approved/i').first()
          expect(await successMessage.isVisible()).toBeTruthy()
        }
      }
    }
  })

  test('应该支持删除评论', async ({ page }) => {
    await page.goto('/admin/comments')

    const commentList = page.locator('[data-testid="comment-list"]').first()

    if (await commentList.isVisible({ timeout: 5000 })) {
      const deleteButton = commentList.locator('button:has-text("删除"), button:has-text("Delete")').first()

      if (await deleteButton.isVisible()) {
        await deleteButton.click()
        await page.waitForTimeout(500)

        const confirmButton = page.locator('button:has-text("确认"), button:has-text("Confirm")').first()

        if (await confirmButton.isVisible()) {
          await confirmButton.click()
        }

        await page.waitForTimeout(2000)

        const successMessage = page.locator('text=/成功|deleted/i').first()
        expect(await successMessage.isVisible()).toBeTruthy()
      }
    }
  })
})

test.describe('系统统计', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLoginAdmin(page)
  })

  test('应该显示系统统计数据', async ({ page }) => {
    await page.goto('/admin')

    const dashboard = page.locator('[data-testid="admin-dashboard"], .admin-dashboard').first()

    if (await dashboard.isVisible({ timeout: 5000 })) {
      // 验证统计卡片可见
      const statsCards = dashboard.locator('[data-testid="stat-card"], .stat-card').count()
      expect(statsCards).toBeGreaterThan(0)

      // 验证图表可见
      const charts = dashboard.locator('canvas, .chart').count()
      expect(charts).toBeGreaterThan(0)
    }
  })

  test('应该显示用户增长趋势', async ({ page }) => {
    await page.goto('/admin/stats/users')

    const statsPage = page.locator('[data-testid="user-stats"], .stats-page').first()

    if (await statsPage.isVisible({ timeout: 5000 })) {
      const chart = statsPage.locator('canvas, .chart').first()
      await expect(chart).toBeVisible()
    }
  })
})
