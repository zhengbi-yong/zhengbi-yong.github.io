# 测试策略与质量保证

> 本文件记录项目当前的实际测试实践和目标。

## 测试金字塔

```text
        ╱  E2E  ╲              Playwright: 97 个测试用例覆盖 12 条核心路径
       ╱──────────╲
      ╱ 集成测试   ╲            前端 Vitest (188 tests), 后端 cargo test
     ╱──────────────╲
    ╱   单元测试      ╲          后端: 28 个测试文件 (含 mdx_convert 的 16 个测试)
   ╱────────────────────╲
  ╱  类型检查 (编译时)    ╲       Rust cargo check, TypeScript ESLint
 ╱──────────────────────────╲
```

## 测试覆盖矩阵

| 层级 | 工具 | 目标 | 现状 |
|------|------|------|------|
| Rust 单元测试 | `cargo test` | 核心逻辑 ≥70% | 28 个测试文件，16 个 mdx_convert 测试（tarpaulin fail-under=70） |
| Rust API 测试 | `cargo test` (集成) | 端点 ≥70% | 含 advanced_security_tests |
| TypeScript 类型 | `tsc --noEmit` + ESLint | 无 any 型 | `strict: false`（已知约束，ESLint 补充检查） |
| 前端组件测试 | Vitest | 组件 ≥70% | 146 个测试用例 |
| E2E 流程 | Playwright | 12 条核心路径 | 97 个 E2E 测试用例 |
| 模糊测试 | `cargo fuzz` | 关键输入边界 | 部分已实现 |
| 压力/混沌测试 | 自定义脚本 | 系统韧性 | 部分已实现 |
| 数据一致性测试 | 自定义脚本 | 读写一致性 | 已有 CQRS 验证测试 |

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
# 1. 后端
cd backend && cargo test --workspace

# 2. 后端 lint（独立 backend-test.yml 工作流中运行，非主要 pre-merge CI）
#    cd backend && cargo clippy

# 3. 前端
cd frontend && pnpm test && npx eslint . --max-warnings=600

# 4. E2E（CI 环境）
#    CI 仅运行 2 个特定 E2E 测试：abc-notation.spec.ts 和 search.spec.ts
#    完整 E2E 套件需在本地全量运行
```

## 性能基准

| 指标 | 目标 | 工具 |
|------|------|------|
| API P95 响应时间 | < 200ms | k6 / autocannon（⚠️ 尚未实现，属目标规划） |
| 首屏加载 (FCP) | < 1.5s | Lighthouse CI |
| 交互时间 (TTI) | < 3s | Lighthouse CI |
| API 吞吐 | > 1000 req/s | k6（⚠️ 尚未实现，属目标规划） |
