/**
 * Refine Auth Provider
 * 适配现有的认证系统
 */

import { AuthProvider } from '@refinedev/core'
import { authService } from '@/lib/api/backend'
import type { UserInfo } from '@/lib/types/backend'

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const response = await authService.login({ email, password })
      
      // 用户信息已存储在 localStorage 中（由 authService 处理）
      return {
        success: true,
        redirectTo: '/admin',
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          name: 'LoginError',
          message: error?.message || '登录失败，请检查您的凭据',
        },
      }
    }
  },

  logout: async () => {
    try {
      await authService.logout()
      return {
        success: true,
        redirectTo: '/',
      }
    } catch (error) {
      // 即使 API 失败，也清除本地状态
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_info')
      }
      return {
        success: true,
        redirectTo: '/',
      }
    }
  },

  check: async () => {
    try {
      // 检查是否有 token
      if (typeof window === 'undefined') {
        return {
          authenticated: false,
          redirectTo: '/',
          logout: true,
        }
      }

      const token = localStorage.getItem('access_token')
      if (!token) {
        return {
          authenticated: false,
          redirectTo: '/',
          logout: true,
        }
      }

      // 尝试获取当前用户信息
      try {
        const user = await authService.getCurrentUser()
        return {
          authenticated: true,
        }
      } catch (error) {
        // Token 可能已过期，尝试刷新
        try {
          await authService.refreshToken()
          return {
            authenticated: true,
          }
        } catch {
          // 刷新失败，需要重新登录
          return {
            authenticated: false,
            redirectTo: '/',
            logout: true,
          }
        }
      }
    } catch (error) {
      return {
        authenticated: false,
        redirectTo: '/',
        logout: true,
      }
    }
  },

  onError: async (error) => {
    // 如果是 401 错误，可能需要重新登录
    if (error?.statusCode === 401) {
      return {
        logout: true,
        redirectTo: '/',
        error,
      }
    }

    return {
      error,
    }
  },

  getIdentity: async () => {
    try {
      if (typeof window === 'undefined') {
        return null
      }

      const userInfoStr = localStorage.getItem('user_info')
      if (userInfoStr) {
        const userInfo: UserInfo = JSON.parse(userInfoStr)
        return {
          id: userInfo.id,
          name: userInfo.username,
          email: userInfo.email,
          avatar: userInfo.profile?.avatar || undefined,
          role: (userInfo as any).role || 'user',
        }
      }

      // 如果没有缓存，尝试从 API 获取
      const user = await authService.getCurrentUser()
      return {
        id: user.id,
        name: user.username,
        email: user.email,
        avatar: user.profile?.avatar || undefined,
        role: (user as any).role || 'user',
      }
    } catch (error) {
      return null
    }
  },

  register: async ({ email, username, password }) => {
    try {
      const response = await authService.register({ email, username, password })
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
    // TODO: 实现忘记密码功能
    return {
      success: false,
      error: {
        name: 'ForgotPasswordError',
        message: '忘记密码功能尚未实现',
      },
    }
  },

  updatePassword: async ({ password, newPassword }) => {
    // TODO: 实现更新密码功能
    return {
      success: false,
      error: {
        name: 'UpdatePasswordError',
        message: '更新密码功能尚未实现',
      },
    }
  },
}

