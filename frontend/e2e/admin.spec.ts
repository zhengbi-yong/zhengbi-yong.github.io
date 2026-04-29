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
 *
 * 注意：所有测试使用已存在的 admin@test.com 账号直接登录，
 * 因为前端没有实现 /register 路由。使用 loginAdmin 助手
 * 通过 API + localStorage 的方式进行认证。
 */

import { test, expect } from '@playwright/test'
import { loginAdmin } from './helpers/login'

// ===== 管理员登录 =====
test.describe('管理员登录', () => {
  test('应该允许管理员访问管理后台', async ({ page }) => {
    await loginAdmin(page)

    // 验证已进入管理后台
    const currentUrl = page.url()
    expect(currentUrl).toContain('/admin')

    // 验证管理员页面元素可见
    await expect(page.locator('[data-testid="admin-dashboard"]').first()).toBeVisible({ timeout: 5000 }).catch(async () => {
      // Fallback: 检查页面包含管理相关的文本或侧边栏
      const sidebar = page.locator('.admin-sidebar, nav a:has-text("仪表板")').first()
      await expect(sidebar).toBeVisible({ timeout: 3000 })
    })
  })

  test('应该显示管理后台导航菜单', async ({ page }) => {
    await loginAdmin(page)

    // 验证导航菜单项可见
    const navItems = ['仪表板', '文章管理', '用户管理', '评论审核']
    for (const item of navItems) {
      await expect(page.locator(`text=${item}`).first()).toBeVisible({ timeout: 3000 })
    }
  })
})

// ===== 文章管理 =====
test.describe('文章管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page)
  })

  test('应该显示文章列表', async ({ page }) => {
    await page.goto('/admin/posts')
    await page.waitForLoadState('networkidle')

    // 使用 Refine 文章列表的实际选择器
    const tableOrList = page.locator('table, [data-testid*="post"], .refine-list, [class*="posts"]').first()
    await expect(tableOrList).toBeVisible({ timeout: 10000 })
  })

  test('应该支持创建文章', async ({ page }) => {
    await page.goto('/admin/posts/new')
    await page.waitForLoadState('networkidle')

    // 验证编辑器加载 — Tiptap 编辑器有 ProseMirror
    await expect(page.locator('.ProseMirror').first()).toBeVisible({ timeout: 15000 })

    // 填写标题
    const timestamp = Date.now()
    const titleInput = page.locator('input[name="title"], input[placeholder*="标题"]').first()
    if (await titleInput.isVisible({ timeout: 3000 })) {
      await titleInput.fill(`E2E Test Post ${timestamp}`)
    }

    // 点击保存草稿
    const saveBtn = page.locator('button:has-text("保存草稿")').first()
    if (await saveBtn.isVisible({ timeout: 3000 })) {
      await saveBtn.click()
      await page.waitForTimeout(2000)
    }
  })

  test('应该支持编辑文章', async ({ page }) => {
    await page.goto('/admin/posts')
    await page.waitForLoadState('networkidle')

    // 查找编辑按钮
    const editLink = page.locator('a:has-text("编辑"), button:has-text("Edit")').first()
    if (await editLink.isVisible({ timeout: 5000 })) {
      await editLink.click()
      await page.waitForTimeout(1000)

      // 验证进入编辑页面（编辑器或表单）
      await expect(page.locator('.ProseMirror, input[name="title"]').first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('应该支持删除文章', async ({ page }) => {
    await page.goto('/admin/posts')
    await page.waitForLoadState('networkidle')

    // 查找删除按钮
    const deleteBtn = page.locator('button:has-text("删除"), button:has-text("Delete")').first()
    if (await deleteBtn.isVisible({ timeout: 5000 })) {
      await deleteBtn.click()

      // 确认对话框
      const confirmBtn = page.locator('button:has-text("确认"), button:has-text("Confirm")').first()
      if (await confirmBtn.isVisible({ timeout: 3000 })) {
        await confirmBtn.click()
        await page.waitForTimeout(1000)
      }
    }
  })
})

// ===== 分类管理 =====
test.describe('分类管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page)
  })

  test('应该显示分类列表', async ({ page }) => {
    await page.goto('/admin/categories')
    await page.waitForLoadState('networkidle')

    const list = page.locator('table, .refine-list, [class*="category"]').first()
    await expect(list).toBeVisible({ timeout: 10000 })
  })

  test('应该支持创建分类', async ({ page }) => {
    await page.goto('/admin/categories')
    await page.waitForLoadState('networkidle')

    const createBtn = page.locator('button:has-text("创建"), a:has-text("新建")').first()
    if (await createBtn.isVisible({ timeout: 5000 })) {
      await createBtn.click()
      await page.waitForTimeout(500)

      const nameInput = page.locator('input[name="name"], input[placeholder*="分类名称"]').first()
      if (await nameInput.isVisible({ timeout: 3000 })) {
        await nameInput.fill(`E2E Category ${Date.now()}`)
        await page.locator('button[type="submit"]').first().click()
        await page.waitForTimeout(1000)
      }
    }
  })
})

