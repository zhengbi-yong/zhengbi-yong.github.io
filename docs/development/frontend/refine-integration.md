# Refine 集成指南

本文档说明如何在项目中使用 Refine 框架进行管理后台开发。

## 概述

Refine 是一个 React 框架，用于快速构建 CRUD 应用。它已完全集成到项目的管理后台中，提供了强大的数据管理、状态管理和自动化功能。

**集成状态**: ✅ 完全集成并测试通过 (52个测试，100%通过率)

**完成时间**: 2025-12-15

---

## 已安装的包

| 包名 | 版本 | 用途 |
|------|------|------|
| `@refinedev/core` | latest | Refine 核心功能 |
| `@refinedev/nextjs-router` | latest | Next.js App Router 集成 |
| `@refinedev/react-hook-form` | latest | React Hook Form 集成 |
| `@refinedev/simple-rest` | latest | REST API 数据提供者 |
| `@refinedev/kbar` | latest | 命令面板功能 |

---

## 项目结构

```
frontend/
├── lib/providers/
│   ├── refine-provider.tsx          # Refine 主提供者
│   ├── refine-data-provider.ts      # 数据提供者（适配后端 API）
│   └── refine-auth-provider.ts      # 认证提供者（适配认证系统）
├── app/admin/
│   ├── layout.tsx                   # Admin 布局（已集成 Refine）
│   ├── page.tsx                     # 仪表板（已迁移）
│   ├── users/page.tsx               # 用户管理（已迁移）
│   └── comments/page.tsx            # 评论管理（已迁移）
└── tests/
    ├── lib/providers/
    │   ├── refine-data-provider.test.ts      # Data Provider 测试
    │   └── refine-auth-provider.test.ts      # Auth Provider 测试
    └── app/admin/
        ├── users-refine.test.tsx             # 用户页面测试
        ├── comments-refine.test.tsx          # 评论页面测试
        └── dashboard-refine.test.tsx         # 仪表板测试
```

---

## 核心组件

### 1. Refine Provider

**文件**: `lib/providers/refine-provider.tsx`

整合所有提供者的主组件：

```typescript
import { Refine } from '@refinedev/core'
import { RefineKbar } from '@refinedev/kbar'
import routerProvider from '@refinedev/nextjs-router'
import { dataProvider } from './refine-data-provider'
import { authProvider } from './refine-auth-provider'

export function RefineProvider({ children }: { children: React.ReactNode }) {
  return (
    <Refine
      dataProvider={dataProvider}
      authProvider={authProvider}
      routerProvider={routerProvider}
      resources={[
        {
          name: 'admin/users',
          list: '/admin/users',
        },
        {
          name: 'admin/comments',
          list: '/admin/comments',
        },
        {
          name: 'admin/stats',
          list: '/admin',
        },
      ]}
    >
      {children}
      <RefineKbar />
    </Refine>
  )
}
```

---

### 2. Data Provider

**文件**: `lib/providers/refine-data-provider.ts`

**功能**: 适配后端 API，处理所有 CRUD 操作

**支持的操作**:
- ✅ `getList` - 列表查询（支持分页、筛选、排序）
- ✅ `getOne` - 单个资源查询
- ✅ `create` - 创建资源
- ✅ `update` - 更新资源（包括特殊端点）
- ✅ `deleteOne` - 删除资源
- ✅ `custom` - 自定义请求

**特殊处理**:
- 自动转换分页参数（`current` → `page`, `pageSize` → `page_size`）
- 支持 `admin/stats` 端点（返回单个对象）
- 支持特殊更新端点（`/role`, `/status`）
- 完整的错误处理

**示例**:
```typescript
// 获取用户列表
const { data } = await dataProvider.getList('admin/users', {
  pagination: { current: 1, pageSize: 20 },
  filters: [{ field: 'role', operator: 'eq', value: 'admin' }],
  sorters: [{ field: 'created_at', order: 'desc' }],
})

// 更新用户角色
const user = await dataProvider.update('admin/users', {
  id: 'user-id',
  variables: { role: 'admin' },
  meta: { endpoint: '/role' }, // 特殊端点
})
```

---

### 3. Auth Provider

**文件**: `lib/providers/refine-auth-provider.ts`

**功能**: 集成现有的认证系统

