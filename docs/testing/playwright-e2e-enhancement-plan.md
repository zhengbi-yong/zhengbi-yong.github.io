# Playwright E2E 测试强化方案

## 目标

建立以真实浏览器体验为核心的端到端测试体系，覆盖 Phase C/D 成果（编辑器、双轨存储、Shiki 语法高亮、数学公式渲染），确保每次代码变更都能通过自动化测试验证功能完整性。

## 现状分析

### 已有的测试资产

**Vitest 单元/集成测试（192 tests）**
- Auth provider: 16 + 19 stress tests
- Data provider: 17 + 19 stress tests
- MDX ContentBridge: 12 tests
- Math serialization: 9 tests
- Security sanitize: 19 tests
- Refine admin integration: 4 + 7 + 8 + 5 tests

**Playwright E2E 测试（7 个 spec）**
- `e2e/auth.spec.ts` — 登录/注册流程
- `e2e/admin.spec.ts` — 管理后台导航（401 lines，但大部分注释掉的 stub）
- `e2e/blog.spec.ts` — 博客列表/详情
- `e2e/search.spec.ts` — 搜索功能
- `e2e/codeblock-rendering.spec.ts` — 代码块渲染（已创建但 target posts 无代码 fence，测试被 skip）
- `e2e/abc-notation.spec.ts` — ABC 音乐记谱
- `e2e/api-contract.spec.ts` — API 契约测试

**Visual regression 测试**
- `tests/visual/blog-rendering.spec.ts` — 博客视觉回归（仅覆盖 blog listing）

### 关键空白（按风险排序）

| 优先级 | 空白 | 风险 |
|--------|------|------|
| P0 | **编辑器发布全流程**（登录→写文→发布→博客页渲染） | 最高：用户在 admin 编辑器无法保存 |
| P0 | **数学公式渲染**（Katex + mhchem） | 高：$ 和 $$ 在博客页无法渲染 |
| P0 | **Shiki 代码高亮**（light/dark dual-theme） | 高：代码块显示为空或未高亮 |
| P1 | **Admin 预览 API**（Phase C C2） | 中：预览功能从未被测试 |
| P1 | **双轨存储 CQRS**（content_json→content_mdx→content_html） | 中：字段派生逻辑无 API 级验证 |
| P1 | **登录会话管理**（cookie + CSRF token） | 中：认证流程断链 |
| P2 | **Zustand stores**（auth-store, post-store） | 低：单元测试未覆盖 |
| P2 | **MDX runtime**（MDXContentBridge 渲染正确性） | 低：单元测试覆盖 |

---

## 新测试规格（4 个 Playwright Spec）

### Spec T1: `e2e/editor-publish.spec.ts` ⭐ 最高优先级

**测试场景**（模拟真实用户操作顺序）：

```
TC1: 编辑器加载
  → 访问 /admin/posts/new
  → 验证工具栏可见（heading, bold, italic, code, codeBlock, math 等按钮）
  → 验证编辑器区域可聚焦

TC2: 标题和正文输入
  → 点击编辑器
  → 输入 "# Test Heading"
  → 验证 H1 渲染在编辑器内
  → 输入正文段落

TC3: 插入数学公式
  → 在编辑器中输入 "$E=mc^2$"
  → 验证公式被 KaTeX 渲染（出现 .katex 或 .katex-html 元素）
  → 插入块级公式 "$$x^2 + y^2 = z^2$$"
  → 验证块级渲染

TC4: 插入代码块
  → 点击代码块按钮或输入 ```
  → 输入语言标识 "javascript"
  → 输入代码 "console.log('hello')"
  → 验证代码块出现（<pre> 或 .shiki 元素）

TC5: 发布文章
  → 填写标题（"Playwright E2E Test Post {timestamp}"）
  → 点击发布/保存按钮
  → 验证成功提示或 URL 跳转
  → 记录生成的 slug

TC6: 博客页渲染验证（最关键）
  → 访问刚发布文章的博客页
  → 验证 H1 标题可见
  → 验证数学公式正确渲染（非原始 LaTeX 源码）
  → 验证代码块有语法高亮
  → 验证无 JS 错误（console.error）
