# 管理员功能文档

本文档详细说明博客系统的管理员功能，包括如何访问管理后台、用户管理、评论审核等内容。

## 目录

- [访问管理后台](#访问管理后台)
- [管理仪表板](#管理仪表板)
- [用户管理](#用户管理)
- [评论审核](#评论审核)
- [管理员权限](#管理员权限)
- [常见问题](#常见问题)

---

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

## 更多资源

- [系统功能文档](./function.md)
- [数据库文档](./database.md)
- [API 完整参考](./API_REFERENCE.md)
