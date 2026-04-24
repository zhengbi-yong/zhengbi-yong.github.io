# 开发流程规范

## 三线质量门禁（每次提交前必须通过）

```bash
cd frontend
pnpm vitest run          # 14 test files, 171 tests — ALL MUST PASS
pnpm eslint . --max-warnings=0   # 0 errors, 0 warnings — ZERO TOLERANCE
pnpm tsc --noEmit       # 0 errors — ZERO TOLERANCE
```

**顺序**：Vitest → ESLint → tsc。任何一步失败都停止，修复后再继续。

---

## 新增功能的标准流程

### 1. 创建分支

```bash
git checkout -b feat/your-feature-name
# 或
git checkout -b fix/bug-description
```

### 2. 编写代码 + 测试

**原则**：
- 测试必须验证**实际行为**，不是验证 mock 的存在
- 如果测试中 mock 了某个方法，该方法必须在真实源码中存在
- 不要创建"示例文件"（如 `Examples/` 目录下的假数据文件）
- 不用虚假数据填充代码库

**禁止事项**：
- ❌ `localStorage.setItem('access_token', ...)` — Token 存储在 HttpOnly Cookie 中
- ❌ 手动拼接 `Cookie: ...` header
- ❌ 创建但从不使用的工具函数或组件
- ❌ 在源码目录放置示例/演示代码

### 3. 质量门禁

```bash
pnpm vitest run
pnpm eslint . --max-warnings=0
pnpm tsc --noEmit
```

全部通过后，提交代码。

### 4. 提交信息格式

```
<type>: <简短描述>

<可选的详细说明>

Quality gates:
- vitest: N test files, M tests PASS
- eslint: 0 errors, 0 warnings
- tsc: 0 errors
```

**type 规范**：
- `feat:` 新功能
- `fix:` 错误修复
- `refactor:` 重构（无行为变化）
- `test:` 测试相关
- `docs:` 文档
- `chore:` 构建/工具

### 5. 推送

```bash
git push -u origin HEAD
```

---

## GOLDEN_RULES 关键规范（日常遵循）

### 认证
- **1.1** Token 存储在 HttpOnly Cookie，**禁止** localStorage 存储 Token
- **1.2** 写操作（POST/PUT/PATCH/DELETE）必须带 `X-CSRF-Token`

### API
- **2.1** 所有后端通信必须通过 `apiClient`（`src/lib/api/apiClient.ts`），禁止裸 `fetch`
- **2.2** 前端不处理 token 刷新，401 错误直接抛出

### 测试
- 不使用虚假 mock（mock 的每个属性必须在源码中真实存在）
- 时间相关测试用 `vi.useFakeTimers()`，不用真实时钟

### 文档
- 删除文件 → 同步删除文档中所有对该文件的引用
- 技术栈变更 → 清理所有残留引用（如 Contentlayer → Velite）

---

## 常见问题处理

### ESLint 报 "vi/describe/it is not defined"
→ 检查 `vitest.config.ts` 是否包含 `global: true` 类型注入

### TypeScript 报 "Cannot find module" 或类型错误
→ `pnpm tsc --noEmit` 会显示具体位置，优先处理 TypeScript 错误

### Vitest 测试 flaky（偶尔失败）
→ 检查是否依赖真实时间（`Date.now()`），改用 `vi.useFakeTimers()`

### 文档与代码不一致
→ 删除文件后立刻搜索并删除文档引用，不要留到提交时处理

---

## 目录结构参考

```
frontend/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React 组件
│   │   └── hooks/        # 自定义 Hooks
│   ├── lib/
│   │   ├── api/          # API 客户端（apiClient.ts 是唯一入口）
│   │   ├── store/        # Zustand stores
│   │   └── utils/        # 工具函数
│   └── types/            # TypeScript 类型定义
├── tests/
│   ├── app/              # 页面集成测试
│   ├── lib/              # 单元测试
│   │   ├── factories/    # Test data factories（严格按需创建）
│   │   ├── helpers/      # 测试辅助函数
│   │   ├── providers/   # Provider 测试
│   │   └── utils/        # 工具函数测试
│   └── setup.ts          # 测试环境配置
├── docs/
│   └── development/
│       └── GOLDEN_RULES.md   # 必须阅读
└── vitest.config.ts
```

---

## 设计收敛（Design Convergence）

如需进行架构层面的清理（如 Phase 1-10），参考 `docs/design-convergence-plan.md`。