**支持的操作**:
- ✅ `login` - 用户登录
- ✅ `logout` - 用户登出
- ✅ `check` - 认证检查（自动刷新 token）
- ✅ `getIdentity` - 获取用户身份
- ✅ `register` - 用户注册
- ✅ `onError` - 错误处理

**特点**:
- 使用现有的 `authService`
- 从 localStorage 读取 token
- 自动刷新过期 token
- 完整的错误处理

**示例**:
```typescript
// 登录
await authProvider.login({
  email: 'user@example.com',
  password: 'password123',
})

// 检查认证状态
const authenticated = await authProvider.check()

// 获取当前用户
const user = await authProvider.getIdentity()
```

---

## 使用方法

### 基本使用

#### 1. 使用 Refine Hooks

Refine 提供了多个 hooks 来管理数据：

```typescript
import { useList, useCreate, useUpdate, useDelete } from '@refinedev/core'

// 获取列表数据
const { data, isLoading, error } = useList({
  resource: 'admin/users',
  pagination: {
    current: 1,
    pageSize: 20,
  },
  filters: [
    {
      field: 'role',
      operator: 'eq',
      value: 'admin',
    },
  ],
})

// 创建资源
const { mutate: create } = useCreate()
create({
  resource: 'admin/users',
  values: {
    username: 'newuser',
    email: 'user@example.com',
  },
})

// 更新资源
const { mutate: update } = useUpdate()
update({
  resource: 'admin/users',
  id: 'user-id',
  values: {
    role: 'admin',
  },
})

// 删除资源
const { mutate: delete } = useDelete()
delete({
  resource: 'admin/users',
  id: 'user-id',
})
```

#### 2. 资源定义

资源在 `refine-provider.tsx` 中定义：

```typescript
resources={[
  {
    name: 'admin/users',
    list: '/admin/users',
    show: '/admin/users/show/:id',
    edit: '/admin/users/edit/:id',
  },
  {
    name: 'admin/comments',
    list: '/admin/comments',
    show: '/admin/comments/show/:id',
    edit: '/admin/comments/edit/:id',
  },
]}
```

---

### 完整示例：用户管理页面

```typescript
'use client'

import { useList, useUpdate, useDelete } from '@refinedev/core'
import { useState } from 'react'

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const pageSize = 20

  // 获取用户列表
  const { data, isLoading, error } = useList({
    resource: 'admin/users',
    pagination: { current: page, pageSize },
  })

  // 更新用户角色
  const { mutate: update } = useUpdate()
  const updateRole = (userId: string, role: string) => {
    update({
      resource: 'admin/users',
      id: userId,
      values: { role },
      meta: { endpoint: '/role' },
    })
  }

  // 删除用户
  const { mutate: delete } = useDelete()
  const deleteUser = (userId: string) => {
    delete({
      resource: 'admin/users',
      id: userId,
    })
  }

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>加载失败</div>

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {data?.data.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <button onClick={() => updateRole(user.id, 'admin')}>
                  设为管理员
                </button>
                <button onClick={() => deleteUser(user.id)}>
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 分页 */}
      <div>
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          上一页
        </button>
        <span>第 {page} 页</span>
        <button onClick={() => setPage(page + 1)}>
          下一页
        </button>
      </div>
    </div>
  )
}
```

---

## 从自定义 Hooks 迁移

### 迁移对照表

| 之前（自定义 hooks） | 之后（Refine hooks） |
|---------------------|---------------------|
| `useUsers(page, pageSize)` | `useList({ resource: 'admin/users', pagination: { current: page, pageSize } })` |
| `useUpdateUserRole()` | `useUpdate()` + `meta: { endpoint: '/role' }` |
| `useDeleteUser()` | `useDelete()` |
| `useComments(page, pageSize, status)` | `useList({ resource: 'admin/comments', filters: [{ field: 'status', operator: 'eq', value: status }] })` |
| `useAdminStats()` | `useList({ resource: 'admin/stats' })` |

### 迁移示例

**之前（自定义 hooks）**:
```typescript
import { useUsers, useUpdateUserRole } from '@/lib/hooks/use-admin'

const { data, isLoading } = useUsers(page, pageSize)
const updateRole = useUpdateUserRole()

await updateRole.mutateAsync({ userId, data: { role: 'admin' } })
```

**之后（Refine hooks）**:
```typescript
import { useList, useUpdate } from '@refinedev/core'

const { data, isLoading } = useList({
  resource: 'admin/users',
  pagination: { current: page, pageSize },
})

const { mutate: update } = useUpdate()
update({
  resource: 'admin/users',
  id: userId,
  values: { role: 'admin' },
  meta: { endpoint: '/role' },
})
```

