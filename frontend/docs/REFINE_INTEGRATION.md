# Refine 集成指南

本文档说明如何在项目中使用 Refine 框架。

## 概述

Refine 已经集成到项目的管理后台中。它提供了强大的 CRUD 功能、数据管理和状态管理能力。

## 已安装的包

- `@refinedev/core`: Refine 核心包
- `@refinedev/nextjs-router`: Next.js App Router 集成
- `@refinedev/react-hook-form`: React Hook Form 集成
- `@refinedev/simple-rest`: REST API 数据提供者
- `@refinedev/kbar`: 命令面板功能

## 项目结构

```
frontend/
├── lib/
│   └── providers/
│       ├── refine-provider.tsx      # Refine 主提供者
│       ├── refine-data-provider.ts   # 数据提供者（适配后端 API）
│       └── refine-auth-provider.ts   # 认证提供者（适配现有认证系统）
└── app/
    └── admin/
        ├── layout.tsx                # Admin 布局（已集成 Refine）
        ├── users-refine/             # 使用 Refine hooks 的示例页面
        └── ...
```

## 基本使用

### 1. 使用 Refine Hooks

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

### 2. 资源定义

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

### 3. 数据提供者

数据提供者 (`refine-data-provider.ts`) 负责与后端 API 通信。它自动处理：

- 分页参数转换（`current` -> `page`, `pageSize` -> `page_size`）
- 筛选条件构建
- 排序参数处理
- 错误处理

### 4. 认证提供者

认证提供者 (`refine-auth-provider.ts`) 与现有的认证系统集成：

- 使用现有的 `authService`
- 从 localStorage 读取 token
- 自动刷新 token
- 处理认证错误

## 示例页面

查看 `app/admin/users-refine/page.tsx` 了解完整的使用示例。

## 与现有代码的兼容性

Refine 与现有的代码完全兼容：

1. **React Query**: Refine 内部使用 React Query，与现有的 `AdminProvider` 兼容
2. **认证系统**: 使用现有的 `authService` 和 `authStore`
3. **API 客户端**: 使用现有的 `api` 客户端

## 迁移指南

### 从自定义 Hooks 迁移到 Refine Hooks

**之前（自定义 hooks）:**

```typescript
import { useUsers, useUpdateUserRole } from '@/lib/hooks/use-admin'

const { data, isLoading } = useUsers(page, pageSize)
const updateRole = useUpdateUserRole()

await updateRole.mutateAsync({ userId, data: { role: 'admin' } })
```

**之后（Refine hooks）:**

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
})
```

## 优势

使用 Refine 的优势：

1. **统一的 API**: 所有 CRUD 操作使用相同的模式
2. **自动缓存**: React Query 自动管理缓存和同步
3. **类型安全**: TypeScript 支持完善
4. **开发工具**: 内置 Devtools 用于调试
5. **代码复用**: 减少重复的数据获取逻辑

## 注意事项

1. **资源名称**: 资源名称必须与后端 API 路径匹配（如 `admin/users`）
2. **分页**: Refine 使用 `current` 和 `pageSize`，后端使用 `page` 和 `page_size`（已自动转换）
3. **响应格式**: 数据提供者会自动处理不同的响应格式

## 更多资源

- [Refine 官方文档](https://refine.dev/docs)
- [Refine 示例](https://refine.dev/examples)
- [Refine GitHub](https://github.com/refinedev/refine)

