// MSW (Mock Service Worker) server setup for Vitest
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// 创建 Mock Service Worker for Node.js (Vitest)
export const server = setupServer(...handlers)

// Vitest setup hooks
export const setupMSWServer = () => {
  // Import vitest test hooks only during test execution
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    const { beforeAll, afterEach, afterAll } = require('vitest')

    // Start server for tests
    beforeAll(() => {
      server.listen({
        onUnhandledRequest: 'error',
      })
    })

    // 每个测试后重置 handlers
    afterEach(() => {
      server.resetHandlers()
    })

    // 所有测试后关闭 server
    afterAll(() => {
      server.close()
    })
  }
}

export const resetHandlers = () => server.resetHandlers()

