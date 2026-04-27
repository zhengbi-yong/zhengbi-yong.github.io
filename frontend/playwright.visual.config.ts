import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright Visual Regression Testing Configuration
 * 
 * For running visual regression tests in tests/visual/
 * 
 * Run with:
 * pnpm exec playwright test --config=playwright.visual.config.ts
 */

export default defineConfig({
  testDir: './tests/visual',
  /* 并行运行测试 */
  fullyParallel: true,
  /* 在CI环境中失败时不重试 */
  forbidOnly: !!process.env.CI,
  /* 在CI中重试失败的测试 */
  retries: process.env.CI ? 2 : 0,
  /* 报告配置 */
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
    /* 截图 - 总是截取用于视觉对比 */
    screenshot: 'on',
    /* 测试超时时间 */
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  /* 项目配置 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  /* 快照路径模板 */
  snapshotPathTemplate: 'tests/visual/snapshots/{testFilePath}/{arg}-{timestamp}{ext}',
  /* 测试前启动开发服务器（仅本地） */
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3001',
        reuseExistingServer: true,
        timeout: 120000,
      },
})
