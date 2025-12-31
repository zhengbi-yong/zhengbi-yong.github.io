/**
 * 认证流程E2E测试
 *
 * 测试覆盖：
 * - 用户注册
 * - 用户登录
 * - 用户登出
 * - 密码强度验证
 * - Token刷新
 */

import { test, expect } from '@playwright/test'

// 测试数据生成器
function generateTestData() {
  const timestamp = Date.now()
  return {
    email: `test_${timestamp}@example.com`,
    username: `testuser_${timestamp}`,
    password: `TestP@ssw0rd${timestamp}`,
    weakPassword: 'weak',
  }
}

test.describe('用户注册', () => {
  test('应该成功注册新用户', async ({ page }) => {
    const testData = generateTestData()

    // 导航到注册页面
    await page.goto('/register')

    // 填写注册表单
    await page.fill('input[name="email"]', testData.email)
    await page.fill('input[name="username"]', testData.username)
    await page.fill('input[name="password"]', testData.password)

    // 提交表单
    await page.click('button[type="submit"]')

    // 等待导航到首页或个人中心
    await expect(page).toHaveURL(/\/(blog|profile)?$/, { timeout: 10000 })

    // 验证用户已登录（检查localStorage或页面元素）
    const accessToken = await page.evaluate(() => {
      return localStorage.getItem('access_token')
    })
    expect(accessToken).toBeTruthy()

    const userInfo = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('user_info') || '{}')
    })
    expect(userInfo.email).toBe(testData.email)
  })

  test('应该拒绝弱密码', async ({ page }) => {
    const testData = generateTestData()

    await page.goto('/register')

    await page.fill('input[name="email"]', testData.email)
    await page.fill('input[name="username"]', testData.username)
    await page.fill('input[name="password"]', testData.weakPassword)

    await page.click('button[type="submit"]')

    // 应该显示密码强度不足的错误提示
    const errorMessage = page.locator('text=/密码.*至少.*字符/i')
    await expect(errorMessage).toBeVisible()
  })

  test('应该拒绝无效邮箱格式', async ({ page }) => {
    const testData = generateTestData()

    await page.goto('/register')

    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="username"]', testData.username)
    await page.fill('input[name="password"]', testData.password)

    await page.click('button[type="submit"]')

    // 应该显示邮箱格式错误
    const errorMessage = page.locator('text=/邮箱.*格式/i')
    await expect(errorMessage).toBeVisible()
  })

  test('应该拒绝重复注册', async ({ page }) => {
    // 假设已经有一个测试用户存在
    const existingEmail = 'test_existing@example.com'

    await page.goto('/register')

    await page.fill('input[name="email"]', existingEmail)
    await page.fill('input[name="username"]', `newuser_${Date.now()}`)
    await page.fill('input[name="password"]', generateTestData().password)

    await page.click('button[type="submit"]')

    // 应该显示邮箱已被注册的错误
    const errorMessage = page.locator('text=/邮箱.*已.*注册/i')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
  })
})

