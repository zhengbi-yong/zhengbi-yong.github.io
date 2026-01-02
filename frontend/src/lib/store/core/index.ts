/**
 * Store Core - 统一状态管理核心模块
 *
 * 提供标准化的 Zustand store 创建函数和工具
 *
 * @example
 * ```typescript
 * import { createBaseStore } from '@/lib/store/core'
 * import { persist } from 'zustand/middleware'
 *
 * interface AuthState extends BaseStoreState {
 *   user: UserInfo | null
 *   token: string | null
 * }
 *
 * interface AuthActions extends BaseStoreActions {
 *   login: (email: string, password: string) => Promise<void>
 *   logout: () => Promise<void>
 * }
 *
 * type AuthStore = AuthState & AuthActions
 *
 * export const useAuthStore = createBaseStore<AuthStore>('auth', (set, get) => ({
 *   // ... 基础状态
 *   ...createBaseInitialState(),
 *
 *   // 自定义状态
 *   user: null,
 *   token: null,
 *
 *   // Actions
 *   login: async (email, password) => {
 *     // 使用 wrapAsyncAction 包装
 *   },
 *
 *   logout: async () => {
 *     // ...
 *   },
 *
 *   // 基础 actions
 *   setError: (error) => set({ _error: error }),
 *   setLoading: (loading) => set({ _loading: loading }),
 *   clearError: () => set({ _error: null }),
 *   reset: () => set(createBaseInitialState()),
 *   _setLastUpdated: (timestamp) => set({ _lastUpdated: timestamp }),
 * }))
 * ```
 */

export * from './types'
export * from './actions'
