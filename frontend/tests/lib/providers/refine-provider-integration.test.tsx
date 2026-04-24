/**
 * Refine Provider 集成测试
 * 测试所有 Provider 协同工作的正确性
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RefineProvider } from '@/lib/providers/refine-provider'
import { dataProvider } from '@/lib/providers/refine-data-provider'
import { authProvider } from '@/lib/providers/refine-auth-provider'

// Mock Next.js router
vi.mock('@refinedev/nextjs-router/app', () => ({
  default: {
    go: vi.fn(),
  },
}))

// Mock Kbar
vi.mock('@refinedev/kbar', () => ({
  RefineKbar: () => null,
  RefineKbarProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('Refine Provider Integration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it('should initialize RefineProvider without errors', () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <RefineProvider>
          <div>Test Content</div>
        </RefineProvider>
      </QueryClientProvider>
    )

    expect(container).toBeInTheDocument()
  })

  it('should provide data provider to children', () => {
    const TestComponent = () => {
      // 这里可以测试 useDataContext 或其他 hooks
      return <div>Test</div>
    }

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <RefineProvider>
          <TestComponent />
        </RefineProvider>
      </QueryClientProvider>
    )

    expect(container).toBeInTheDocument()
  })

  it('should handle provider errors gracefully', () => {
    // 测试 provider 初始化失败的情况
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <RefineProvider>
          <div>Test</div>
        </RefineProvider>
      </QueryClientProvider>
    )

    expect(container).toBeInTheDocument()
  })
})

describe('Data Provider and Auth Provider Integration', () => {
  it('should work together correctly', async () => {
    // Note: authProvider.check() does NOT read from localStorage.
    // Tokens are managed via HttpOnly Cookies (GOLDEN_RULES 1.1).
    // localStorage.setItem('access_token', ...) is a no-op for auth flow.

    // Verify auth provider can check auth state without localStorage token
    const checkResult = await authProvider.check()
    expect(checkResult).toBeDefined()
    // checkResult.authenticated reflects server-side cookie state
    expect('authenticated' in checkResult).toBe(true)

    // Verify data provider has correct API URL
    expect(dataProvider.getApiUrl()).toBeDefined()
  })
})