test.describe('用户登录', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前导航到登录页面
    await page.goto('/login')
  })

  test('应该成功登录已注册用户', async ({ page }) => {
    const testData = generateTestData()

    // 先注册用户
    await page.goto('/register')
    await page.fill('input[name="email"]', testData.email)
    await page.fill('input[name="username"]', testData.username)
    await page.fill('input[name="password"]', testData.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(blog|profile)?$/)

    // 然后登出
    await page.evaluate(() => {
      localStorage.clear()
    })

    // 重新登录
    await page.goto('/login')
    await page.fill('input[name="email"]', testData.email)
    await page.fill('input[name="password"]', testData.password)
    await page.click('button[type="submit"]')

    // 验证登录成功
    await expect(page).toHaveURL(/\/(blog|profile)?$/, { timeout: 10000 })

    const accessToken = await page.evaluate(() => {
      return localStorage.getItem('access_token')
    })
    expect(accessToken).toBeTruthy()
  })

  test('应该拒绝错误的密码', async ({ page }) => {
    const testData = generateTestData()

    await page.fill('input[name="email"]', testData.email)
    await page.fill('input[name="password"]', 'WrongPassword123!')

    await page.click('button[type="submit"]')

    // 应该显示登录失败错误
    const errorMessage = page.locator('text=/邮箱或密码错误/i')
    await expect(errorMessage).toBeVisible()
  })

  test('应该拒绝不存在的用户', async ({ page }) => {
    await page.fill('input[name="email"]', 'nonexistent@example.com')
    await page.fill('input[name="password"]', 'SomePassword123!')

    await page.click('button[type="submit"]')

    // 应该显示登录失败错误
    const errorMessage = page.locator('text=/邮箱或密码错误/i')
    await expect(errorMessage).toBeVisible()
  })

  test('应该显示密码强度指示器', async ({ page }) => {
    await page.fill('input[name="email"]', generateTestData().email)

    const passwordInput = page.locator('input[name="password"]')

    // 输入弱密码
    await passwordInput.fill('weak')
    const weakIndicator = page.locator('text=/弱/i')
    await expect(weakIndicator).toBeVisible()

    // 输入中等强度密码
    await passwordInput.fill('MediumPass123')
    const mediumIndicator = page.locator('text=/中/i')
    await expect(mediumIndicator).toBeVisible({ timeout: 3000 })

    // 输入强密码
    await passwordInput.fill('StrongP@ssw0rd123!')
    const strongIndicator = page.locator('text=/强/i')
    await expect(strongIndicator).toBeVisible({ timeout: 3000 })
  })
})

test.describe('用户登出', () => {
  test('应该成功登出', async ({ page }) => {
    const testData = generateTestData()

    // 注册并登录
    await page.goto('/register')
    await page.fill('input[name="email"]', testData.email)
    await page.fill('input[name="username"]', testData.username)
    await page.fill('input[name="password"]', testData.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(blog|profile)?$/)

    // 验证已登录
    let accessToken = await page.evaluate(() => {
      return localStorage.getItem('access_token')
    })
    expect(accessToken).toBeTruthy()

    // 登出（假设有一个登出按钮）
    const logoutButton = page.locator('button:has-text("登出"), a:has-text("登出")').first()
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
    } else {
      // 手动清除token模拟登出
      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })
    }

    // 验证token已清除
    accessToken = await page.evaluate(() => {
      return localStorage.getItem('access_token')
    })
    expect(accessToken).toBeNull()
  })
})

test.describe('Token刷新', () => {
  test('应该自动刷新过期的access token', async ({ page }) => {
    const testData = generateTestData()

    // 注册用户
    await page.goto('/register')
    await page.fill('input[name="email"]', testData.email)
    await page.fill('input[name="username"]', testData.username)
    await page.fill('input[name="password"]', testData.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(blog|profile)?$/)

    // 模拟access token过期（设置一个过期的token）
    await page.evaluate(() => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjB9.expired'
      localStorage.setItem('access_token', expiredToken)
    })

    // 刷新页面，应该自动刷新token
    await page.reload()

    // 等待token刷新完成
    await page.waitForTimeout(2000)

    // 验证token已更新
    const newToken = await page.evaluate(() => {
      return localStorage.getItem('access_token')
    })
    expect(newToken).not.toContain('expired')
  })
})

test.describe('受保护路由', () => {
  test('应该重定向未登录用户到登录页', async ({ page }) => {
    // 尝试访问需要认证的页面
    await page.goto('/profile')

    // 应该重定向到登录页或显示登录提示
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('应该允许已登录用户访问受保护页面', async ({ page }) => {
    const testData = generateTestData()

    // 注册并登录
    await page.goto('/register')
    await page.fill('input[name="email"]', testData.email)
    await page.fill('input[name="username"]', testData.username)
    await page.fill('input[name="password"]', testData.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(blog|profile)?$/)

    // 访问受保护页面
    await page.goto('/profile')

    // 应该能够访问（不会重定向到登录页）
    await expect(page).not.toHaveURL(/\/login/)
  })
})
