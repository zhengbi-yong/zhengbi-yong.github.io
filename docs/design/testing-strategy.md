# 测试策略与质量保证

> 本文件记录项目当前的实际测试实践和目标。

## 测试金字塔

```text
        ╱  E2E  ╲              Playwright: 97 个测试用例覆盖 12 条核心路径
       ╱──────────╲
      ╱ 集成测试   ╲            前端 Vitest (188 tests), 后端 cargo test
     ╱──────────────╲
    ╱   单元测试      ╲          后端: 25 个位置 (11 个独立测试文件 + 14 个内联测试模块)
   ╱────────────────────╲
  ╱  类型检查 (编译时)    ╲       Rust cargo check, TypeScript ESLint
 ╱──────────────────────────╲
```

## 测试覆盖矩阵

| 层级 | 工具 | 目标 | 现状 |
|------|------|------|------|
| Rust 单元测试 | `cargo test` | 核心逻辑 ≥80% | 25 个位置；mdx_convert 的 16 个测试位于 `crates/core/src/`（非 `api/src/routes/`） |
| Rust API 测试 | `cargo test` (集成) | 端点 ≥90% | 含 advanced_security_tests |
| TypeScript 类型 | `tsc --noEmit` + ESLint | 无 any 型 | `strict: false`（已知约束，ESLint 补充检查） |
| 前端组件测试 | Vitest | 组件 ≥70% | 146 个测试用例 |
| E2E 流程 | Playwright | 12 条核心路径 | 97 个 E2E 测试用例 |

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

## 回归测试流程

每次 main 合并前：

```bash
# 1. 后端（独立 workflow: backend-test.yml）
cd backend && cargo test --workspace

# 2. 前端
cd frontend && pnpm test && npx eslint . --max-warnings=600

# 3. E2E（CI 环境中只运行 2/11 个 spec: abc-notation.spec.ts 和 search.spec.ts，仅 chromium）
cd frontend && pnpm exec playwright test e2e/abc-notation.spec.ts e2e/search.spec.ts --project=chromium --reporter=list
```

> **注意**：`cargo clippy` 在独立的 `backend-test.yml` workflow 中运行，不与测试合并。前端 Vitest 覆盖率阈值：statements: 70, branches: 65, functions: 70, lines: 70（branches 阈值较低为 65%）。后端覆盖率通过 Codecov 跟踪但不作为 CI 门禁。

## 性能基准

| 指标 | 目标 | 工具 |
|------|------|------|
| API P95 响应时间 | < 200ms | k6 / autocannon |
| 首屏加载 (FCP) | < 1.5s | Lighthouse CI |
| 交互时间 (TTI) | < 3s | Lighthouse CI |
| API 吞吐 | > 1000 req/s | k6 |
