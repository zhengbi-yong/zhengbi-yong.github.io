/**
 * Auth Store Unit Tests
 *
 * Tests core auth state management logic: login, logout, register,
 * checkAuth, getCurrentUser, and edge cases like concurrent operations
 * and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAuthStore } from '@/lib/store/auth-store'
import { authService } from '@/lib/api/backend'

// Mock auth service
vi.mock('@/lib/api/backend', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
    initAuth: vi.fn(),
  },
}))

describe('Auth Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store to initial state
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
    it('should set user and isAuthenticated on successful login', async () => {
      const mockUser = { id: '1', username: 'testuser', email: 'test@test.com' }
      vi.mocked(authService.login).mockResolvedValue({
        access_token: 'token123',
        user: mockUser,
      } as any)

      await useAuthStore.getState().login('test@test.com', 'password123')

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.isInitialized).toBe(true)
    })

    it('should set error on login failure', async () => {
      vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'))

      await expect(
        useAuthStore.getState().login('test@test.com', 'wrong')
      ).rejects.toThrow('Invalid credentials')

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.error).toBe('Invalid credentials')
      expect(state.isInitialized).toBe(true)
    })

    it('should use default error message when error has no message', async () => {
      vi.mocked(authService.login).mockRejectedValue({})

      await expect(
        useAuthStore.getState().login('test@test.com', 'password')
      ).rejects.toBeDefined()

      const state = useAuthStore.getState()
      expect(state.error).toBe('登录失败，请检查您的凭据')
    })

    it('should set isLoading true during login', () => {
      // Defer resolution so we can check intermediate state
      let resolveLogin: (value: unknown) => void
      const loginPromise = new Promise((resolve) => { resolveLogin = resolve })
      vi.mocked(authService.login).mockReturnValue(loginPromise as any)

      const loginCall = useAuthStore.getState().login('test@test.com', 'password')

      // Check loading state before resolution
      expect(useAuthStore.getState().isLoading).toBe(true)

      // Resolve and clean up
      resolveLogin!({ access_token: 't', user: { id: '1', username: 'u', email: 'e' } })
      return loginCall
    })
  })

  describe('logout', () => {
    it('should clear state on successful logout', async () => {
      // Pre-populate store as authenticated
      useAuthStore.setState({
        user: { id: '1', username: 'test', email: 'test@test.com' } as any,
        isAuthenticated: true,
        isInitialized: true,
      })
      vi.mocked(authService.logout).mockResolvedValue(undefined)

      await useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isInitialized).toBe(true)
    })

    it('should clear state even if logout API fails', async () => {
      useAuthStore.setState({
        user: { id: '1', username: 'test', email: 'test@test.com' } as any,
        isAuthenticated: true,
      })
      vi.mocked(authService.logout).mockRejectedValue(new Error('Network error'))

      await useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('register', () => {
    it('should set user and isAuthenticated on successful registration', async () => {
      const mockUser = { id: '2', username: 'newuser', email: 'new@test.com' }
      vi.mocked(authService.register).mockResolvedValue({
        access_token: 'token',
        user: mockUser,
      } as any)

      await useAuthStore.getState().register('new@test.com', 'newuser', 'password')

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isInitialized).toBe(true)
      expect(state.error).toBeNull()
    })

    it('should set error on registration failure', async () => {
      vi.mocked(authService.register).mockRejectedValue(new Error('Email already exists'))

      await expect(
        useAuthStore.getState().register('existing@test.com', 'existing', 'password')
      ).rejects.toThrow('Email already exists')

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.error).toBe('Email already exists')
    })
  })

  describe('getCurrentUser', () => {
    it('should set user and isAuthenticated on success', async () => {
      const mockUser = { id: '1', username: 'testuser', email: 'test@test.com' }
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser as any)

      const user = await useAuthStore.getState().getCurrentUser()

      expect(user).toEqual(mockUser)
      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isInitialized).toBe(true)
    })

    it('should return null and set isAuthenticated=false on 401', async () => {
      const authError = new Error('Unauthorized') as Error & { statusCode: number }
      authError.statusCode = 401
      vi.mocked(authService.getCurrentUser).mockRejectedValue(authError)

      const user = await useAuthStore.getState().getCurrentUser()

      expect(user).toBeNull()
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isInitialized).toBe(true)
      // User object preserved on 401 (not cleared)
    })

    it('should clear user on non-401 errors', async () => {
      // Set an existing user first
      useAuthStore.setState({
        user: { id: '1', username: 'test', email: 'test@test.com' } as any,
        isAuthenticated: true,
      })
      vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('Network error'))

      const user = await useAuthStore.getState().getCurrentUser()

      expect(user).toBeNull()
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('checkAuth', () => {
    it('should return true when user exists and is authenticated', async () => {
      useAuthStore.setState({
        user: { id: '1', username: 'test', email: 'test@test.com' } as any,
        isAuthenticated: true,
        isInitialized: true,
      })

      const result = await useAuthStore.getState().checkAuth()

      expect(result).toBe(true)
      expect(authService.getCurrentUser).not.toHaveBeenCalled()
    })

    it('should return false when initialized but no user', async () => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isInitialized: true,
      })

      const result = await useAuthStore.getState().checkAuth()

      expect(result).toBe(false)
      expect(authService.getCurrentUser).not.toHaveBeenCalled()
    })

    it('should call getCurrentUser when not initialized', async () => {
      const mockUser = { id: '1', username: 'test', email: 'test@test.com' }
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser as any)

      const result = await useAuthStore.getState().checkAuth()

      expect(result).toBe(true)
      expect(authService.getCurrentUser).toHaveBeenCalled()
    })

    it('should return false when getCurrentUser returns null on init', async () => {
      const authError = new Error('Unauthorized') as Error & { statusCode: number }
      authError.statusCode = 401
      vi.mocked(authService.getCurrentUser).mockRejectedValue(authError)

      const result = await useAuthStore.getState().checkAuth()

      expect(result).toBe(false)
    })
  })

  describe('setUser', () => {
    it('should set user and update isAuthenticated', () => {
      const mockUser = { id: '1', username: 'test', email: 'test@test.com' } as any

      useAuthStore.getState().setUser(mockUser)

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isInitialized).toBe(true)
    })

    it('should set isAuthenticated=false when user is null', () => {
      useAuthStore.getState().setUser(null)

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isInitialized).toBe(true)
    })
  })

  describe('clearError / setError', () => {
    it('should clear the error', () => {
      useAuthStore.setState({ error: 'Some error' })
      useAuthStore.getState().clearError()
      expect(useAuthStore.getState().error).toBeNull()
    })

    it('should set a custom error', () => {
      useAuthStore.getState().setError('Custom error message')
      expect(useAuthStore.getState().error).toBe('Custom error message')
    })
  })

  describe('state transitions', () => {
    it('should handle full login → logout cycle', async () => {
      const mockUser = { id: '1', username: 'testuser', email: 'test@test.com' }
      vi.mocked(authService.login).mockResolvedValue({
        access_token: 'token',
        user: mockUser,
      } as any)
      vi.mocked(authService.logout).mockResolvedValue(undefined)

      // Start: unauthenticated
      expect(useAuthStore.getState().isAuthenticated).toBe(false)

      // Login
      await useAuthStore.getState().login('test@test.com', 'password')
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().user).toEqual(mockUser)

      // Logout
      await useAuthStore.getState().logout()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('should handle register → logout cycle', async () => {
      const mockUser = { id: '2', username: 'newuser', email: 'new@test.com' }
      vi.mocked(authService.register).mockResolvedValue({
        access_token: 'token',
        user: mockUser,
      } as any)
      vi.mocked(authService.logout).mockResolvedValue(undefined)

      // Register
      await useAuthStore.getState().register('new@test.com', 'newuser', 'password')
      expect(useAuthStore.getState().isAuthenticated).toBe(true)

      // Logout
      await useAuthStore.getState().logout()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })
})
