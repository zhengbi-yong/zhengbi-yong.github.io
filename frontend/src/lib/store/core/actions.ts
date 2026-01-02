import type { AsyncAction, ErrorHandler, BaseStoreState } from './types'
import { defaultErrorHandler } from './types'

/**
 * 异步 Action 包装器选项
 */
interface WrapAsyncActionOptions {
  /** 错误处理器 */
  errorHandler?: ErrorHandler
  /** 成功后的回调 */
  onSuccess?: () => void
  /** 失败后的回调 */
  onError?: (error: string) => void
  /** 是否在开始时清除之前的错误 */
  clearPreviousError?: boolean
}

/**
 * 包装异步 Action
 * 统一处理 loading、error 状态
 *
 * @example
 * ```typescript
 * const login: AsyncAction = wrapAsyncAction(async () => {
 *   const response = await authService.login({ email, password })
 *   return response
 * }, {
 *   onSuccess: () => {
 *     // 额外的成功逻辑
 *   }
 * })
 * ```
 */
export function wrapAsyncAction<T>(
  state: BaseStoreState,
  setState: (partial: Partial<BaseStoreState & Record<string, any>>) => void,
  asyncAction: () => Promise<T>,
  options: WrapAsyncActionOptions = {}
): () => Promise<T> {
  const {
    errorHandler = defaultErrorHandler,
    onSuccess,
    onError,
    clearPreviousError = true,
  } = options

  return async () => {
    // 设置 loading 状态
    setState({
      _loading: true,
      ...(clearPreviousError && { _error: null }),
    })

    try {
      const result = await asyncAction()

      // 成功：清除 loading，更新时间戳
      setState({
        _loading: false,
        _lastUpdated: Date.now(),
        _error: null,
      })

      // 执行成功回调
      onSuccess?.()

      return result
    } catch (error) {
      // 失败：处理错误，清除 loading
      const errorMessage = errorHandler(error)
      setState({
        _error: errorMessage,
        _loading: false,
      })

      // 执行错误回调
      onError?.(errorMessage)

      throw error
    }
  }
}

/**
 * 包装多个异步 Action
 * 批量处理 loading、error 状态
 */
export function wrapBatchAsyncAction<T extends any[]>(
  state: BaseStoreState,
  setState: (partial: Partial<BaseStoreState & Record<string, any>>) => void,
  asyncActions: Array<() => Promise<any>>,
  options: Omit<WrapAsyncActionOptions, 'clearPreviousError'> = {}
): () => Promise<T> {
  const { errorHandler = defaultErrorHandler } = options

  return async () => {
    setState({ _loading: true, _error: null })

    try {
      const results = await Promise.all(asyncActions.map((action) => action()))

      setState({
        _loading: false,
        _lastUpdated: Date.now(),
      })

      return results as T
    } catch (error) {
      const errorMessage = errorHandler(error)
      setState({
        _error: errorMessage,
        _loading: false,
      })

      throw error
    }
  }
}

/**
 * 创建标准的同步 Action
 */
export function createAction<T extends any[] = []>(
  setState: (partial: Partial<BaseStoreState & Record<string, any>>) => void,
  handler: (...args: T) => Partial<BaseStoreState & Record<string, any>>
): (...args: T) => void {
  return (...args: T) => {
    setState({
      ...handler(...args),
      _lastUpdated: Date.now(),
    })
  }
}

/**
 * 创建标准的 getter
 * 提供类型安全的 state 访问
 */
export function createSelector<TState, TResult>(
  selector: (state: TState) => TResult
): (state: TState) => TResult {
  return selector
}
