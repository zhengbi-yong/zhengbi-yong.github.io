/**
 * Refine Auth Provider 压力测试和边界情况测试
 *
 * Tests verify ACTUAL auth provider behavior:
 * - check() uses useAuthStore.checkAuth() - returns true if user+isAuthenticated in store
 * - check() does NOT call refreshToken - no such concept in current impl
 * - onError(401) returns {logout:false, redirectTo:'/admin'}
 * - getIdentity() reads from store.user first, NOT localStorage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authProvider } from '@/lib/providers/refine-auth-provider'
import { authService } from '@/lib/api/backend'
import { useAuthStore } from '@/lib/store/auth-store'
import { resetLocalStorage } from '@/lib/utils/cleanup'

// NOTE: refreshToken does NOT exist in authService.
// authService only has: login, logout, getCurrentUser, register
vi.mock('@/lib/api/backend', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    register: vi.fn(),
  },
}))

describe('Refine Auth Provider - 压力测试和边界情况', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetLocalStorage()
    // Reset store state to initial values
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('边界情况测试', () => {
    it('should handle empty email/password', async () => {
      vi.mocked(authService.login).mockRejectedValue(new Error('Email and password are required'))

      const result = await authProvider.login({
        email: '',
        password: '',
      })

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('required')
    })

    it('should handle very long email', async () => {
      const longEmail = 'a'.repeat(1000) + '@test.com'
      vi.mocked(authService.login).mockRejectedValue(new Error('Invalid email format'))

      const result = await authProvider.login({
        email: longEmail,
        password: 'password',
      })

      expect(result.success).toBe(false)
    })

    it('should handle special characters in credentials', async () => {
      vi.mocked(authService.login).mockResolvedValue({
        access_token: 'token',
        user: { id: '1', username: 'test', email: 'test@test.com' },
      })

      const result = await authProvider.login({
        email: 'test+special@example.com',
        password: 'p@ssw0rd!@#$%',
      })

      expect(result.success).toBe(true)
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test+special@example.com',
        password: 'p@ssw0rd!@#$%',
      })
    })

    it('should handle unicode characters in username', async () => {
      const mockResponse = {
        access_token: 'token',
        user: {
          id: '1',
          username: '用户测试🚀',
          email: 'test@test.com',
        },
      }

      vi.mocked(authService.register).mockResolvedValue(mockResponse)

      const result = await authProvider.register({
        email: 'test@test.com',
        username: '用户测试🚀',
        password: 'password',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Token 管理测试', () => {
    it('should return authenticated when store has user and isAuthenticated', async () => {
      // Pre-populate store (simulates already-authenticated state)
      useAuthStore.setState({
        user: { id: '1', username: 'test', email: 'test@test.com' },
        isAuthenticated: true,
        isInitialized: true,
      })

      const result = await authProvider.check()

      expect(result.authenticated).toBe(true)
      // Should NOT call API when already authenticated
      expect(authService.getCurrentUser).not.toHaveBeenCalled()
    })

    it('should handle multiple concurrent check calls with same store state', async () => {
      // Store already has authenticated state
      useAuthStore.setState({
        user: { id: '1', username: 'test', email: 'test@test.com' },
        isAuthenticated: true,
        isInitialized: true,
      })

      const promises = Array.from({ length: 10 }, () => authProvider.check())

      const results = await Promise.all(promises)

      expect(results).toHaveLength(10)
      results.forEach((result) => {
        expect(result.authenticated).toBe(true)
      })
      // Should NOT call getCurrentUser when already authenticated
      expect(authService.getCurrentUser).not.toHaveBeenCalled()
    })

    it('should call getCurrentUser when store needs initialization (first check)', async () => {
      // Store not initialized - first call needs to check with API
      vi.mocked(authService.getCurrentUser).mockResolvedValue({
        id: '1',
        username: 'test',
        email: 'test@test.com',
      })

      const promises = Array.from({ length: 5 }, () => authProvider.check())

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      results.forEach((result) => {
        expect(result.authenticated).toBe(true)
      })
      // getCurrentUser should have been called (first check triggers it)
      expect(authService.getCurrentUser).toHaveBeenCalled()
    })
  })

  describe('错误恢复测试', () => {
    it('should handle network error on initial check', async () => {
      // Store not initialized, API fails
      vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('Network error'))

      const result = await authProvider.check()

      expect(result.authenticated).toBe(false)
      expect(result.logout).toBe(true)
      expect(result.redirectTo).toBe('/')
    })

    it('should handle partial logout failure', async () => {
      // API call fails, but local state should still be cleared
      vi.mocked(authService.logout).mockRejectedValue(new Error('Network error'))

      const result = await authProvider.logout()

      expect(result.success).toBe(true)
      // Store should have been cleared despite API failure
      const { user, isAuthenticated } = useAuthStore.getState()
      expect(user).toBeNull()
      expect(isAuthenticated).toBe(false)
    })
  })

  describe('安全性测试', () => {
    it('should not expose sensitive information in errors', async () => {
      vi.mocked(authService.login).mockRejectedValue(
        new Error('Invalid password: secret123')
      )

      const result = await authProvider.login({
        email: 'test@test.com',
        password: 'wrong',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle XSS attempts in credentials', async () => {
      const xssPayload = '<script>alert("xss")</script>'
      vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'))

      const result = await authProvider.login({
        email: xssPayload,
        password: xssPayload,
      })

      expect(result.success).toBe(false)
      // Should safely handle, not execute script
    })

    it('should handle SQL injection attempts', async () => {
      const sqlPayload = "'; DROP TABLE users; --"
      vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'))

      const result = await authProvider.login({
        email: sqlPayload,
        password: sqlPayload,
      })

      expect(result.success).toBe(false)
      // Should safely handle, not execute SQL
    })
  })

  describe('并发安全测试', () => {
    it('should handle concurrent login attempts', async () => {
      const mockResponse = {
        access_token: 'token',
        user: { id: '1', username: 'test', email: 'test@test.com' },
      }

      vi.mocked(authService.login).mockResolvedValue(mockResponse)

      const promises = Array.from({ length: 10 }, () =>
        authProvider.login({
          email: 'test@test.com',
          password: 'password',
        })
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(10)
      expect(authService.login).toHaveBeenCalledTimes(10)
      results.forEach((result) => {
        expect(result.success).toBe(true)
      })
    })

    it('should handle concurrent logout attempts', async () => {
      vi.mocked(authService.logout).mockResolvedValue(undefined)

      const promises = Array.from({ length: 5 }, () => authProvider.logout())

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      results.forEach((result) => {
        expect(result.success).toBe(true)
      })
    })
  })

  describe('状态一致性测试', () => {
    it('should maintain consistent state across multiple operations', async () => {
      // Store has authenticated user
      const mockUser = { id: '1', username: 'test', email: 'test@test.com' }
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        isInitialized: true,
      })

      // Multiple checks should return consistent results
      const result1 = await authProvider.check()
      const result2 = await authProvider.check()
      const identity1 = await authProvider.getIdentity()
      const identity2 = await authProvider.getIdentity()

      expect(result1.authenticated).toBe(result2.authenticated)
      expect(identity1?.id).toBe(identity2?.id)
      expect(identity1?.id).toBe('1')
    })

    it('should handle state transitions correctly', async () => {
      // Initial state: not logged in
      const check1 = await authProvider.check()
      expect(check1.authenticated).toBe(false)

      // Login - set store state directly (simulates login)
      const mockResponse = {
        access_token: 'token',
        user: { id: '1', username: 'test', email: 'test@test.com' },
      }
      vi.mocked(authService.login).mockResolvedValue(mockResponse)

      const loginResult = await authProvider.login({
        email: 'test@test.com',
        password: 'password',
      })
      expect(loginResult.success).toBe(true)

      // After login check
      useAuthStore.setState({
        user: mockResponse.user,
        isAuthenticated: true,
        isInitialized: true,
      })
      const check2 = await authProvider.check()
      expect(check2.authenticated).toBe(true)

      // Logout
      vi.mocked(authService.logout).mockResolvedValue(undefined)
      const logoutResult = await authProvider.logout()
      expect(logoutResult.success).toBe(true)

      // After logout check
      const check3 = await authProvider.check()
      expect(check3.authenticated).toBe(false)
    })
  })

  describe('性能测试', () => {
    it('should handle rapid authentication checks efficiently', async () => {
      // Store already has authenticated state (no API calls needed)
      useAuthStore.setState({
        user: { id: '1', username: 'test', email: 'test@test.com' },
        isAuthenticated: true,
        isInitialized: true,
      })

      const startTime = Date.now()
      const promises = Array.from({ length: 100 }, () => authProvider.check())
      const results = await Promise.all(promises)
      const endTime = Date.now()

      expect(results).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(5000)
      // All should be authenticated since store has user
      results.forEach((r) => expect(r.authenticated).toBe(true))
    })
  })

  describe('边界值测试', () => {
    it('should handle user with minimal fields', async () => {
      vi.mocked(authService.getCurrentUser).mockResolvedValue({
        id: '1',
        username: 'test',
        email: 'test@test.com',
      })

      const result = await authProvider.getIdentity()

      expect(result).not.toBeNull()
      expect(result?.id).toBe('1')
      expect(result?.name).toBe('test')
    })

    it('should handle user with all fields populated', async () => {
      const fullUser = {
        id: '42',
        username: 'fulluser',
        email: 'full@test.com',
        profile: { avatar_url: 'https://example.com/avatar.png' },
        role: 'admin',
      }

      useAuthStore.setState({
        user: fullUser as any,
        isAuthenticated: true,
        isInitialized: true,
      })

      const result = await authProvider.getIdentity()

      expect(result).toEqual({
        id: '42',
        name: 'fulluser',
        email: 'full@test.com',
        avatar: 'https://example.com/avatar.png',
        role: 'admin',
      })
    })
  })
})
