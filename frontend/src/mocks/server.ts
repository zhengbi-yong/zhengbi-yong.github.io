// MSW (Mock Service Worker) server setup for Vitest
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// 创建 Mock Service Worker for Node.js (Vitest)
export const server = setupServer(...handlers)

// Vitest setup hooks
export const setupMSW = () => {
  // 在所有测试前启动 server
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
