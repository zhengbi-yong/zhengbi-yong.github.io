import { create } from './create-store'
import { authService } from '../api/backend'
import type { UserInfo } from '../types/backend'

interface AuthState {
  // State
  user: UserInfo | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  isInitialized: boolean

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  getCurrentUser: () => Promise<UserInfo | null>
  clearError: () => void
  setError: (error: string) => void
  setUser: (user: UserInfo | null) => void
  checkAuth: () => Promise<boolean>
}

/**
 * Authentication Store
 * Manages user authentication state and actions
 */
export const useAuthStore = create<AuthState>()((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,

  // Login action
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.login({ email, password })
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      })
    } catch (error: any) {
      const errorMessage = error?.message || '登录失败，请检查您的凭据'
      set({
        error: errorMessage,
        isLoading: false,
        isInitialized: true,
      })
      throw error
    }
  },

  // Register action
  register: async (email: string, username: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.register({ email, username, password })
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      })
    } catch (error: any) {
      const errorMessage = error?.message || '注册失败，请稍后重试'
      set({
        error: errorMessage,
        isLoading: false,
        isInitialized: true,
      })
      throw error
    }
  },

  // Logout action
  logout: async () => {
    set({ isLoading: true })
    try {
      await authService.logout()
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      })
    } catch (error) {
      // Even if logout API fails, clear local state
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      })
    }
  },

  // Get current user action
  getCurrentUser: async () => {
    set({ isLoading: true })
    try {
      const user = await authService.getCurrentUser()
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        error: null,
      })
      return user
    } catch (error) {
      // Clear auth state if fetch fails
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      })
      return null
    }
  },

  // Check authentication status
  checkAuth: async () => {
    const { user, isAuthenticated, isInitialized } = get()

    if (user && isAuthenticated) {
      return true
    }

    if (isInitialized) {
      return false
    }

    const currentUser = await get().getCurrentUser()
    return Boolean(currentUser)
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Set error
  setError: (error: string) => set({ error }),

  // Set user
  setUser: (user: UserInfo | null) =>
    set({ user, isAuthenticated: Boolean(user), isInitialized: true }),
}))

// Initialize auth from cookie-based session on app start
// GOLDEN_RULES 1.1: 令牌仅存在于 HttpOnly Cookie 中, 前端不存储令牌
export async function initAuth() {
  useAuthStore.setState({ isLoading: true })

  try {
    const { user } = await authService.initAuth()

    useAuthStore.setState({
      user,
      isAuthenticated: Boolean(user),
      isLoading: false,
      error: null,
      isInitialized: true,
    })
  } catch {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: true,
    })
  }
}
