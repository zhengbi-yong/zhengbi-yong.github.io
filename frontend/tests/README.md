# Refine 集成测试文档

## 测试概述

本目录包含 Refine 集成功能的完整测试套件，覆盖了数据提供者、认证提供者和主要页面组件。

## 测试文件结构

```
tests/
├── lib/
│   └── providers/
│       ├── refine-data-provider.test.ts    # Data Provider 测试
│       └── refine-auth-provider.test.ts     # Auth Provider 测试
└── app/
    └── admin/
        ├── users-refine.test.tsx            # Users 页面测试
        ├── comments-refine.test.tsx         # Comments 页面测试
        └── dashboard-refine.test.tsx        # Dashboard 页面测试
```

## 运行测试

### 运行所有测试

```bash
pnpm test
```

### 运行特定测试文件

```bash
pnpm test refine-data-provider.test.ts
pnpm test refine-auth-provider.test.ts
pnpm test users-refine.test.tsx
```

### 监视模式（开发时使用）

```bash
pnpm test:watch
```

### 生成覆盖率报告

```bash
pnpm test:coverage
```

### 使用 UI 界面

```bash
pnpm test:ui
```

## 测试覆盖范围

### Data Provider 测试 (`refine-data-provider.test.ts`)

- ✅ `getList` - 获取列表数据
  - 用户列表（带分页）
  - 评论列表（带状态筛选）
  - 统计数据
  - 空列表处理
  - 错误处理
  - 排序功能
- ✅ `getOne` - 获取单个资源
- ✅ `create` - 创建资源
- ✅ `update` - 更新资源
  - 用户角色更新
  - 评论状态更新
  - 标准更新
- ✅ `deleteOne` - 删除资源
- ✅ `custom` - 自定义请求
- ✅ `getApiUrl` - 获取 API URL

### Auth Provider 测试 (`refine-auth-provider.test.ts`)

- ✅ `login` - 登录功能
  - 成功登录
  - 登录失败处理
- ✅ `logout` - 登出功能
  - 成功登出
  - API 失败时的处理
- ✅ `check` - 认证检查
  - 有 token 时的认证
  - 无 token 时的处理
  - Token 刷新
  - 刷新失败时的处理
- ✅ `getIdentity` - 获取用户身份
  - 从 localStorage 获取
  - 从 API 获取
  - 错误处理
- ✅ `register` - 注册功能
- ✅ `onError` - 错误处理
  - 401 错误处理
  - 其他错误处理

### Users 页面测试 (`users-refine.test.tsx`)

- ✅ 加载状态渲染
- ✅ 用户列表渲染
- ✅ 错误状态渲染
- ✅ 搜索功能
- ✅ 角色更改
- ✅ 删除用户
- ✅ 分页功能
- ✅ 统计卡片显示

### Comments 页面测试 (`comments-refine.test.tsx`)

- ✅ 加载状态渲染
- ✅ 评论列表渲染
- ✅ 错误状态渲染
- ✅ 状态筛选
- ✅ 状态更改
- ✅ 删除评论
- ✅ 状态徽章显示

### Dashboard 页面测试 (`dashboard-refine.test.tsx`)

- ✅ 加载状态渲染
- ✅ 统计数据渲染
- ✅ 错误状态渲染
- ✅ 所有统计卡片显示
- ✅ 快速操作链接显示

## Mock 策略

### API Mock

所有 API 调用都通过 `vi.mock` 进行模拟：

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

Refine hooks 通过模块 mock 进行模拟：

```typescript
vi.mock('@refinedev/core', () => ({
  useList: vi.fn(),
  useUpdate: vi.fn(),
  useDelete: vi.fn(),
}))
```

### localStorage Mock

localStorage 通过全局对象 mock：

```typescript
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
```

## 测试最佳实践

1. **隔离测试**：每个测试都是独立的，不依赖其他测试的状态
2. **Mock 清理**：每个测试前后都会清理所有 mock
3. **异步处理**：使用 `waitFor` 处理异步更新
4. **错误场景**：测试正常流程和错误场景
5. **边界情况**：测试空数据、边界值等情况

## 持续集成

这些测试可以在 CI/CD 流程中运行：

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: pnpm test:coverage
```

## 故障排除

### 测试失败常见原因

1. **Mock 未正确设置**：检查 mock 函数是否被正确调用
2. **异步操作未等待**：使用 `waitFor` 等待异步更新
3. **环境变量未设置**：确保测试环境变量正确配置
4. **依赖未安装**：运行 `pnpm install` 安装所有依赖

### 调试技巧

1. 使用 `console.log` 查看 mock 调用
2. 使用 `screen.debug()` 查看渲染的 DOM
3. 使用 `--reporter=verbose` 获取详细输出
4. 使用 `test:ui` 在浏览器中调试

## 贡献指南

添加新测试时，请遵循以下规范：

1. 使用描述性的测试名称
2. 每个测试只测试一个功能点
3. 使用 `describe` 和 `it` 组织测试
4. 添加必要的注释说明复杂逻辑
5. 确保测试可以通过 `pnpm test` 运行

