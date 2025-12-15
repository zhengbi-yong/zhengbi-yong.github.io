import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'

// 模拟 Next.js 路由
const mockRouter = {
  push: vitest.fn(),
  replace: vitest.fn(),
  prefetch: vitest.fn(),
  back: vitest.fn(),
  forward: vitest.fn(),
  refresh: vitest.fn(),
}

// 模拟 next/router
vitest.mock('next/router', () => ({
  useRouter: () => mockRouter,
  default: mockRouter,
}))

// 模拟 next/navigation
vitest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// 设置全局测试超时
beforeAll(() => {
  vi.setConfig({ testTimeout: 10000 })
})

// 清理所有模拟
afterEach(() => {
  vitest.clearAllMocks()
})

// 全局测试工具
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      }
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      }
    }
  },
})

// 类型声明
declare global {
  namespace Vi {
    interface JestAssertion<T = any> {
      toBeWithinRange(floor: number, ceiling: number): T
    }
  }
}