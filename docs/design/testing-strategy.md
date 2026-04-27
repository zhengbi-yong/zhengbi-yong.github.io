# 测试策略与质量保证

> 来源：EDITOR_SYSTEM_DESIGN.md P6

## 测试金字塔

```
        ╱  E2E  ╲              ← Playwright: 关键用户流程
       ╱──────────╲
      ╱ 集成测试   ╲            ← 前后端联调、API 测试
     ╱──────────────╲
    ╱   单元测试      ╲          ← 函数级、组件级
   ╱────────────────────╲
  ╱  类型检查 (编译时)    ╲       ← TypeScript strict, Rust cargo check
 ╱──────────────────────────╲
```

## 测试覆盖矩阵

| 层级 | 工具 | 目标覆盖率 | 关键测试点 |
|------|------|-----------|----------|
| Rust 单元测试 | `cargo test` | 后端核心逻辑 ≥80% | 业务逻辑、数据模型、序列化 |
| Rust API 测试 | `cargo test` (集成模式) | 端点 ≥90% | 认证、CRUD、校验、错误码 |
| TypeScript 类型 | `tsc --noEmit` | 100% | 无 any 型、无隐式 any |
| 前端组件测试 | Vitest + Testing Library | 组件 ≥70% | 渲染、交互、状态变化 |
| E2E 流程 | Playwright | 10 条核心路径 | 登录→写文章→发布→阅读→评论 |

## E2E 核心路径

| 编号 | 路径 | 步骤 |
|------|------|------|
| E2E-01 | 用户注册 | 填写表单 → 提交 → 验证邮箱(如需要) → 登录 |
| E2E-02 | 创建文章 | 打开编辑器 → 输入 Markdown → 插入图片 → 保存 → 验证数据库 |
| E2E-03 | 编辑文章 | 打开已有文章 → 修改内容 → 保存 → 验证版本历史 |
| E2E-04 | 文章阅读 | 访问公开 URL → 验证 SSR 内容渲染 → 验证 MDX 组件加载 |
| E2E-05 | 搜索 | 输入关键词 → 验证结果包含目标文章 → 验证高亮 |
| E2E-06 | 响应式 | 桌面/平板/手机三端验证布局和功能 |
| E2E-07 | 暗色模式 | 切换主题 → 验证所有页面渲染正常 |
| E2E-08 | 数学公式 | 在编辑器中插入公式 → 保存 → 阅读页验证 KaTeX 渲染 |

## 回归测试流程

每次 master 合并前：

```bash
# 1. 后端
cd backend && cargo test --workspace && cargo clippy

# 2. 前端
cd frontend && pnpm typecheck && pnpm test

# 3. E2E（CI 环境）
pnpm test:e2e
```

## 性能基准

| 指标 | 目标 | 工具 |
|------|------|------|
| API P95 响应时间 | < 200ms | k6 / autocannon |
| 首屏加载 (FCP) | < 1.5s | Lighthouse CI |
| 交互时间 (TTI) | < 3s | Lighthouse CI |
| API 吞吐 | > 1000 req/s | k6 |
