/**
 * 统一的 Store 基础类型
 * 提供标准化的状态结构和错误处理
 */

/**
 * 基础状态接口
 * 所有 store 都应包含这些通用字段
 */
export interface BaseStoreState {
  _initialized: boolean
  _error: string | null
  _loading: boolean
  _lastUpdated: number | null
}

/**
 * 基础 Actions 接口
 * 提供标准的错误和加载状态管理
 */
export interface BaseStoreActions {
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  clearError: () => void
  reset: () => void
  _setLastUpdated: (timestamp: number) => void
}

/**
 * Store 类型标识
 */
export type StoreType = 'auth' | 'blog' | 'comment' | 'post' | 'ui'

/**
 * Store 配置选项
 */
export interface StoreConfig<T extends StoreType> {
  name: T
  persist?: boolean
  devtools?: boolean
  partialize?: (state: any) => any
}

/**
 * 异步 Action 包装器类型
 */
export type AsyncAction<T = void> = () => Promise<T>

/**
 * 错误处理函数类型
 */
export type ErrorHandler = (error: unknown) => string

/**
 * 默认错误处理器
 */
export const defaultErrorHandler: ErrorHandler = (error) => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred'
}

/**
 * 创建初始基础状态
 */
export function createBaseInitialState(): BaseStoreState {
  return {
    _initialized: false,
    _error: null,
    _loading: false,
    _lastUpdated: null,
  }
}