```

**测试隔离策略**：
- 每个 TC 使用唯一 timestamp slug
- TC5 失败时，记录 slug 到测试报告，供后续调试
- 发布前清理：测试完成后通过 API 删除测试文章（或标记为 Draft）

**认证处理**：
- 使用 `test.beforeEach` + `page.request.post('/api/v1/auth/login')` 获取 session cookie
- 避免每次都走 UI 登录（加快测试速度）

**预期失败模式**（已知风险）：
- 如果编辑器 SSR 防御未正确配置，`page.goto('/admin/posts/new')` 可能触发 hydration mismatch
- 如果 Shiki 高亮未正确集成，代码块可能显示为空白

---

### Spec T2: `e2e/math-rendering.spec.ts` ⭐ 高优先级

**测试场景**：

```
TC1: 行内数学公式
  → 访问含 "$E=mc^2$" 的已知文章（hermes-roundtrip）
  → 验证 .katex 元素存在
  → 验证公式不是纯文本 "$E=mc^2$"

TC2: 块级数学公式
  → 访问含 "$$...$$" 的已知文章
  → 验证 .katex-display 元素存在
  → 验证公式渲染正确（不是 LaTeX 源码）

TC3: 化学方程式（mhchem）
  → 访问含 "H2O" 化学式的已知文章
  → 验证 mhchem 渲染（不显示原始 LaTeX 源码）

TC4: 多行对齐公式
  → 访问含复杂 LaTeX 多行公式的文章
  → 验证换行和对齐正确

TC5: 数学公式 Light/Dark 主题
  → 切换页面主题（light → dark）
  → 验证数学公式在两种主题下都正确渲染
  → 无布局破碎

TC6: 数学公式控制台错误检查
  → 访问含数学公式的文章
  → 收集 console.error 消息
  → 验证无 KaTeX 相关错误
```

**测试数据策略**：
- 使用 `hermes-roundtrip` post（已知含数学公式）作为稳定测试目标
- 如果该 post 不存在，TC1-TC3 被 skip 并标记原因

---

### Spec T3: `e2e/codeblock-shiki.spec.ts` ⭐ 高优先级

**测试场景**：

```
TC1: Shiki 代码高亮存在性
  → 访问含代码块的已知文章（pi0_5 — 12 个 <pre> 块）
  → 验证至少 1 个 <pre class="shiki ..."> 存在
  → 验证有 token-span 元素（class="color-*"）

TC2: Shiki dual-theme（light/dark）
  → 检查 Shiki 预置类：github-light, github-dark
  → 验证 data-theme 属性或 CSS 变量设置
  → 切换主题，验证高亮同步变化

TC3: 多语言高亮
  → 验证 Python、JavaScript、Bash、Rust 等语言各有不同颜色类
  → 不验证具体颜色值（防止视觉脆弱性）

TC4: 超长代码行换行
  → 验证含超长单行的代码块
  → 验证水平滚动条出现 OR 代码正常换行（不溢出容器）

TC5: 代码块无 JS 错误
  → 收集 console.error
  → 过滤 Shiki 相关错误
  → 验证零错误

TC6: Shiki 在博客详情页（非 admin）
  → 确认代码高亮不仅在 admin 编辑器预览中存在
  → 也在面向用户的博客文章页正确渲染
```

**已知问题**：
- `pi0_5` post 的代码块目前使用 `rehype-katex` 输出（不是 Shiki），`proseHtmlLen: 43394`，`shikiPre: 0`
- 需要通过前端 `highlightCodeBlocks` 或 `@shikijs/rehype` post-processing 注入 Shiki
- 如果 Shiki post-processing 未生效，TC1 应 FAIL 并报告具体数字（shikiPre: 0 vs expected: ≥1）

---

### Spec T4: `e2e/content-cqrs.spec.ts` ⭐ 中优先级

**测试场景**（直接验证 Phase C 三轨存储）：

```
TC1: create_post 三轨派生
  → 通过 API 创建文章（直接调 backend 而非 UI）
  → payload: { title, slug, content: "...", content_json: {...} }
  → 验证响应中 content_mdx 和 content_html 均非 null
  → 验证 content_mdx 是 MDX 文本（不是 JSON）
  → 验证 content_html 是 HTML 片段

