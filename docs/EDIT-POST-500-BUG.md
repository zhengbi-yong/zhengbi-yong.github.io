# 文章编辑页面 500 错误分析报告

> **状态**: ✅ 已解决（2026-04-23）
>
> `param_index` bug 已修复并合并至 `main` 分支（commit `2220c0b`）。

## 问题描述

用户点击"更新并发布"按钮时，`PATCH /api/v1/admin/posts/:id` 返回 500 Internal Server Error。

## 根本原因

### 确认的 Bug: `param_index` 增量缺失

**位置**: `backend/crates/api/src/routes/posts.rs` 第 920-922 行

```rust
if req.content_format.is_some() {
    update_fields.push(format!("content_format = ${}", param_index));
    // ❌ 缺少 param_index += 1;
}
```

**对比正确的 `is_featured` 处理**:
```rust
if req.is_featured.is_some() {
    update_fields.push(format!("is_featured = ${}", param_index));
    param_index += 1;  // ✅ 正确
}
```

**影响**: 当 `content_format` 字段存在时，`param_index` 不会递增，导致后续字段的占位符编号错误。

**具体场景（假设请求包含所有字段）**:
- 查询构建为: `UPDATE posts SET title=$2, status=$3, is_featured=$4, content_format=$4 WHERE id = $1`
- 注意 `is_featured` 和 `content_format` 都使用了 `$4`！
- 绑定: `$1=post_id, $2=title, $3=status, $4=is_featured`
- `content_format` 字段接收到 `is_featured` 的值，类型不匹配 → SQL 错误 → 500

## 已应用的修复

**文件**: `backend/crates/api/src/routes/posts.rs`

```diff
  if req.content_format.is_some() {
      update_fields.push(format!("content_format = ${}", param_index));
+     param_index += 1;
  }
```

**验证**: `cargo check` 通过，无 warning。

## 关于 Tiptap 编辑器

**你的文章编辑页面已经在使用 Tiptap 编辑器** ✅

- 组件位置: `frontend/src/components/editor/TiptapEditor.tsx`
- 已集成到编辑页面: `frontend/src/app/admin/posts/edit/[slug]/page.tsx`
- 使用 TurndownService 将 HTML 输出转换为 Markdown
- 支持: 代码高亮、数学公式、任务列表、图片、链接等

## 部署后验证步骤

1. 重启后端服务
2. 清除浏览器缓存
3. 登录管理后台 (http://192.168.0.161:3001/admin)
4. 进入文章管理 → 编辑任意文章
5. 修改内容后点击"更新并发布"
6. 确认成功消息出现

## 相关文件

| 文件 | 说明 |
|------|------|
| `frontend/src/app/admin/posts/edit/[slug]/page.tsx` | 文章编辑页面（使用 Tiptap） |
| `frontend/src/components/editor/TiptapEditor.tsx` | Tiptap 编辑器组件 |
| `backend/crates/api/src/routes/posts.rs` | 后端 PATCH 接口（含 bug） |
| `frontend/src/lib/api/backend.ts` | 前端 API 客户端 |
