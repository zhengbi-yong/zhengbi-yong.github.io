# 个人博客 → 学术知识分享平台 转型计划

## 目标

将 `zhengbi-yong.github.io` 从**单人技术博客**改造为**多作者学术知识分享与交友平台**。

---

## 一、架构变更总览

### 身份转变：博客 → 平台

```
               现在 (Blog)                        目标 (Platform)
┌──────────────────────────┐          ┌──────────────────────────────┐
│  1 个作者 → 144 篇文章    │          │  N 个学者 → 各自发表          │
│  读者 = 匿名访客          │   ──→    │  用户 = 有学术身份的注册用户   │
│  评论 = 唯一互动          │          │  关注/私信/协作/同行评议       │
│  标签 = 唯一发现机制      │          │  推荐算法 + 学术关系图         │
│  单人数据模型             │          │  多租户全局用户/内容模型       │
└──────────────────────────┘          └──────────────────────────────┘
```

### 核心数据库 Schema 变更

```sql
-- 当前: posts 表无 author_id 约束(单人)
-- 目标: 多作者 + 学术身份 + 社交关系 + 内容多样化

-- 新增表:
users_extended        -- 学术Profile(ORCID, 机构, 研究领域, 学术履历)
follows               -- 关注关系(user_id → target_id, target_type)
notifications         -- 统一通知系统
reviews               -- 同行评议
citations             -- 引用关系
qa_questions          -- 问答
qa_answers            -- 问答
research_projects     -- 研究项目
discussion_groups     -- 讨论组
group_members         -- 组成员
posts_collaborators   -- 文章合作者

-- 改造表:
posts                 -- + author_id FK, + content_type(article/paper/project)
comments              -- + @mentions, + rich_content
users                 -- + institution, + research_fields, + orcid_id
```

---

## 二、三阶段路线图

### Phase 1: 多作者内容社区 (核心基础) — 预计 20-30 天

| # | 任务 | 文件/模块 | 优先级 |
|---|------|----------|--------|
| 1.1 | 数据库 Migration: users 表扩展(学术字段) | `backend/migrations/` | P0 |
| 1.2 | 数据库 Migration: follows 表 | `backend/migrations/` | P0 |
| 1.3 | 数据库 Migration: notifications 表 | `backend/migrations/` | P0 |
| 1.4 | 数据库 Migration: posts 表加 author_id | `backend/migrations/` | P0 |
| 1.5 | Rust models 更新: User, Post, Follow, Notification | `backend/crates/db/src/models/` | P0 |
| 1.6 | API: 用户注册登录增强(学术信息收集) | `backend/crates/api/src/routes/auth.rs` | P0 |
| 1.7 | API: 学者 Profile CRUD | `backend/crates/api/src/routes/users.rs` (新) | P0 |
| 1.8 | API: 关注/取关 | `backend/crates/api/src/routes/follows.rs` (新) | P0 |
| 1.9 | API: 通知列表/已读 | `backend/crates/api/src/routes/notifications.rs` (新) | P0 |
| 1.10 | API: 多作者文章(owner + collaborators) | `backend/crates/api/src/routes/posts.rs` | P0 |
| 1.11 | 前端: 注册页增加学术信息表单 | `frontend/src/app/register/` | P0 |
| 1.12 | 前端: 学者 Profile 页重设计 | `frontend/src/app/users/[username]/` | P0 |
| 1.13 | 前端: 个人设置-学术信息编辑 | `frontend/src/app/settings/` | P0 |
| 1.14 | 前端: 关注按钮组件 | `frontend/src/components/FollowButton.tsx` (新) | P1 |
| 1.15 | 前端: 通知中心 | `frontend/src/app/notifications/` | P1 |
| 1.16 | 前端: 文章作者显示+作者页链接 | `frontend/src/components/blog/` | P0 |
| 1.17 | 后端: 内容推荐引擎(标签Jaccard+时间衰减) | `backend/crates/core/src/recommendation.rs` (新) | P1 |
| 1.18 | 前端: 首页推荐流 | `frontend/src/app/page.tsx` | P1 |

### Phase 2: 学术平台核心能力 — 预计 40-60 天

