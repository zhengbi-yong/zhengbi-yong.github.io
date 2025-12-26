# Refine 集成测试文档

## 测试概述

本文档说明如何运行和编写 Refine 集成功能的测试。

## 测试文件

### Provider 测试

1. **`tests/lib/providers/refine-data-provider.test.ts`**
   - 测试 Data Provider 的所有 CRUD 操作
   - 17 个测试用例
   - ✅ 全部通过

2. **`tests/lib/providers/refine-auth-provider.test.ts`**
   - 测试 Auth Provider 的认证功能
   - 15 个测试用例
   - ⚠️ 1 个测试需要调整（refresh token 失败场景）

### 页面组件测试

3. **`tests/app/admin/users-refine.test.tsx`**
   - 测试用户管理页面
   - 8 个测试用例
   - ⚠️ 部分测试需要调整选择器

4. **`tests/app/admin/comments-refine.test.tsx`**
   - 测试评论管理页面
   - 7 个测试用例
   - ⚠️ 部分测试需要调整选择器

5. **`tests/app/admin/dashboard-refine.test.tsx`**
   - 测试仪表板页面
   - 5 个测试用例
   - ✅ 全部通过

## 运行测试

### 运行所有 Refine 相关测试

```bash
pnpm test refine
```

### 运行特定测试文件

```bash
# Data Provider 测试
pnpm test refine-data-provider.test.ts

# Auth Provider 测试
pnpm test refine-auth-provider.test.ts

# 页面组件测试
pnpm test users-refine.test.tsx
pnpm test comments-refine.test.tsx
pnpm test dashboard-refine.test.tsx
```

### 运行所有测试并生成覆盖率报告

```bash
pnpm test:coverage
```

## 测试覆盖范围

### Data Provider (`refine-data-provider.test.ts`)

✅ **完全覆盖**
- `getList` - 列表查询（用户、评论、统计）
- `getOne` - 单个资源查询
- `create` - 创建资源
- `update` - 更新资源（包括特殊端点）
- `deleteOne` - 删除资源
- `custom` - 自定义请求
- `getApiUrl` - API URL 获取

### Auth Provider (`refine-auth-provider.test.ts`)

✅ **大部分覆盖**
- `login` - 登录功能
- `logout` - 登出功能
- `check` - 认证检查
- `getIdentity` - 获取用户身份
- `register` - 注册功能
- `onError` - 错误处理

⚠️ **需要调整**
- `check` - refresh token 失败场景（1 个测试）

### 页面组件测试

✅ **基本功能覆盖**
- 加载状态
- 数据渲染
- 错误处理
- 用户交互（搜索、筛选、操作）

⚠️ **需要改进**
- 更精确的元素选择器
- 更好的异步操作等待

## Mock 策略

### API Mock

```typescript
vi.mock('@/lib/api/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))
```

### Refine Hooks Mock

```typescript
vi.mock('@refinedev/core', () => ({
  useList: vi.fn(),
  useUpdate: vi.fn(),
  useDelete: vi.fn(),
}))
```

### localStorage Mock

```typescript
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
```

## 已知问题

### 1. Auth Provider - Refresh Token 失败测试

**问题**: `should logout when refresh fails` 测试失败

**原因**: Mock 设置可能不正确，导致 `refreshToken` 返回成功而不是失败

**解决方案**: 
- 检查 mock 实现
- 确保 `refreshToken` mock 正确返回 rejected Promise
- 或者调整测试以匹配实际行为

### 2. 页面组件测试 - 元素选择器

**问题**: 某些测试使用 `getByText` 找到多个元素

**解决方案**: 
- 使用 `getAllByText` 或更具体的选择器
- 使用 `getByRole` 配合更具体的查询
- 使用 `within` 限制搜索范围

## 测试最佳实践

1. **隔离测试**: 每个测试独立，不依赖其他测试
2. **Mock 清理**: 使用 `beforeEach` 和 `afterEach` 清理 mock
3. **异步处理**: 使用 `waitFor` 等待异步更新
4. **错误场景**: 测试正常流程和错误场景
5. **边界情况**: 测试空数据、边界值等情况

## 持续改进

### 短期目标

- [ ] 修复 refresh token 失败测试
- [ ] 改进页面组件测试的选择器
- [ ] 增加更多边界情况测试

### 长期目标

- [ ] 集成测试（E2E）
- [ ] 性能测试
- [ ] 可访问性测试

## 参考

- [Vitest 文档](https://vitest.dev/)
- [Testing Library 文档](https://testing-library.com/)
- [Refine 测试指南](https://refine.dev/docs/guides-concepts/testing/)

