/**
 * Refine Auth Provider 测试
 *
 * Tests verify actual auth provider behavior:
 * - check() uses useAuthStore.checkAuth() which returns true if user+isAuthenticated
 *   are already set, otherwise calls authService.getCurrentUser()
 * - check() does NOT call refreshToken - that concept doesn't exist in the current impl
 * - onError(401) returns {logout:false, redirectTo:'/admin'} NOT {logout:true}
 * - getIdentity() reads from store.user first, then calls authService.getCurrentUser()
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authProvider } from '@/lib/providers/refine-auth-provider'
import { authService } from '@/lib/api/backend'
import { useAuthStore } from '@/lib/store/auth-store'
import { resetLocalStorage } from '@/lib/utils/cleanup'

// Mock auth service
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

describe('Refine Auth Provider', () => {
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
      // Store should have been cleared
      const { user, isAuthenticated } = useAuthStore.getState()
      expect(user).toBeNull()
      expect(isAuthenticated).toBe(false)
    })
  })

  describe('check', () => {
    it('should return authenticated when store has user and isAuthenticated', async () => {
      // Pre-populate store (simulates already-logged-in state)
      useAuthStore.setState({
        user: { id: '1', username: 'testuser', email: 'test@test.com' },
        isAuthenticated: true,
        isInitialized: true,
      })

      const result = await authProvider.check()

      expect(result.authenticated).toBe(true)
      // Should NOT call getCurrentUser when already authenticated
      expect(authService.getCurrentUser).not.toHaveBeenCalled()
    })

    it('should return unauthenticated when no token (store not initialized)', async () => {
      // Store is in initial state (not initialized, no user)
      vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('Not authenticated'))

      const result = await authProvider.check()

      expect(result.authenticated).toBe(false)
      expect(result.logout).toBe(true)
      expect(result.redirectTo).toBe('/')
    })

    it('should return unauthenticated when store is initialized but no user', async () => {
      // Store is initialized with no user (session expired)
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isInitialized: true,
      })

      const result = await authProvider.check()

      // isInitialized=true means we already tried to auth and found no session
      expect(result.authenticated).toBe(false)
      // Should NOT call API again - checkAuth returns false without calling getCurrentUser
      expect(authService.getCurrentUser).not.toHaveBeenCalled()
    })

    it('should call getCurrentUser when store needs initialization', async () => {
      // Store is not initialized yet (first check)
      vi.mocked(authService.getCurrentUser).mockResolvedValue({
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
      })

      const result = await authProvider.check()

      expect(result.authenticated).toBe(true)
      expect(authService.getCurrentUser).toHaveBeenCalled()
    })

    it('should return unauthenticated when getCurrentUser fails on init', async () => {
      // Store needs initialization and API call fails
      vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('Network error'))

      const result = await authProvider.check()

      expect(result.authenticated).toBe(false)
      expect(result.logout).toBe(true)
      expect(result.redirectTo).toBe('/')
    })
  })

  describe('getIdentity', () => {
    it('should return identity from store user', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@test.com',
        profile: { avatar_url: 'avatar.jpg' },
        role: 'user',
      }

      useAuthStore.setState({
        user: mockUser as any,
        isAuthenticated: true,
        isInitialized: true,
      })

      const result = await authProvider.getIdentity()

      expect(result).toEqual({
        id: '1',
        name: 'testuser',
        email: 'test@test.com',
        avatar: 'avatar.jpg',
        role: 'user',
      })
      // Should NOT call API when store has user
      expect(authService.getCurrentUser).not.toHaveBeenCalled()
    })

    it('should fetch user from API if store has no user', async () => {
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
    it('should NOT logout on 401 - just redirect to /admin with error', async () => {
      const error = { statusCode: 401, message: 'Unauthorized' }

      const result = await authProvider.onError(error as any)

      // Actual behavior: logout:false, redirectTo:'/admin'
      expect(result.logout).toBe(false)
      expect(result.redirectTo).toBe('/admin')
      expect(result.error).toEqual(error)
    })

    it('should return error for other status codes without logout', async () => {
      const error = { statusCode: 500, message: 'Server error' }

      const result = await authProvider.onError(error as any)

      expect(result.error).toEqual(error)
      expect(result.logout).toBeUndefined()
      expect(result.redirectTo).toBeUndefined()
    })
  })
})