| # | 任务 | 说明 |
|---|------|------|
| 2.1 | 论文/预印本托管 | PDF上传、解析、DOI集成 |
| 2.2 | 引用管理系统 | BibTeX导入导出、引用关系图 |
| 2.3 | 同行评议系统 | 公开评审、修改版本追踪、评分 |
| 2.4 | 学术问答(Q&A) | 问题/回答/采纳/投票 |
| 2.5 | 讨论组/学科社区 | 按领域组织，成员管理 |
| 2.6 | 研究项目展示 | 项目页(目标/方法/结果/代码/数据) |
| 2.7 | 学术关系图谱 | 作者合作图、引用网络可视化 |

### Phase 3: 顶级平台差异化 — 预计 60-90 天

| # | 任务 | 说明 |
|---|------|------|
| 3.1 | 学术知识图谱 | 论文/作者/机构/概念 语义关系网络 |
| 3.2 | AI辅助工具 | 论文摘要生成、翻译、代码复现助手 |
| 3.3 | 合作匹配引擎 | 基于研究方向+技能互补的学者推荐 |
| 3.4 | 开放API平台 | REST + GraphQL, 第三方集成 |
| 3.5 | 学术活动平台 | 会议/研讨会/征稿信息聚合 |
| 3.6 | 国际化 | 中英双语，i18n 完善 |
| 3.7 | 移动端 | PWA 增强或 React Native App |

---

## 三、Phase 1 详细执行清单

### Step 1: 数据库 Migration (后端)

- [ ] 1.1 创建 `2026050501_extend_users_academic.sql`
  - `users` 表新增: `display_name TEXT`, `institution TEXT`, `research_fields TEXT[]`, `orcid_id TEXT UNIQUE`, `google_scholar TEXT`, `academic_bio TEXT`, `avatar_url TEXT`, `website TEXT`
- [ ] 1.2 创建 `2026050502_create_follows.sql`
  - `follows` 表: `id UUID PK`, `follower_id UUID FK(users)`, `followed_id UUID FK(users)`, `created_at TIMESTAMPTZ`
  - UNIQUE(follower_id, followed_id)
  - 索引: follower_id, followed_id
- [ ] 1.3 创建 `2026050503_create_notifications.sql`
  - `notifications` 表: `id UUID PK`, `user_id UUID FK(users)`, `type TEXT`(follow/comment/like/review/etc), `title TEXT`, `body TEXT`, `link TEXT`, `is_read BOOL DEFAULT false`, `created_at TIMESTAMPTZ`
  - 索引: user_id+is_read+created_at
- [ ] 1.4 创建 `2026050504_add_post_author.sql`
  - `posts` 表新增: `author_id UUID FK(users)`, `content_type TEXT DEFAULT 'article'`(article/paper/project)
  - blog-models 已有 `post_stats` 表，需确认 posts 表名
  - **迁移策略**: 将现有 144 篇文章归属到当前管理员用户
- [ ] 1.5 运行 `cargo sqlx prepare` 更新编译时检查缓存

### Step 2: Rust 后端 Models & API

- [ ] 2.1 更新 `backend/crates/db/src/models/` 
  - 新增 `user.rs`: UserExtended, UserPublicProfile, UpdateAcademicProfile
  - 新增 `follow.rs`: Follow, FollowList
  - 新增 `notification.rs`: Notification, NotificationList
  - 更新 `post.rs`: +author_id, +content_type
- [ ] 2.2 创建 `backend/crates/api/src/routes/users.rs`
  - `GET /users/:username` — 公开 Profile
  - `GET /users/:username/posts` — 该作者文章列表(已部分存在)
  - `PATCH /users/me/academic` — 更新学术信息(需认证)
- [ ] 2.3 创建 `backend/crates/api/src/routes/follows.rs`
  - `POST /users/:username/follow` — 关注
  - `DELETE /users/:username/follow` — 取关
  - `GET /users/:username/followers` — 粉丝列表
  - `GET /users/:username/following` — 关注列表
  - `GET /me/following/posts` — 关注者动态(时间线)