TC2: update_post 三轨派生
  → PATCH 更新已有文章，提供 content_json
  → 验证 content_mdx 被更新
  → 验证 content_html 被更新
  → 验证两者长度 > 0

TC3: preview API 端到端
  → POST /api/v1/admin/posts/preview
  → payload: { content_json: {...} }
  → 验证 html 字段返回非空 HTML
  → 验证 source_type 字段正确
  → 验证 HTML 经 sanitize（不含 script 标签）

TC4: 读取侧 content_mdx 优先
  → GET /api/v1/posts/{slug}
  → 验证 content_mdx 字段存在且非 null（对于新文章）
  → 验证 content_json 字段存在

TC5: XSS 过滤验证
  → 通过 preview API 发送含 <script>alert(1)</script> 的内容
  → 验证返回的 HTML 中 script 标签被移除
  → 验证 event handler（onerror, onclick）被移除
```

**技术细节**：
- 直接使用 `page.request`（Playwright 的 API 测试客户端）调用后端 REST API
- 不依赖 UI 操作，速度快，可精确控制 payload
- 需要处理 CSRF token：从登录响应获取 XSRF-TOKEN cookie
- 使用 admin@test.com / xK9#mP2$vL8@nQ5*wR4 凭据

---

## 测试环境要求

### 前置条件
```bash
# 1. 服务运行中
cd ~/zhengbi-yong.github.io/backend && ./target/release/api &
cd ~/zhengbi-yong.github.io/frontend && pnpm dev &

# 2. Playwright 浏览器安装
cd ~/zhengbi-yong.github.io/frontend && pnpm playwright install chromium

# 3. 环境变量（可选，有默认值）
# E2E_ADMIN_EMAIL=admin@test.com
# E2E_ADMIN_PASSWORD=xK9#mP2$vL8@nQ5*wR4
```

### 运行命令
```bash
# 所有 E2E 测试
cd ~/zhengbi-yong.github.io/frontend && pnpm test:e2e

# 单个 spec
pnpm test:e2e e2e/editor-publish.spec.ts

# 带 UI 模式（可视化调试）
pnpm test:e2e --ui

# headed 模式（真实浏览器可见）
pnpm test:e2e --headed

# 只运行失败的
pnpm test:e2e --debug

# 视觉回归测试
pnpm test:e2e tests/visual/
```

---

## CI/CD 集成

### GitHub Actions Workflow
```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm playwright install chromium --with-deps
      - run: pnpm test:e2e
        env:
          BASE_URL: http://localhost:3001
          E2E_ADMIN_EMAIL: admin@test.com
          E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
```

---

## 覆盖率目标

| 测试类型 | 目标 | 当前 |
|----------|------|------|
| Vitest 单元测试 | 维持 192+ | ✅ 192 |
| Vitest 覆盖 | Statements > 70% | ❌ 40.9% |
| Playwright E2E | 4 个新 spec | ❌ 0 |
| 编辑器发布流程 | 覆盖 | ❌ 空白 |
| 数学公式渲染 | 覆盖 | ❌ 空白 |
| Shiki 代码高亮 | 覆盖 | ❌ 空白 |
| CQRS 三轨验证 | 覆盖 | ❌ 空白 |

---

## 实施顺序

**第一轮（不依赖后端重启，立即可做）**：
1. `e2e/content-cqrs.spec.ts` — 直接调 API，测试 Phase C 成果，最快验证
2. `e2e/math-rendering.spec.ts` — 使用已有 `hermes-roundtrip` post，无需创建内容

**第二轮（需要前端稳定运行）**：
3. `e2e/codeblock-shiki.spec.ts` — 验证 Shiki 集成，可能发现 post-processing 问题
4. `e2e/editor-publish.spec.ts` — 完整发布流程，覆盖 Phase A/B/C 全部环节

---

## 附录：现有 E2E 审计发现

**admin.spec.ts**（401 行）：大量 stub 测试（`test.skip`），实际可运行的只有登录和基础导航。关键功能（创建文章、编辑文章、删除文章）均未实现。

**codeblock-rendering.spec.ts**：已创建但所有测试被 skip，原因是 target posts 没有代码 fence。

**auth.spec.ts**：覆盖登录/注册流程，但未测试 CSRF token 处理和 session cookie 持久化。
