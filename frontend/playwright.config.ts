import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E测试配置
 *
 * 环境变量：
 * - BASE_URL: 测试环境URL（默认: http://localhost:3001）
 * - E2E_ADMIN_EMAIL: 管理员测试账号邮箱
 * - E2E_ADMIN_PASSWORD: 管理员测试账号密码
 *
 * 运行测试：
 * - pnpm test:e2e - 运行所有E2E测试
 * - pnpm test:e2e --ui - 使用UI模式运行
 * - pnpm test:e2e --debug - 调试模式
 * - pnpm test:e2e auth - 只运行认证相关测试
 */
export default defineConfig({
  testDir: './e2e',
  /* 并行运行测试以加速执行 */
  fullyParallel: true,
  /* 在CI环境中失败时不重试（节省时间） */
  forbidOnly: !!process.env.CI,
  /* 在CI中重试失败的测试 */
  retries: process.env.CI ? 2 : 0,
  /* 在CI中并行执行 */
  workers: process.env.CI ? 2 : undefined,
  /* 测试报告配置 */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  /* 全局设置 */
  use: {
    /* 基础URL */
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
    /* 收集失败测试的trace */
    trace: 'on-first-retry',
    /* 截图配置 */
    screenshot: 'only-on-failure',
    /* 视频录制 */
    video: 'retain-on-failure',
    /* 测试超时时间（毫秒） */
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  /* 项目配置 - 多浏览器测试 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* 移动端测试 */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* 测试前启动开发服务器（本地开发时） */
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3001',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
})
