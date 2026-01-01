# 管理员功能完整文档

本文档提供博客系统管理后台的完整说明，包括快速开始、功能使用、技术实现和故障排查等内容。

## 目录

- [快速开始](#快速开始)
- [环境配置](#环境配置)
- [功能说明](#功能说明)
  - [访问管理后台](#访问管理后台)
  - [管理仪表板](#管理仪表板)
  - [用户管理](#用户管理)
  - [评论审核](#评论审核)
- [技术实现](#技术实现)
- [测试指南](#测试指南)
- [故障排查](#故障排查)
- [设计参考](#设计参考)

---

## 快速开始

### 一键启动（推荐）

#### Windows 用户

```powershell
# 启动所有服务（数据库、后端、前端）
.\scripts\start-admin.ps1

# 测试服务状态
.\scripts\test-admin.ps1
```

#### Linux/Mac 用户

```bash
# 启动所有服务
chmod +x scripts/start-admin.sh
./scripts/start-admin.sh

# 测试服务状态
chmod +x scripts/test-admin.sh
./scripts/test-admin.sh
```

### 手动启动

打开三个终端窗口：

**终端 1 - 启动数据库**：
```bash
cd backend
./scripts/deployment/deploy.sh dev
```

**终端 2 - 启动后端 API**：
```bash
cd backend
export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
export REDIS_URL=redis://localhost:6379
cargo run --bin api
```

**终端 3 - 启动前端**：
```bash
cd frontend
pnpm dev
```

### 访问管理后台

1. 打开浏览器访问：`http://localhost:3003/admin`
2. 使用默认管理员账号登录：
   - **邮箱**: `demo2024@test.com`
   - **密码**: `demo123456`

⚠️ **安全提示**：生产环境中请务必修改此默认密码！

---

## 环境配置

### 后端必需的环境变量

后端 API 需要以下环境变量才能启动：

#### 必需变量

| 变量名 | 说明 | 开发环境默认值 |
|--------|------|---------------|
| `DATABASE_URL` | PostgreSQL 数据库连接字符串 | `postgresql://blog_user:blog_password@localhost:5432/blog_db` |
| `REDIS_URL` | Redis 连接字符串 | `redis://localhost:6379` |
| `JWT_SECRET` | JWT 签名密钥 | `dev-secret-key-for-testing-only` |
| `PASSWORD_PEPPER` | 密码加密额外密钥 | `dev-pepper` |
| `SMTP_HOST` | SMTP 服务器地址 | `localhost` |
| `SMTP_PORT` | SMTP 端口 | `587` |
| `SMTP_USERNAME` | SMTP 用户名 | `noreply@example.com` |
| `SMTP_PASSWORD` | SMTP 密码 | `dev-password` |
| `SMTP_FROM` | 发件人邮箱 | `noreply@example.com` |
| `SMTP_TLS` | 是否使用 TLS | `false` (开发环境) |

#### 可选变量（有默认值）

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `SERVER_HOST` | 服务器监听地址 | `0.0.0.0` |
| `SERVER_PORT` | 服务器端口 | `3000` |
| `RUST_LOG` | Rust 日志级别 | `debug` |
| `ENVIRONMENT` | 环境类型 | `development` |

#### 启动脚本自动配置

启动脚本 (`start-admin.ps1` / `start-admin.sh`) 会自动设置所有必需的环境变量，你不需要手动配置。

#### 生产环境配置

**⚠️ 重要**：生产环境中必须修改以下值：

1. **JWT_SECRET**：使用强随机密钥（至少 32 字符）
2. **PASSWORD_PEPPER**：使用强随机密钥
3. **SMTP 配置**：配置真实的邮件服务器
4. **数据库密码**：使用强密码

生成安全密钥：

```bash
# Linux/Mac
openssl rand -base64 32

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

## 功能说明

## 访问管理后台

### 前置条件

要访问管理后台，用户账号必须具有 `admin` 角色。

### 默认管理员账号

系统预置了一个管理员账号：

- **邮箱**: `demo2024@test.com`
- **密码**: `demo123456`
- **角色**: `admin`

⚠️ **安全提示**：生产环境中请务必修改此默认密码！

### 访问步骤

1. 登录系统
   - 访问 `http://localhost:3003/login`
   - 输入管理员邮箱和密码
   - 点击"登录"

2. 访问管理后台
   - 登录成功后，访问 `http://localhost:3003/admin`
   - 或在导航栏选择"管理后台"（如果有此链接）

3. 权限验证
   - 系统会自动验证用户角色
   - 非 admin 用户会看到"您没有管理员权限"提示

### 创建新的管理员

#### 方法 1：通过数据库直接修改

```bash
# 连接到数据库
docker exec -it blog-postgres psql -U blog_user -d blog_db

# 将用户角色改为 admin
UPDATE users SET role = 'admin', updated_at = NOW() WHERE email = 'user@example.com';

# 退出
\q
```

#### 方法 2：通过管理后台

1. 使用现有管理员账号登录
2. 进入"用户管理"页面
3. 找到目标用户
4. 在"角色"下拉框中选择"管理员"
5. 系统自动保存更改

---

## 管理仪表板

### 概述

管理仪表板提供系统整体运营数据的概览，是管理后台的首页。

### 访问路径

```
http://localhost:3003/admin
```

默认显示"仪表板"标签页。

### 统计指标

仪表板显示以下关键指标：

1. **总用户数**
   - 显示系统中注册的用户总数
   - 实时更新

2. **总评论数**
   - 显示所有评论的总数（包括待审核、已通过、已拒绝等）

3. **待审核评论**
   - 显示需要审核的评论数量
   - 点击数字可跳转到评论审核页面

4. **已通过评论**
   - 显示已批准的评论数量

### 数据获取

仪表板数据通过以下 API 获取：

```bash
GET /v1/admin/stats
Authorization: Bearer <admin_token>
```

**响应示例**：

```json
{
  "total_users": 150,
  "total_comments": 850,
  "pending_comments": 12,
  "approved_comments": 800,
  "rejected_comments": 38
}
```

### 使用场景

- **日常监控**：每天查看系统运营状态
- **问题发现**：通过待审核评论数判断是否需要处理评论
- **趋势分析**：观察用户和评论增长趋势

---

## 用户管理

### 概述

用户管理功能允许管理员查看、管理和控制系统中的所有用户。

### 访问路径

在管理后台点击"用户管理"标签，或访问：

```
http://localhost:3003/admin#users
```

### 功能列表

#### 1. 查看用户列表

**显示字段**：
- 用户名
- 邮箱
- 角色（普通用户/版主/管理员）
- 邮箱验证状态
- 注册时间
- 操作（修改角色、删除用户）

**分页功能**：
- 每页显示 20 条记录
- 支持页码跳转
- 显示总用户数

**API 端点**：

```bash
GET /v1/admin/users?page=1&page_size=20
Authorization: Bearer <admin_token>
```

**响应示例**：

```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "username": "testuser",
      "role": "user",
      "email_verified": true,
      "created_at": "2025-12-26T12:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "page_size": 20
}
```

#### 2. 修改用户角色

**支持的角色**：
- **user**（普通用户）：默认角色，无特殊权限
- **moderator**（版主）：可以审核评论
- **admin**（管理员）：拥有所有权限

**操作步骤**：

1. 在用户列表中找到目标用户
2. 在"角色"列下拉框中选择新角色
3. 系统自动保存并刷新列表

**API 端点**：

```bash
PUT /v1/admin/users/{user_id}/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "moderator"
}
```

**测试示例**：

```bash
# 将用户升级为版主
curl -X PUT "http://localhost:3000/v1/admin/users/{user_id}/role" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "moderator"
  }'
```

**预期结果**：
- 返回 204 No Content
- 用户角色立即更新
- 用户下次登录时获得新权限

#### 3. 删除用户

**限制**：
- 不能删除自己的账号
- 删除用户会级联删除其所有数据（评论、点赞等）

**操作步骤**：

1. 在用户列表中找到目标用户
2. 点击"删除"按钮
3. 确认删除操作

**API 端点**：

```bash
DELETE /v1/admin/users/{user_id}
Authorization: Bearer <admin_token>
```

**测试示例**：

```bash
curl -X DELETE "http://localhost:3000/v1/admin/users/{user_id}" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**预期结果**：
- 返回 204 No Content
- 用户被永久删除
- 相关评论显示为"已删除用户"

---

## 评论审核

### 概述

评论审核功能允许管理员管理和审核用户提交的评论，控制评论的显示状态。

### 访问路径

在管理后台点击"评论审核"标签，或访问：

```
http://localhost:3003/admin#comments
```

### 评论状态

评论有以下几种状态：

- **pending**（待审核）：新提交的评论，默认状态
- **approved**（已通过）：审核通过，在前端显示
- **rejected**（已拒绝）：审核拒绝，不在前端显示
- **spam**（垃圾评论）：标记为垃圾，不在前端显示

### 功能列表

#### 1. 查看评论列表

**显示字段**：
- 评论内容（截断显示）
- 用户名
- 文章标识
- 状态（带颜色标签）
- 发布时间
- 操作（修改状态、删除）

**状态筛选**：
- 下拉框可选择状态筛选
- 选项：全部、待审核、已通过、已拒绝、垃圾评论
- 选择后自动刷新列表

**分页功能**：
- 每页显示 20 条记录
- 支持页码跳转
- 显示总评论数

**API 端点**：

```bash
# 获取所有评论
GET /v1/admin/comments?page=1&page_size=20

# 获取待审核评论
GET /v1/admin/comments?page=1&page_size=20&status=pending

# 获取已通过的评论
GET /v1/admin/comments?page=1&page_size=20&status=approved
```

**响应示例**：

```json
{
  "comments": [
    {
      "id": "uuid",
      "slug": "chemistry/rdkit-visualization",
      "user_id": "uuid",
      "username": "testuser",
      "content": "这是一篇很棒的文章！",
      "status": "pending",
      "created_at": "2025-12-26T12:00:00Z"
    }
  ],
  "total": 850,
  "page": 1,
  "page_size": 20
}
```

#### 2. 修改评论状态

**操作步骤**：

1. 在评论列表中找到目标评论
2. 在"操作"列的状态下拉框中选择新状态
3. 系统自动保存并刷新列表

**可用操作**：
- **待审核** → 通过：评论立即在前端显示
- **待审核** → 拒绝：评论被拒绝，不显示
- **待审核** → 垃圾：标记为垃圾评论
- **已通过** → 拒绝：评论被隐藏
- **已拒绝** → 通过：重新显示评论

**API 端点**：

```bash
PUT /v1/admin/comments/{comment_id}/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "approved",
  "reason": "评论内容良好"
}
```

**测试示例**：

```bash
# 通过评论
curl -X PUT "http://localhost:3000/v1/admin/comments/{comment_id}/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved"
  }'

# 拒绝评论
curl -X PUT "http://localhost:3000/v1/admin/comments/{comment_id}/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rejected",
    "reason": "包含不当内容"
  }'

# 标记为垃圾评论
curl -X PUT "http://localhost:3000/v1/admin/comments/{comment_id}/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "spam"
  }'
```

**预期结果**：
- 返回 204 No Content
- 评论状态立即更新
- 前端文章页面实时反映状态变化

#### 3. 删除评论

**适用场景**：
- 违规评论需要彻底删除
- 用户要求删除自己的评论
- 测试评论需要清理

**操作步骤**：

1. 在评论列表中找到目标评论
2. 点击"删除"按钮
3. 确认删除操作

**API 端点**：

```bash
DELETE /v1/admin/comments/{comment_id}
Authorization: Bearer <admin_token>
```

**测试示例**：

```bash
curl -X DELETE "http://localhost:3000/v1/admin/comments/{comment_id}" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**预期结果**：
- 返回 204 No Content
- 评论被永久删除
- 删除后无法恢复

### 审核工作流程建议

#### 每日审核流程

1. **登录管理后台**
   ```bash
   访问 http://localhost:3003/admin
   ```

2. **查看待审核评论**
   - 切换到"评论审核"标签
   - 筛选条件选择"待审核"
   - 查看待审核数量

3. **逐条审核评论**
   - 阅读评论内容
   - 检查评论是否符合社区规范
   - 选择合适的状态：
     - 内容正常 → "通过"
     - 内容不当 → "拒绝"
     - 明显垃圾 → "垃圾评论"

4. **处理垃圾评论**
   - 识别垃圾评论模式（广告、重复内容等）
   - 标记为"垃圾评论"
   - 考虑封禁该用户（如需要）

5. **定期清理**
   - 每周清理已拒绝的旧评论
   - 删除测试评论
   - 维护数据库性能

#### 审核标准

**应通过的评论**：
- 与文章相关的内容
- 有价值的提问和讨论
- 礼貌的建议和反馈
- 合理的观点表达

**应拒绝的评论**：
- 人身攻击或辱骂
- 无意义的灌水
- 重复的评论
- 与文章完全无关的内容

**应标记为垃圾的评论**：
- 广告或推销信息
- 诈骗链接
- 恶意刷屏
- 违法内容

---

## 管理员权限

### 权限系统

系统实现了基于角色的访问控制（RBAC）。

### 角色定义

#### 1. 普通用户（user）

**默认角色**，所有新注册用户都是普通用户。

**权限**：
- 浏览文章
- 发表评论（需要审核）
- 点赞文章和评论
- 查看自己的用户信息

**限制**：
- 无法访问管理后台
- 无法审核评论
- 无法管理用户

#### 2. 版主（moderator）

**权限**：
- 所有普通用户权限
- 访问管理后台的评论审核功能
- 审核通过/拒绝评论
- 删除评论

**限制**：
- 无法管理用户
- 无法修改用户角色
- 无法访问用户管理功能

#### 3. 管理员（admin）

**最高权限**，拥有所有功能访问权。

**权限**：
- 所有版主权限
- 用户管理（查看、修改角色、删除）
- 访问管理仪表板
- 查看系统统计信息

### 权限验证

所有管理 API 都会验证用户权限：

```rust
// 后端权限检查示例
async fn is_admin(user_id: Uuid, state: &AppState) -> Result<bool, AppError> {
    let role: Option<String> = sqlx::query_scalar(
        "SELECT role FROM users WHERE id = $1"
    )
    .bind(user_id)
    .fetch_optional(&state.db)
    .await?;

    Ok(role.as_deref() == Some("admin"))
}
```

**未授权访问结果**：
- 返回 403 Forbidden
- 错误信息：`{"code": 403, "message": "Unauthorized"}`

---

## 常见问题

### Q1: 如何批量审核评论？

**A**: 当前系统不支持批量操作，需要逐条审核。如需批量操作，可以使用 API 脚本：

```bash
# 批量通过所有待审核评论
ADMIN_TOKEN="your_admin_token"

# 获取待审核评论
COMMENTS=$(curl -X GET "http://localhost:3000/v1/admin/comments?status=pending&page_size=100" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.comments[].id')

# 逐个通过
for COMMENT_ID in $COMMENTS; do
  curl -X PUT "http://localhost:3000/v1/admin/comments/$COMMENT_ID/status" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status": "approved"}'
  echo "已通过评论: $COMMENT_ID"
done
```

### Q2: 如何恢复误删的用户？

**A**: 如果用户被误删，可以通过数据库恢复：

```bash
# 连接数据库
docker exec -it blog-postgres psql -U blog_user -d blog_db

# 查看已删除用户（如果有软删除）
SELECT * FROM users WHERE deleted_at IS NOT NULL;

# 如果是硬删除，需要从备份恢复
# 请参考 docs/database.md 中的备份和恢复章节
```

### Q3: 版主可以删除用户吗？

**A**: 不可以。版主只能管理评论，无法管理用户。只有管理员可以修改用户角色和删除用户。

### Q4: 如何查看某个用户的所有评论？

**A**: 可以通过数据库查询：

```bash
# 连接数据库
docker exec -it blog-postgres psql -U blog_user -d blog_db

# 查询用户的所有评论
SELECT c.id, c.slug, c.content, c.status, c.created_at
FROM comments c
WHERE c.user_id = 'user_uuid'
ORDER BY c.created_at DESC;

# 退出
\q
```

### Q5: 评论审核后，用户会收到通知吗？

**A**: 当前版本不会发送通知。这是计划中的功能，未来可能会添加邮件通知系统。

### Q6: 如何设置评论自动审核？

**A**: 当前版本所有评论都需要手动审核。如需实现自动审核，可以：

1. 修改 `backend/crates/api/src/routes/comments.rs` 中的 `create_comment` 函数
2. 根据特定规则自动设置状态：

```rust
// 示例：信任用户的评论自动通过
let is_trusted_user: bool = sqlx::query_scalar(
    "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1 AND role IN ('admin', 'moderator'))"
)
.bind(user_id)
.fetch_one(&state.db)
.await?;

let initial_status = if is_trusted_user {
    "approved"
} else {
    "pending"
};
```

### Q7: 管理员操作有日志记录吗？

**A**: 当前版本没有完整的操作日志系统。建议通过以下方式追踪：

1. **数据库查询日志**：检查后端日志文件
2. **API 访问日志**：查看 Nginx 或负载均衡器的访问日志
3. **应用日志**：`RUST_LOG=debug` 时会记录所有数据库操作

### Q8: 如何导出用户数据？

**A**: 使用数据库导出功能：

```bash
# 导出用户数据到 CSV
docker exec blog-postgres psql -U blog_user -d blog_db \
  -c "COPY (
      SELECT id, email, username, role, email_verified, created_at
      FROM users
      ORDER BY created_at DESC
    ) TO STDOUT WITH CSV HEADER" > users_export.csv
```

### Q9: 系统支持多管理员吗？

**A**: 支持。可以创建多个管理员账号：

```bash
# 方法 1：通过管理后台修改用户角色
# 方法 2：通过数据库直接修改
UPDATE users SET role = 'admin' WHERE email IN ('admin1@example.com', 'admin2@example.com');
```

### Q10: 如何禁用某个用户而不是删除？

**A**: 当前版本没有禁用功能。建议使用以下方式：

1. **修改密码**（临时方案）：
   ```bash
   # 生成新的随机密码哈希
   # 更新用户密码
   UPDATE users SET password_hash = 'new_hash' WHERE email = 'user@example.com';
   ```

2. **设置角色为受限用户**（未来功能）：
   - 可以考虑添加 `banned` 角色
   - 在登录逻辑中检查该角色

---

## 最佳实践

### 管理员账号安全

1. **使用强密码**
   - 至少 12 个字符
   - 包含大小写字母、数字和特殊字符
   - 定期更换密码

2. **启用双因素认证**（未来功能）
   - 计划支持 TOTP（基于时间的一次性密码）

3. **限制管理后台访问**
   - 使用防火墙规则限制 IP 访问
   - 配置 Nginx 访问控制

### 审核工作流

1. **定期审核**
   - 每天至少登录一次管理后台
   - 处理待审核评论
   - 检查异常活动

2. **制定社区规范**
   - 明确哪些内容可以接受
   - 公开审核标准
   - 一致地执行规则

3. **备份重要数据**
   - 定期备份数据库
   - 测试恢复流程
   - 保留多个备份版本

### 性能优化

1. **数据库索引**
   - 已为常用查询添加索引
   - 定期分析慢查询

2. **分页加载**
   - 大量数据使用分页
   - 避免一次性加载所有记录

3. **缓存策略**
   - 统计数据缓存 5 分钟
   - Redis 缓存热点数据

---

## API 参考

### 管理员相关 API

详细 API 文档请参考：`docs/API_REFERENCE.md`

主要端点：

```
GET    /v1/admin/stats              # 获取统计信息
GET    /v1/admin/users              # 获取用户列表
PUT    /v1/admin/users/{id}/role    # 修改用户角色
DELETE /v1/admin/users/{id}         # 删除用户
GET    /v1/admin/comments           # 获取评论列表
PUT    /v1/admin/comments/{id}/status # 修改评论状态
DELETE /v1/admin/comments/{id}      # 删除评论
```

---

## 技术实现

### 前端架构

管理后台基于 Next.js 16 + React 19 + TypeScript 构建，使用以下核心技术：

#### 技术栈
```typescript
// 核心框架
- Next.js 16+          // App Router
- React 19+            // UI 库
- TypeScript           // 类型安全
- Tailwind CSS         // 样式
- shadcn/ui            // UI 组件库

// 状态管理
- React Context API    // 全局状态
- React Query          // 服务端状态（可选）

// 表单处理
- React Hook Form      // 表单管理
- Zod                  // 数据验证

// 工具库
- date-fns            // 日期处理
```

#### 目录结构
```
frontend/
├── app/
│   └── admin/                    # 管理后台页面
│       ├── layout.tsx           # 管理后台布局
│       ├── page.tsx             # 仪表板（首页）
│       ├── users/               # 用户管理
│       │   ├── page.tsx         # 用户列表
│       │   └── [id]/            # 用户详情（可选）
│       └── comments/            # 评论管理
│           └── page.tsx         # 评论列表
├── components/
│   └── admin/                   # 管理后台组件
│       ├── AdminLayout.tsx      # 布局组件
│       ├── DashboardStats.tsx   # 统计卡片
│       ├── UserTable.tsx        # 用户表格
│       ├── CommentTable.tsx     # 评论表格
│       └── BatchActions.tsx     # 批量操作组件
├── lib/
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── useAuth.ts          # 认证 Hook
│   │   └── useAdmin.ts         # 管理 API Hook
│   └── utils.ts                 # 工具函数
└── types/
    └── backend.ts               # 后端类型定义
```

#### 关键实现

**权限验证中间件**
```typescript
// app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // 验证用户是否为管理员
  if (!user || user.role !== 'admin') {
    redirect('/')
  }

  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
}
```

**用户表格组件**
```typescript
// components/admin/UserTable.tsx
'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { adminApi } from '@/lib/api/backend'

export function UserTable() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search, roleFilter],
    queryFn: () => adminApi.getUsers({ page, search, role: roleFilter }),
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: () => {
      // 刷新数据
      queryClient.invalidateQueries(['admin', 'users'])
    },
  })

  // ... 渲染逻辑
}
```

### 后端架构

管理后台 API 基于 Rust + Axum 构建：

#### 路由结构
```rust
// backend/crates/api/src/routes/admin.rs
use axum::{
    routing::{get, put, delete},
    Router,
};

pub fn admin_routes() -> Router<AppState> {
    Router::new()
        // 统计数据
        .route("/stats", get(get_stats))

        // 用户管理
        .route("/users", get(get_users))
        .route("/users/:id/role", put(update_user_role))
        .route("/users/:id", delete(delete_user))
        .route("/users/batch", post(batch_user_action))

        // 评论管理
        .route("/comments", get(get_comments))
        .route("/comments/:id/status", put(update_comment_status))
        .route("/comments/:id", delete(delete_comment))
        .route("/comments/batch", post(batch_comment_action))

        // 权限验证中间件
        .layer(axum::middleware::from_fn_with_state(
            state.clone(),
            admin_auth_middleware,
        ))
}
```

#### 权限验证
```rust
// 管理员权限验证中间件
async fn admin_auth_middleware(
    State(state): State<AppState>,
    req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // 从 JWT token 中提取用户信息
    let user = extract_user_from_token(&req)?;

    // 验证用户角色
    if user.role != UserRole::Admin {
        return Err(StatusCode::FORBIDDEN);
    }

    Ok(next.run(req).await)
}
```

---

## 测试指南

### 快速功能测试

#### ✅ 仪表板测试
访问 `/admin`，检查：
- [ ] 看到 4 个统计卡片（用户数、评论数等）
- [ ] 看到快速操作链接
- [ ] 侧边栏正常显示

#### ✅ 用户管理测试
访问 `/admin/users`，检查：
- [ ] 点击侧边栏"用户管理"
- [ ] 看到用户列表
- [ ] 尝试搜索用户
- [ ] 尝试修改用户角色
- [ ] 尝试选择多个用户进行批量操作

#### ✅ 评论管理测试
访问 `/admin/comments`，检查：
- [ ] 点击侧边栏"评论审核"
- [ ] 看到评论列表
- [ ] 尝试筛选不同状态的评论
- [ ] 尝试修改评论状态
- [ ] 尝试批量操作

### 测试清单

#### 基本功能
- [ ] 页面能正常加载
- [ ] 侧边栏导航工作正常
- [ ] 数据能正常显示
- [ ] 搜索和筛选功能正常
- [ ] 批量操作功能正常
- [ ] 分页功能正常

#### UI/UX
- [ ] 深色模式正常切换
- [ ] 移动端响应式正常
- [ ] 加载状态正常显示
- [ ] 错误提示正常显示

#### 权限和安全
- [ ] 非管理员无法访问
- [ ] 登录状态正确保持
- [ ] 退出登录功能正常

### API 测试

#### 使用 curl 测试

```bash
# 1. 登录获取 token
TOKEN=$(curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo2024@test.com","password":"demo123456"}' \
  | jq -r '.token')

# 2. 测试统计数据 API
curl -X GET http://localhost:3000/v1/admin/stats \
  -H "Authorization: Bearer $TOKEN"

# 3. 测试用户列表 API
curl -X GET "http://localhost:3000/v1/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# 4. 测试修改用户角色
curl -X PUT http://localhost:3000/v1/admin/users/{user_id}/role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"moderator"}'

# 5. 测试评论列表 API
curl -X GET "http://localhost:3000/v1/admin/comments?status=pending" \
  -H "Authorization: Bearer $TOKEN"

# 6. 测试批量审核评论
curl -X POST http://localhost:3000/v1/admin/comments/batch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comment_ids": ["id1", "id2"],
    "action": "approve"
  }'
```

#### 使用 Postman 测试

导入 API Collection: `backend/docs/Blog_API.postman_collection.json`

---

## 故障排查

### 常见问题及解决方案

#### 问题 1：无法访问管理后台

**症状**：访问 `/admin` 时看到"您没有管理员权限"或重定向到首页

**可能原因**：
1. 用户角色不是 `admin`
2. 未登录或 token 过期
3. 权限验证逻辑错误

**解决步骤**：
```bash
# 1. 检查用户角色
docker exec -it blog-postgres psql -U blog_user -d blog_db
SELECT id, email, username, role FROM users WHERE email = 'demo2024@test.com';

# 2. 如果角色不对，修改为 admin
UPDATE users SET role = 'admin', updated_at = NOW() WHERE email = 'demo2024@test.com';

# 3. 退出并重新登录
\q
```

#### 问题 2：统计数据不显示

**症状**：仪表板统计卡片显示 0 或加载失败

**可能原因**：
1. 后端 API 未启动或崩溃
2. 数据库连接失败
3. Redis 缓存问题

**解决步骤**：
```bash
# 1. 检查后端服务
curl http://localhost:3000/health

# 2. 检查后端日志
journalctl -u blog-backend -f

# 3. 测试统计 API
curl -X GET http://localhost:3000/v1/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. 检查数据库连接
docker exec blog-postgres pg_isready -U blog_user

# 5. 检查 Redis
docker exec blog-redis redis-cli ping
```

#### 问题 3：批量操作不工作

**症状**：选择多个项目后点击批量操作无响应

**可能原因**：
1. 未选择任何项目
2. 权限不足
3. API 请求失败

**解决步骤**：
```javascript
// 1. 打开浏览器控制台
// 2. 查看 Network 标签，找到失败的请求
// 3. 检查请求体和响应

// 示例：检查是否选择了用户
const selectedUsers = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
console.log('Selected users:', selectedUsers.length)
```

#### 问题 4：搜索和筛选不工作

**症状**：输入搜索词或选择筛选条件后，列表不更新

**可能原因**：
1. API 参数格式错误
2. 前端状态未正确更新
3. 后端查询逻辑错误

**解决步骤**：
```bash
# 1. 测试搜索 API
curl -X GET "http://localhost:3000/v1/admin/users?search=test@example.com" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. 检查后端日志
# 看看 SQL 查询是否正确

# 3. 检查前端
# 打开浏览器控制台，查看组件状态
```

### 启动脚本修复说明

#### 已修复的问题

**问题 1：后端二进制名称错误**
- **错误**：`error: no bin target named 'blog-api'`
- **原因**：后端项目的二进制目标名称是 `api`，不是 `blog-api`
- **修复**：已更新所有启动脚本，将 `cargo run --bin blog-api` 改为 `cargo run --bin api`

**问题 2：前端端口冲突**
- **错误**：`Unable to acquire lock at .next/dev/lock`
- **原因**：前端可能已在运行或 Next.js 锁文件冲突
- **修复**：启动脚本现在会检查多个端口（3000-3003），自动检测并跳过已在运行的服务

### 日志调试

#### 前端调试

```javascript
// 在浏览器控制台中
// 查看当前用户信息
localStorage.getItem('user')

// 查看认证 token
localStorage.getItem('token')

// 手动测试 API
fetch('http://localhost:3000/v1/admin/stats', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(console.log)
```

#### 后端调试

```bash
# 查看后端日志
journalctl -u blog-backend -f

# 启用调试模式
RUST_LOG=debug cargo run --bin api

# 查看数据库查询日志
# 在 backend/crates/api/src/main.rs 中设置
```

### 性能优化建议

1. **数据库索引**
   - 已为常用查询添加索引
   - 定期分析慢查询

2. **分页加载**
   - 大量数据使用分页
   - 避免一次性加载所有记录

3. **缓存策略**
   - 统计数据缓存 5 分钟
   - Redis 缓存热点数据

4. **前端优化**
   - 使用 React.memo 避免不必要的重渲染
   - 虚拟滚动处理大列表（可选）

---

## 设计参考

### 管理后台最佳实践

本管理后台的设计参考了业界领先的系统：

#### 参考系统

1. **Strapi Admin Panel** - 现代化设计、优秀的用户体验
2. **Directus** - 数据驱动、高度可定制
3. **Refine** - React 框架、丰富的组件
4. **React Admin** - 企业级、功能完善

#### 核心功能特性

**仪表板**
- 实时统计卡片
- 数据可视化图表
- 快速操作面板
- 实时通知中心

**用户管理**
- 用户列表（分页、筛选、搜索）
- 用户详情
- 角色和权限管理
- 批量操作

**评论管理**
- 评论列表（多条件筛选）
- 评论详情
- 智能审核
- 批量审核

**系统设置**
- 站点配置
- 邮件配置
- 安全设置
- 功能开关

#### UI/UX 设计原则

- **布局**：侧边栏 + 主内容区
- **响应式**：支持桌面、平板、移动端
- **深色模式**：完整的深色主题支持
- **加载状态**：骨架屏、加载动画
- **错误处理**：清晰的错误提示
- **可访问性**：键盘导航、ARIA 标签

---

## 更多资源

- [系统功能文档](./function.md)
- [数据库文档](./database.md)
- [API 完整参考](./API_REFERENCE.md)
- [部署文档](./deploy.md)
