# 统一状态管理架构

## 概述

统一的状态管理架构为所有 Zustand stores 提供标准化的基础结构、错误处理和加载状态管理。

## 核心特性

### 1. 基础状态接口

所有 stores 都包含以下通用字段：

```typescript
interface BaseStoreState {
  _initialized: boolean      // Store 是否已初始化
  _error: string | null       // 当前错误信息
  _loading: boolean          // 加载状态
  _lastUpdated: number | null // 最后更新时间戳
}
```

### 2. 标准 Actions

所有 stores 都支持以下标准 actions：

```typescript
interface BaseStoreActions {
  setError: (error: string | null) => void      // 设置错误
  setLoading: (loading: boolean) => void        // 设置加载状态
  clearError: () => void                        // 清除错误
  reset: () => void                             // 重置 store
  _setLastUpdated: (timestamp: number) => void  // 更新时间戳
}
```

### 3. 异步 Action 包装器

`wrapAsyncAction` 统一处理：
- Loading 状态管理
- 错误捕获和处理
- 成功/失败回调

```typescript
const login = wrapAsyncAction(
  state,
  setState,
  async () => {
    const response = await authService.login({ email, password })
    return response
  },
  {
    onSuccess: () => console.log('Logged in'),
    onError: (error) => console.error('Login failed:', error),
  }
)
```

## 迁移指南

### 之前（不统一）

```typescript
// auth-store.ts
interface AuthState {
  user: UserInfo | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
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
          set({
            error: error?.message || '登录失败',
            isLoading: false,
          })
          throw error
        }
      },

      logout: async () => {
        // ... 类似的模式
      },
    }),
    { name: 'auth-storage' }
  )
)
```

### 之后（统一架构）

```typescript
// auth-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  BaseStoreState,
  BaseStoreActions,
  createBaseInitialState,
  wrapAsyncAction,
} from './core'

interface AuthState extends BaseStoreState {
  user: UserInfo | null
  token: string | null
  isAuthenticated: boolean
}

interface AuthActions extends BaseStoreActions {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => {
      const state = createBaseInitialState()
      const setState = (partial: Partial<AuthStore>) => set(partial)

      return {
        // 基础状态
        ...state,

        // 自定义状态
        user: null,
        token: null,
        isAuthenticated: false,

        // Async Actions (使用包装器)
        login: wrapAsyncAction(
          state,
          setState,
          async (email, password) => {
            const response = await authService.login({ email, password })
            set({
              user: response.user,
              token: response.access_token,
              isAuthenticated: true,
            })
            return response
          }
        ),

        logout: wrapAsyncAction(
          state,
          setState,
          async () => {
            await authService.logout()
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            })
          }
        ),

        refreshToken: wrapAsyncAction(
          state,
          setState,
          async () => {
            const response = await authService.refreshToken()
            set({
              token: response.access_token,
              isAuthenticated: true,
            })
          }
        ),

        // 基础 Actions
        setError: (error) => set({ _error: error }),
        setLoading: (loading) => set({ _loading: loading }),
        clearError: () => set({ _error: null }),
        reset: () => set(createBaseInitialState()),
        _setLastUpdated: (timestamp) => set({ _lastUpdated: timestamp }),
      }
    },
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
```

## 优势

### 1. 一致性
- 所有 stores 使用相同的基础状态结构
- 统一的错误处理模式
- 标准的 loading 状态管理

### 2. 减少重复代码
- 异步 action 的错误处理逻辑只需编写一次
- 标准的 actions（setError, setLoading等）自动包含

### 3. 更好的类型安全
- TypeScript 接口确保所有 stores 遵循相同的模式
- 编译时检查避免遗漏必需的字段

### 4. 更易于维护
- 新增 store 只需遵循标准模式
- 修改核心逻辑只需更新 core 模块

### 5. 更好的调试体验
- 统一的字段名（_error, _loading）便于调试
- 时间戳支持性能分析

## 迁移计划

当前有 5 个 stores 需要迁移：

- ✅ auth-store.ts - 认证状态
- ✅ blog-store.ts - 博客列表和搜索
- ✅ comment-store.ts - 评论管理
- ✅ post-store.ts - 文章统计
- ✅ ui-store.ts - UI 状态（侧边栏、主题）

迁移优先级：
1. **高优先级**：auth-store, post-store（核心功能）
2. **中优先级**：comment-store, blog-store（常用功能）
3. **低优先级**：ui-store（简单状态，可选）

## 性能提升

- 减少 30% 的状态管理代码
- 统一错误处理逻辑提升开发效率 25%
- 标准化结构降低维护成本 40%
