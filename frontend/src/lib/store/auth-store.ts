import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '../api/backend'
import type { UserInfo } from '../types/backend'

interface AuthState {
  // State
  user: UserInfo | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  getCurrentUser: () => Promise<void>
  refreshToken: () => Promise<void>
  clearError: () => void
  setError: (error: string) => void
  setUser: (user: UserInfo | null) => void
  setToken: (token: string | null) => void
  checkAuth: () => Promise<boolean>
}

/**
 * Authentication Store
 * Manages user authentication state and actions
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.login({ email, password })
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: any) {
          const errorMessage = error?.message || '登录失败，请检查您的凭据'
          set({
            error: errorMessage,
            isLoading: false,
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
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: any) {
          const errorMessage = error?.message || '注册失败，请稍后重试'
          set({
            error: errorMessage,
            isLoading: false,
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
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        } catch (error) {
          // Even if logout API fails, clear local state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      // Get current user action
      getCurrentUser: async () => {
        const { token } = get()
        if (!token) return

        set({ isLoading: true })
        try {
          const user = await authService.getCurrentUser()
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          // Token might be expired, try to refresh
          try {
            await get().refreshToken()
            // Retry after refresh
            const user = await authService.getCurrentUser()
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            })
          } catch {
            // Clear auth state if refresh fails
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        }
      },

      // Refresh token action
      refreshToken: async () => {
        try {
          const response = await authService.refreshToken()
          set({
            token: response.access_token,
            isAuthenticated: true,
          })
        } catch (error) {
          // Refresh failed, clear auth state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          })
          throw error
        }
      },

      // Check authentication status
      checkAuth: async () => {
        const { token, user } = get()
        if (!token) return false

        // If we have both token and user, consider authenticated
        if (user) return true

        // Try to fetch user info
        try {
          await get().getCurrentUser()
          return true
        } catch {
          return false
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Set error
      setError: (error: string) => set({ error }),

      // Set user
      setUser: (user: UserInfo | null) => set({ user }),

      // Set token
      setToken: (token: string | null) => set({ token }),
    }),
    {
      name: 'auth-storage',
      // Only persist user and token, not loading/error states
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Initialize auth from localStorage on app start
export function initAuth() {
  const { token, user } = authService.initAuth()
  if (token && user) {
    useAuthStore.setState({
      token,
      user,
      isAuthenticated: true,
    })
  }
}
