# 测试策略与质量保证

> 本文件记录项目当前的实际测试实践和目标。

## 测试金字塔

```text
        ╱  E2E  ╲              Playwright: 98 个测试用例覆盖 12 条核心路径
       ╱──────────╲
      ╱ 集成测试   ╲            前端 Vitest (188 tests), 后端 cargo test
     ╱──────────────╲
    ╱   单元测试      ╲          后端: 19 个测试文件 + 约 50 个内联测试 (含 mdx_convert 的 16 个测试)
   ╱────────────────────╲
  ╱  类型检查 (编译时)    ╲       Rust cargo check, TypeScript ESLint
 ╱──────────────────────────╲
```

## 测试覆盖矩阵

| 层级 | 工具 | 目标 | 现状 |
|------|------|------|------|
| Rust 单元测试 | `cargo test` | 核心逻辑 ≥80% | 19 个测试文件 + 约 50 个内联测试，16 个 mdx_convert 测试 |
| Rust API 测试 | `cargo test` (集成) | 端点 ≥90%（无覆盖率工具验证） | 含 advanced_security_tests |
| TypeScript 类型 | `tsc --noEmit` + ESLint | 无 any 型 | `strict: false`（已知约束，ESLint 补充检查） |
| 前端组件测试 | Vitest | 组件 ≥70% | 188 个测试用例 |
| E2E 流程 | Playwright | 12 条核心路径 | 98 个 E2E 测试用例 |

## E2E 核心路径

实际覆盖（`frontend/e2e/`）：

| 文件 | 测试内容 |
|------|---------|
| `auth.spec.ts` | 用户注册 → 登录 |
| `admin.spec.ts` | 创建文章、编辑文章、管理操作 |
| `blog.spec.ts` | 文章阅读 / SSR |
| `search.spec.ts` | 搜索功能 |
| `editor-publish.spec.ts` | 编辑器发布流程 |
| `math-rendering.spec.ts` | 数学公式 KaTeX 渲染 |
| `abc-notation.spec.ts` | ABC 乐谱渲染 |
| `codeblock-shiki.spec.ts` | 代码块 Shiki 高亮 |
| `codeblock-rendering.spec.ts` | 代码块渲染 |
| `content-cqrs.spec.ts` | 内容 CQRS 双轨 |
| `api-contract.spec.ts` | API 契约测试 |
| `article-crud.spec.ts` | 文章 CRUD |

## 回归测试流程

每次 main 合并前：

```bash
# 1. 后端
cd backend && cargo test --workspace && cargo clippy

# 2. 前端
cd frontend && pnpm test && npx eslint . --max-warnings=600

# 3. E2E（CI 环境）
pnpm test:e2e
```

## 性能基准

| 指标 | 目标 | 工具 |
|------|------|------|
| API P95 响应时间 | < 200ms | 未配置工具链 |
| 首屏加载 (FCP) | < 1.5s | 未配置工具链 |
| 交互时间 (TTI) | < 3s | 未配置工具链 |
| API 吞吐 | > 1000 req/s | 未配置工具链 |