---

## 测试

### 测试覆盖

| 测试文件 | 测试数 | 通过率 |
|---------|--------|--------|
| `refine-data-provider.test.ts` | 17 | 100% ✅ |
| `refine-auth-provider.test.ts` | 15 | 100% ✅ |
| `users-refine.test.tsx` | 8 | 100% ✅ |
| `comments-refine.test.tsx` | 7 | 100% ✅ |
| `dashboard-refine.test.tsx` | 5 | 100% ✅ |
| **总计** | **52** | **100%** ✅ |

### 运行测试

```bash
# 运行所有 Refine 测试
.\scripts\test-refine.ps1    # Windows
./scripts/test-refine.sh     # Linux/Mac

# 或直接运行
pnpm test refine
```

### 测试覆盖的功能

**Data Provider 测试**:
- ✅ 列表查询（用户、评论、统计）
- ✅ 单个资源查询
- ✅ 创建资源
- ✅ 更新资源（包括特殊端点）
- ✅ 删除资源
- ✅ 自定义请求
- ✅ 错误处理

**Auth Provider 测试**:
- ✅ 登录功能（成功/失败）
- ✅ 登出功能（成功/失败）
- ✅ 认证检查（有 token/无 token/刷新 token）
- ✅ Token 刷新失败场景
- ✅ 获取用户身份
- ✅ 注册功能
- ✅ 错误处理

**页面组件测试**:
- ✅ 数据加载
- ✅ 数据渲染
- ✅ 用户交互（搜索、筛选、操作）
- ✅ 错误处理

---

## 已修复的问题

### 1. Auth Provider - Refresh Token 测试 ✅

**问题**: refreshToken mock 没有被正确调用

**修复**: 使用 `mockReset()` 清理 mock 状态

```typescript
const getCurrentUserMock = vi.mocked(authService.getCurrentUser)
getCurrentUserMock.mockReset()
getCurrentUserMock.mockRejectedValue(new Error('Token expired'))

const refreshTokenMock = vi.mocked(authService.refreshToken)
refreshTokenMock.mockReset()
refreshTokenMock.mockRejectedValue(new Error('Refresh failed'))
```

### 2. Comments 页面 - 加载状态测试 ✅

**问题**: 找不到"加载中"文本

**修复**: 使用 `querySelector` 查找加载图标

```typescript
const { container } = renderWithProviders(<CommentManagementPage />)
const loaderIcon = container.querySelector('[class*="animate-spin"]')
expect(loaderIcon).toBeInTheDocument()
```

---

## 优势

使用 Refine 的优势：

1. **统一的 API**: 所有 CRUD 操作使用相同的模式
2. **自动缓存**: React Query 自动管理缓存和同步
3. **类型安全**: 完整的 TypeScript 支持
4. **开发工具**: 可以使用 Refine Devtools 和 React Query Devtools
5. **代码复用**: 减少重复的数据获取逻辑
6. **测试覆盖**: 100% 测试通过率

---

## 注意事项

1. **资源名称**: 资源名称必须与后端 API 路径匹配（如 `admin/users`）

2. **分页**: Refine 使用 `current` 和 `pageSize`，后端使用 `page` 和 `page_size`（已自动转换）

3. **响应格式**: 数据提供者会自动处理不同的响应格式

4. **批量操作**: 批量操作现在使用 `Promise.all` 并行执行

5. **统计数据**: `admin/stats` 返回单个对象，需要从数组中取出第一个元素

---

## 与现有代码的兼容性

Refine 与现有的代码完全兼容：

1. **React Query**: Refine 内部使用 React Query，与现有的 `AdminProvider` 兼容
2. **认证系统**: 使用现有的 `authService` 和 `authStore`
3. **API 客户端**: 使用现有的 `api` 客户端
4. **向后兼容**: 原有的自定义 hooks (`use-admin.ts`) 仍然可用

---

## 相关文档

- [Frontend Testing Guide](./testing.md) - 前端测试完整指南
- [Backend API Reference](../backend/api-reference.md) - 后端 API 文档
- [Admin Panel Guide](../../../guides/admin-panel.md) - 管理后台使用指南
- [Refine 官方文档](https://refine.dev/docs)

---

**最后更新**: 2025-12-27
**维护者**: Frontend Team