- [ ] 2.4 创建 `backend/crates/api/src/routes/notifications.rs`
  - `GET /notifications` — 通知列表(分页)
  - `GET /notifications/unread-count` — 未读数
  - `POST /notifications/:id/read` — 标记已读
  - `POST /notifications/read-all` — 全部已读
- [ ] 2.5 更新 `backend/crates/api/src/routes/posts.rs`
  - `POST /posts` — 创建时自动设 author_id = 当前用户
  - `PATCH /posts/:slug` — 仅作者可编辑
  - `GET /posts/:slug` — 返回完整作者信息
- [ ] 2.6 在 `backend/crates/api/src/main.rs` 注册新路由
- [ ] 2.7 通知生成逻辑: 关注时/评论时/点赞时写入 notifications 表

### Step 3: 前端页面

- [ ] 3.1 注册页改造 `frontend/src/app/register/` (如需新建)
  - 表单字段: username, email, password, display_name, institution, research_fields(多选/标签), orcid_id(可选)
- [ ] 3.2 学者 Profile 页重设计 `frontend/src/app/users/[username]/page.tsx`
  - 顶部: 头像+姓名+机构+ORCID badge
  - 统计栏: 文章数/粉丝数/关注数
  - 研究领域标签
  - 学术履历
  - 文章列表
  - 关注/私信按钮
- [ ] 3.3 个人设置新增学术信息 Tab `frontend/src/app/settings/`
  - 编辑 institution, research_fields, orcid_id, academic_bio, website 等
- [ ] 3.4 关注按钮组件 `frontend/src/components/FollowButton.tsx`
  - 状态: 未关注/已关注/互相关注
  - 操作: 关注/取关(需登录)
- [ ] 3.5 通知中心 `frontend/src/app/notifications/` (已有基础)
  - 改造: 统一展示 follow/comment/like/review 通知
  - 未读标记
  - 点击跳转到目标页
- [ ] 3.6 文章列表/详情页更新
  - `frontend/src/components/blog/`: 显示作者头像+姓名, 可点击进入Profile
- [ ] 3.7 导航栏更新
  - 通知 bell icon + 未读数字
  - 用户头像→下拉菜单(Profile/Settings/Notifications/Logout)

### Step 4: 推荐系统

- [ ] 4.1 后端推荐引擎 `backend/crates/core/src/recommendation.rs`
  - 基于阅读历史的标签相似度
  - 结合时间衰减和热度
- [ ] 4.2 API: `GET /recommendations` — 个性化推荐
- [ ] 4.3 API: `GET /trending` — 热门内容
- [ ] 4.4 前端首页推荐模块 `frontend/src/app/page.tsx`

### Step 5: 数据迁移与部署

- [ ] 5.1 将现有 144 篇文章归属到 admin 用户 (migration SQL)
- [ ] 5.2 `cargo sqlx prepare` 重新生成缓存
- [ ] 5.3 更新 OpenAPI 文档
- [ ] 5.4 更新前端 API client types
- [ ] 5.5 Docker 构建测试
- [ ] 5.6 端到端功能测试

---

## 四、关键设计决策

1. **文章归属**: 现有文章自动归属到原管理员，新文章绑定作者
2. **关注模型**: 单向关注(类似 Twitter)，互相关注时自动标记 mutual
3. **通知策略**: Postgres 持久化 + 前端轮询(初期)，后续可接 WebSocket
4. **搜索**: 扩展 Meilisearch index 包含作者信息
5. **权限**: 仅作者+admin 可编辑/删除文章

---

## 五、风险与缓解

| 风险 | 缓解 |
|------|------|
| 数据库 migration 锁表 | 在低峰期执行，使用 `CONCURRENTLY` |
| 现有 API 兼容性 | 所有新增字段带 DEFAULT，旧 API 不传则忽略 |
| 前端加载性能 | 延迟加载 Profile 数据，SSR 首屏 |
| 内容质量下降(开放注册) | 内容审核机制 + 举报系统 |

---

## 六、分支与工作区

- **分支**: `platform-transformation` (基于 `main`)
- **工作区**: `/data1/zhengbi/zhengbi-yong.github.io-platform`
- **原则**: 每个 Phase 完成后合并回 main，保持特性隔离
