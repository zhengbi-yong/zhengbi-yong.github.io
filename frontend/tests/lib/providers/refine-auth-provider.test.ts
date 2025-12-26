/**
 * Refine Auth Provider 测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authProvider } from '@/lib/providers/refine-auth-provider'
import { authService } from '@/lib/api/backend'

// Mock auth service
vi.mock('@/lib/api/backend', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    refreshToken: vi.fn(),
    register: vi.fn(),
  },
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('Refine Auth Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        access_token: 'token123',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@test.com',
        },
      }

      vi.mocked(authService.login).mockResolvedValue(mockResponse)

      const result = await authProvider.login({
        email: 'test@test.com',
        password: 'password123',
      })

      expect(result.success).toBe(true)
      expect(result.redirectTo).toBe('/admin')
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      })
    })

    it('should handle login failure', async () => {
      const error = new Error('Invalid credentials')
      vi.mocked(authService.login).mockRejectedValue(error)

      const result = await authProvider.login({
        email: 'test@test.com',
        password: 'wrongpassword',
      })

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Invalid credentials')
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      vi.mocked(authService.logout).mockResolvedValue(undefined)

      const result = await authProvider.logout()

      expect(result.success).toBe(true)
      expect(result.redirectTo).toBe('/')
      expect(authService.logout).toHaveBeenCalled()
    })

    it('should logout even if API fails', async () => {
      const error = new Error('Logout failed')
      vi.mocked(authService.logout).mockRejectedValue(error)

      const result = await authProvider.logout()

      expect(result.success).toBe(true)
      expect(result.redirectTo).toBe('/')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user_info')
    })
  })

  describe('check', () => {
    it('should return authenticated when token exists', async () => {
      localStorageMock.getItem.mockReturnValue('token123')
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
      }

      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser)

      const result = await authProvider.check()

      expect(result.authenticated).toBe(true)
      expect(authService.getCurrentUser).toHaveBeenCalled()
    })

    it('should return unauthenticated when no token', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = await authProvider.check()

      expect(result.authenticated).toBe(false)
      expect(result.logout).toBe(true)
      expect(result.redirectTo).toBe('/')
    })

    it('should refresh token when getCurrentUser fails', async () => {
      localStorageMock.getItem.mockReturnValue('expired_token')
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
      }

      vi.mocked(authService.getCurrentUser)
        .mockRejectedValueOnce(new Error('Token expired'))
        .mockResolvedValueOnce(mockUser)
      vi.mocked(authService.refreshToken).mockResolvedValue({
        access_token: 'new_token',
      })

      const result = await authProvider.check()

      expect(result.authenticated).toBe(true)
      expect(authService.refreshToken).toHaveBeenCalled()
    })

    it('should logout when refresh fails', async () => {
      localStorageMock.getItem.mockReturnValue('expired_token')

      // 确保每次调用都返回 rejected
      const getCurrentUserMock = vi.mocked(authService.getCurrentUser)
      getCurrentUserMock.mockReset()
      getCurrentUserMock.mockRejectedValue(new Error('Token expired'))
      
      // refreshToken 也失败
      const refreshTokenMock = vi.mocked(authService.refreshToken)
      refreshTokenMock.mockReset()
      refreshTokenMock.mockRejectedValue(new Error('Refresh failed'))

      const result = await authProvider.check()

      // 验证 getCurrentUser 被调用
      expect(getCurrentUserMock).toHaveBeenCalledTimes(1)
      
      // 验证 refreshToken 被调用（在 getCurrentUser 失败后）
      expect(refreshTokenMock).toHaveBeenCalledTimes(1)
      
      // 当刷新失败时，应该返回未认证状态
      expect(result.authenticated).toBe(false)
      expect(result.logout).toBe(true)
      expect(result.redirectTo).toBe('/')
    })
  })

  describe('getIdentity', () => {
    it('should return user identity from localStorage', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        profile: { avatar: 'avatar.jpg' },
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser))

      const result = await authProvider.getIdentity()

      expect(result).toEqual({
        id: '1',
        name: 'testuser',
        email: 'test@test.com',
        avatar: 'avatar.jpg',
        role: 'user',
      })
    })

    it('should fetch user from API if not in localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(null)
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        profile: null,
        email_verified: false,
      }

      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser as any)

      const result = await authProvider.getIdentity()

      expect(result).toEqual({
        id: '1',
        name: 'testuser',
        email: 'test@test.com',
        avatar: undefined,
        role: 'user',
      })
      expect(authService.getCurrentUser).toHaveBeenCalled()
    })

    it('should return null on error', async () => {
      localStorageMock.getItem.mockReturnValue(null)
      vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('Failed'))

      const result = await authProvider.getIdentity()

      expect(result).toBeNull()
    })
  })

  describe('register', () => {
    it('should register successfully', async () => {
      const mockResponse = {
        access_token: 'token123',
        user: {
          id: '1',
          username: 'newuser',
          email: 'newuser@test.com',
        },
      }

      vi.mocked(authService.register).mockResolvedValue(mockResponse)

      const result = await authProvider.register({
        email: 'newuser@test.com',
        username: 'newuser',
        password: 'password123',
      })

      expect(result.success).toBe(true)
      expect(result.redirectTo).toBe('/admin')
      expect(authService.register).toHaveBeenCalledWith({
        email: 'newuser@test.com',
        username: 'newuser',
        password: 'password123',
      })
    })

    it('should handle registration failure', async () => {
      const error = new Error('Email already exists')
      vi.mocked(authService.register).mockRejectedValue(error)

      const result = await authProvider.register({
        email: 'existing@test.com',
        username: 'existing',
        password: 'password123',
      })

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Email already exists')
    })
  })

  describe('onError', () => {
    it('should logout on 401 error', async () => {
      const error = { statusCode: 401, message: 'Unauthorized' }

      const result = await authProvider.onError(error as any)

      expect(result.logout).toBe(true)
      expect(result.redirectTo).toBe('/')
    })

    it('should return error for other status codes', async () => {
      const error = { statusCode: 500, message: 'Server error' }

      const result = await authProvider.onError(error as any)

      expect(result.error).toEqual(error)
      expect(result.logout).toBeUndefined()
    })
  })
})