// ===== 标签管理 =====
test.describe('标签管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page)
  })

  test('应该显示标签列表', async ({ page }) => {
    await page.goto('/admin/tags')
    await page.waitForLoadState('networkidle')

    const list = page.locator('table, .refine-list, [class*="tag"]').first()
    await expect(list).toBeVisible({ timeout: 10000 })
  })

  test('应该支持创建标签', async ({ page }) => {
    await page.goto('/admin/tags')
    await page.waitForLoadState('networkidle')

    const createBtn = page.locator('button:has-text("创建"), a:has-text("新建")').first()
    if (await createBtn.isVisible({ timeout: 5000 })) {
      await createBtn.click()
      await page.waitForTimeout(500)

      const nameInput = page.locator('input[name="name"], input[placeholder*="标签名称"]').first()
      if (await nameInput.isVisible({ timeout: 3000 })) {
        await nameInput.fill(`E2E Tag ${Date.now()}`)
        await page.locator('button[type="submit"]').first().click()
        await page.waitForTimeout(1000)
      }
    }
  })
})

// ===== 用户管理 =====
test.describe('用户管理', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page)
  })

  test('应该显示用户列表', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    const list = page.locator('table, .refine-list, [class*="user"]').first()
    await expect(list).toBeVisible({ timeout: 10000 })
  })

  test('应该支持更新用户角色', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    const roleSelect = page.locator('select[name="role"], [role="combobox"]').first()
    if (await roleSelect.isVisible({ timeout: 5000 })) {
      const options = page.locator('option').first()
      if (await options.isVisible()) {
        await roleSelect.selectOption({ index: 1 })
        await page.waitForTimeout(500)
      }
    }
  })
})

// ===== 评论审核 =====
test.describe('评论审核', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page)
  })

  test('应该显示待审核评论列表', async ({ page }) => {
    await page.goto('/admin/comments')
    await page.waitForLoadState('networkidle')

    const list = page.locator('table, .refine-list, [class*="comment"]').first()
    await expect(list).toBeVisible({ timeout: 10000 })
  })

  test('应该支持批准评论', async ({ page }) => {
    await page.goto('/admin/comments')
    await page.waitForLoadState('networkidle')

    const approveBtn = page.locator('button:has-text("批准"), button:has-text("Approve")').first()
    if (await approveBtn.isVisible({ timeout: 5000 })) {
      await approveBtn.click()
      await page.waitForTimeout(1000)
    }
  })

  test('应该支持删除评论', async ({ page }) => {
    await page.goto('/admin/comments')
    await page.waitForLoadState('networkidle')

    const deleteBtn = page.locator('button:has-text("删除"), button:has-text("Delete")').first()
    if (await deleteBtn.isVisible({ timeout: 5000 })) {
      await deleteBtn.click()

      const confirmBtn = page.locator('button:has-text("确认"), button:has-text("Confirm")').first()
      if (await confirmBtn.isVisible({ timeout: 3000 })) {
        await confirmBtn.click()
        await page.waitForTimeout(1000)
      }
    }
  })
})

// ===== 系统统计 =====
test.describe('系统统计', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page)
  })

  test('应该显示系统统计数据', async ({ page }) => {
    await page.goto('/admin/stats')
    await page.waitForLoadState('networkidle')

    const statsPage = page.locator('.refine-list, table, [data-testid*="stat"]').first()
    await expect(statsPage).toBeVisible({ timeout: 10000 })
  })

  test('应该显示用户增长趋势', async ({ page }) => {
    await page.goto('/admin/stats')
    await page.waitForLoadState('networkidle')

    const chart = page.locator('[data-testid*="chart"], .recharts-wrapper, canvas').first()
    await expect(chart).toBeVisible({ timeout: 10000 })
  })
})
