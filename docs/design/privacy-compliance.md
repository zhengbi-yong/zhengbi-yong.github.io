# 数据隐私与合规（规划）

> ⚠️ **本文件为规划/前瞻文档，不代表当前状态。** 所列功能（数据导出/删除 API、自动清除策略等）均尚未实施。

> 来源：EDITOR_SYSTEM_DESIGN.md P8 — 扩展阶段，尚未实施

## ⚡ 已知隐私问题（已存在，需处理）

以下问题存在于当前代码中，但尚未纳入合规框架：

| 问题 | 位置 | 说明 |
|------|------|------|
| 访客 IP + 地理定位追踪 | `frontend/src/app/api/visitor/route.ts` | 生产环境中自动记录访客 IP、地理位置、访问时间。无用户同意提示，无数据删除/导出接口。存储在 `.data/visitors.json` 文件中。 |
| Umami 分析 | `frontend/src/lib/security.ts` CSP 配置、`next.config.js`、`siteMetadata.data.mjs` | 引用了 `analytics.umami.is` 和 `cloud.umami.is`，但实际集成状态需确认。需确保遵守 GDPR 同意要求。 |

## 合规要求

| 法规 | 适用范围 | 核心要求 |
|------|---------|----------|
| GDPR | EU 用户 | 数据可删除、可导出、明确同意 |
| 个人信息保护法 | 中国用户 | 最小必要、告知同意、跨境传输 |
| CCPA | 加州用户 | 知情权、删除权、不出售权 |

## 数据分类

| 类别 | 示例 | 处理方式 |
|------|------|---------|
| 个人身份信息 | 邮箱、IP 地址 | 加密存储、可清除 |
| 认证数据 | 密码哈希、Token | Argon2id 哈希、不可逆 |
| 内容数据 | 文章、评论 | 保留直到用户删除 |
| 行为数据 | 浏览历史、搜索记录 | 匿名化、保留有限期 |

## 自动清除策略 (DROP)

```
数据保留周期: 45 天
    │
    ├── 日志: 45天后自动轮转
    ├── 搜索历史: 45天后清除
    ├── 未验证用户: 45天后软删除
    └── 已删除文章: 45天后物理删除
```

## 用户数据导出 API

```
GET /api/v1/user/data-export
Authorization: Bearer <token>

→ 返回 ZIP，包含:
  ├── profile.json     (用户资料)
  ├── articles.json    (所有文章)
  ├── comments.json    (所有评论)
  └── activity.json    (搜索/浏览历史)
```

## 用户数据删除 API

```
DELETE /api/v1/user/data
Authorization: Bearer <token>
X-XSRF-TOKEN: <csrf_token>

→ 触发异步删除任务
→ 返回 task_id
→ 45天内完成所有数据清除
```
