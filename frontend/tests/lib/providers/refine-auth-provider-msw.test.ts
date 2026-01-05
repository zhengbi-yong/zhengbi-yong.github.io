/**
 * Refine Auth Provider 测试 (使用 MSW)
 *
 * 此测试使用 MSW (Mock Service Worker) 来模拟真实的 API 响应
 * 相比传统的 vi.mock(),MSW 提供了更真实的网络请求测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { authProvider } from '@/lib/providers/refine-auth-provider'

// API 基础 URL
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4010'

describe('Refine Auth Provider (with MSW)', () => {
  beforeEach(() => {
    // 清理 localStorage
    localStorage.clear()
  })

  afterEach(() => {
    // 重置所有 MSW handlers 为默认状态
    server.resetHandlers()
  })

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const result = await authProvider.login({
        email: 'admin@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(true)
      expect(result.redirectTo).toBe('/admin')
    })

    it('should handle login failure with invalid credentials', async () => {
      const result = await authProvider.login({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      })

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('邮箱或密码错误')
    })

    it('should store token in localStorage after successful login', async () => {
      await authProvider.login({
        email: 'admin@example.com',
        password: 'password123',
      })

      const token = localStorage.getItem('access_token')
      expect(token).toBeTruthy()
      expect(token).toMatch(/^mock-jwt-token-/)
    })

    it('should handle network errors', async () => {
      // 覆盖默认 handler 来模拟网络错误
      server.use(
        http.post(`${API_BASE}/v1/auth/login`, () => {
          return HttpResponse.error()
        }),
      )

      const result = await authProvider.login({
        email: 'admin@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('logout', () => {
    it('should logout successfully and clear localStorage', async () => {
      // 先登录
      localStorage.setItem('access_token', 'test-token')
      localStorage.setItem('user_info', JSON.stringify({ id: '1', username: 'admin' }))

      const result = await authProvider.logout()

      expect(result.success).toBe(true)
      expect(result.redirectTo).toBe('/')
      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('user_info')).toBeNull()
    })

    it('should logout even if API call fails', async () => {
      // 模拟 API 错误
      server.use(
        http.post(`${API_BASE}/v1/auth/logout`, () => {
          return HttpResponse.error()
        }),
      )

      localStorage.setItem('access_token', 'test-token')

      const result = await authProvider.logout()

      // 应该仍然成功(本地清理)
      expect(result.success).toBe(true)
      expect(localStorage.getItem('access_token')).toBeNull()
    })
  })

  describe('check', () => {
    it('should return authenticated when valid token exists', async () => {
      localStorage.setItem('access_token', 'valid-token')

      const result = await authProvider.check()

      expect(result.authenticated).toBe(true)
      expect(result.logout).toBeUndefined()
    })

    it('should return not authenticated when no token exists', async () => {
      const result = await authProvider.check()

      expect(result.authenticated).toBe(false)
      expect(result.logout).toBe(false)
    })

    it('should handle 401 error and trigger logout', async () => {
      localStorage.setItem('access_token', 'expired-token')

      // 覆盖 handler 返回 401
      server.use(
        http.get(`${API_BASE}/v1/auth/me`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: '未授权访问',
                type: '401',
              },
            },
            { status: 401 },
          )
        }),
      )

      const result = await authProvider.check()

      expect(result.authenticated).toBe(false)
      expect(result.logout).toBe(true)
      expect(result.redirectTo).toBe('/')
    })
  })

  describe('getIdentity', () => {
    it('should return user identity when authenticated', async () => {
      localStorage.setItem('access_token', 'valid-token')

      const result = await authProvider.getIdentity()

      expect(result).toBeDefined()
      expect(result?.id).toBe('1')
      expect(result?.username).toBe('admin')
      expect(result?.email).toBe('admin@example.com')
    })

    it('should return null when not authenticated', async () => {
      const result = await authProvider.getIdentity()

      expect(result).toBeNull()
    })
  })

  describe('register', () => {
    it('should register new user successfully', async () => {
      const result = await authProvider.register({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(true)
      expect(result.redirectTo).toBe('/admin')
    })

    it('should handle registration with existing email', async () => {
      const result = await authProvider.register({
        username: 'testuser',
        email: 'admin@example.com', // 已存在的邮箱
        password: 'password123',
      })

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('用户名或邮箱已存在')
    })

    it('should handle validation errors', async () => {
      const result = await authProvider.register({
        username: '',
        email: 'invalid-email',
        password: '123',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('onError', () => {
    it('should logout on 401 error', async () => {
      const error = { statusCode: 401, message: 'Unauthorized' }

      const result = await authProvider.onError(error as any)

      expect(result.logout).toBe(true)
      expect(result.redirectTo).toBe('/')
    })

    it('should show error message on other errors', async () => {
      const error = { statusCode: 500, message: 'Internal Server Error' }

      const result = await authProvider.onError(error as any)

      expect(result.logout).toBeUndefined()
      expect(result.error).toBeDefined()
    })

    it('should handle network errors', async () => {
      const result = await authProvider.onError({} as any)

      expect(result).toBeDefined()
    })
  })
})
