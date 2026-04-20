/**
 * Refine Auth Provider
 * 适配现有的认证系统
 *
 * GOLDEN_RULES 1.1: 认证令牌必须仅存在于 HttpOnly Cookie 中
 * - 不再从 localStorage 读取或存储 token
 * - 认证状态通过调用 /auth/me API 检查
 * - 浏览器自动发送 HttpOnly Cookie
 */

import { AuthProvider } from '@refinedev/core'
import { authService } from '@/lib/api/backend'
import { useAuthStore } from '@/lib/store/auth-store'

function getAvatarUrl(profile: Record<string, unknown> | null): string | undefined {
  const value = profile?.avatar_url
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      await useAuthStore.getState().login(email, password)

      return {
        success: true,
        redirectTo: '/admin',
      }
    } catch (error: unknown) {
      return {
        success: false,
        error: {
          name: 'LoginError',
          message: error instanceof Error ? error.message : '登录失败，请检查您的凭据',
        },
      }
    }
  },

  logout: async () => {
    await useAuthStore.getState().logout()
    return {
      success: true,
      redirectTo: '/',
    }
  },

  check: async () => {
    try {
      const store = useAuthStore.getState()
      const authenticated = await store.checkAuth()

      if (!authenticated) {
        return {
          authenticated: false,
          redirectTo: '/',
          logout: true,
        }
      }

      return {
        authenticated: true,
      }
    } catch {
      return {
        authenticated: false,
        redirectTo: '/',
        logout: true,
      }
    }
  },

  onError: async (error) => {
    // If 401 error, don't call logout() here - that would clear state and trigger
    // a cascade of issues. The auth state should only be cleared when the user
    // explicitly logs out, or when the session is confirmed expired by the server.
    // Let the components handle the redirect based on check() result instead.
    if (error?.statusCode === 401) {
      return {
        logout: false, // Don't logout - just let the component show login
        redirectTo: '/admin',
        error,
      }
    }

    return {
      error,
    }
  },

  getIdentity: async () => {
    try {
      const store = useAuthStore.getState()
      const user = store.user ?? (await authService.getCurrentUser())

      if (!store.user) {
        store.setUser(user)
      }

      return {
        id: user.id,
        name: user.username,
        email: user.email,
        avatar: getAvatarUrl(user.profile),
        role: user.role || 'user',
      }
    } catch {
      return null
    }
  },

  register: async ({ email, username, password }) => {
    try {
      await authService.register({ email, username, password })
      return {
        success: true,
        redirectTo: '/admin',
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          name: 'RegisterError',
          message: error?.message || '注册失败，请稍后重试',
        },
      }
    }
  },

  forgotPassword: async ({ email }) => {
    try {
      await authService.forgotPassword(email)
      return { success: true }
    } catch (error: unknown) {
      return {
        success: false,
        error: {
          name: 'ForgotPasswordError',
          message: error instanceof Error ? error.message : '发送重置邮件失败',
        },
      }
    }
  },

  updatePassword: async ({ token, password }: { token: string; password: string }) => {
    try {
      await authService.resetPassword(token, password)
      return { success: true, redirectTo: '/' }
    } catch (error: unknown) {
      return {
        success: false,
        error: {
          name: 'UpdatePasswordError',
          message: error instanceof Error ? error.message : '密码更新失败',
        },
      }
    }
  },
}
