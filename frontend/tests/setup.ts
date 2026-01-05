import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi, expect } from 'vitest'
import { server } from '../src/mocks/server'

// 模拟 Next.js 路由
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
}

// 模拟 next/router
vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
  default: mockRouter,
}))

// 模拟 next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// 模拟 localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

global.localStorage = localStorageMock as any

// 设置全局测试超时
beforeAll(() => {
  vi.setConfig({ testTimeout: 10000 })
})

// 启动 MSW server for all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'error',
  })
})

// 每个测试后重置 handlers
afterEach(() => {
  vi.clearAllMocks()
  server.resetHandlers()
})

// 所有测试后关闭 MSW server
afterAll(() => {
  server.close()
})

// 全局测试工具
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      }
    }
  },
})
