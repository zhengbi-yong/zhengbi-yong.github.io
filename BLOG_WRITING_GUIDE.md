# 博客写作与备份指南

## 📝 如何写博客？

### 方式一：使用管理后台（推荐）

访问：`http://localhost:3001/admin` 或 `http://your-domain.com/admin`

**功能：**
- ✅ 创建新文章（Markdown/MDX格式）
- ✅ 编辑已有文章
- ✅ 上传图片和管理媒体文件
- ✅ 设置分类和标签
- ✅ 定时发布
- ✅ 查看文章统计（浏览量、点赞、评论）
- ✅ 管理评论

**步骤：**
1. 登录管理后台
2. 点击 "Posts" 或 "文章管理"
3. 点击 "New Post" 或 "新建文章"
4. 填写标题、内容、标签等
5. 点击 "Save" 保存草稿
6. 点击 "Publish" 发布文章

---

### 方式二：通过API（适合程序员）

如果你喜欢用本地编辑器写文章，可以：

1. **本地编写MDX文件**（使用VS Code等编辑器）
2. **通过API上传到数据库**

```bash
# 示例：使用curl创建文章
curl -X POST http://localhost:3000/v1/admin/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的新文章",
    "content": "# 欢迎阅读\n\n这是文章内容...",
    "summary": "文章简介",
    "status": "draft",
    "tags": ["技术", "教程"]
  }'
```

---

### 方式三：导出→编辑→导入（高级用户）

**工作流程：**

```bash
# 1. 导出所有文章为MDX文件
./scripts/export/export-all-posts.py

# 2. 用你喜欢的编辑器编辑MDX文件
code ./exported-posts-mdx/

# 3. 编辑完成后，通过管理后台或API导入
```

---

## 💾 如何备份博客？

### 自动备份（推荐）

系统已经配置了自动备份，每天凌晨2点执行：

```bash
# 查看自动备份状态
crontab -l

# 查看备份日志
tail -f scripts/logs/backup.log
```

**备份位置：** `./backups/`
- `db_YYYYMMDD_HHMMSS.sql.gz` - 数据库备份（压缩）
- `redis_YYYYMMDD_HHMMSS.rdb` - Redis缓存备份
- 自动保留最近7天的备份

---

### 手动备份

#### 方法1: 使用备份脚本

```bash
# 执行完整备份
./scripts/backup/backup-all.sh
```

#### 方法2: 导出为可读格式

```bash
# 导出为多种格式
./scripts/export/export-posts-to-mdx.sh ./my-backup
```

**生成的文件：**
```
./my-backup/
├── posts_20251230.sql          # 完整数据库备份
├── posts_20251230.csv          # CSV格式（可用Excel打开）
├── posts_20251230.json         # JSON格式（可用文本编辑器打开）
└── example-post.mdx            # MDX示例文件
```

#### 方法3: 导出所有文章为MDX

```bash
# 需要先安装Python依赖
pip install psycopg2-binary

# 导出所有文章为独立MDX文件
./scripts/export/export-all-posts.py ./exported-posts-mdx
```

**生成的结构：**
```
./exported-posts-mdx/
├── my-first-post.mdx
├── chemistry-tutorial.mdx
├── music-theory.mdx
└── ...
```

---

## 🔍 能否用文本编辑器查看？

### 答案：可以！

虽然文章存储在数据库中，但你可以：

#### 1. 查看单个文章
```bash
# 使用导出脚本
./scripts/export/export-posts-to-mdx.sh

# 查看导出的文件
cat exported-posts/example-post.mdx
```

#### 2. 查看所有文章（多种格式）

**CSV格式（推荐）：**
```bash
# 导出
./scripts/export/export-posts-to-mdx.sh ./backup

# 用Excel打开
open backup/posts_20251230.csv  # macOS
start backup/posts_20251230.csv # Windows
```

**JSON格式：**
```bash
# 用文本编辑器查看
code backup/posts_20251230.json
cat backup/posts_20251230.json | jq
```

**MDX格式：**
```bash
# 导出为MDX
./scripts/export/export-all-posts.py ./mdx-backup

# 用编辑器批量查看/编辑
code ./mdx-backup/
```

---

## 📋 备份策略建议

### 日常使用
✅ **依赖自动备份**（每天凌晨2点）
✅ **定期查看备份目录**：`ls -lh backups/`
✅ **重要修改后手动备份**：`./scripts/backup/backup-all.sh`

### 重要里程碑
🎯 发布重大文章前
🎯 网站改版前
🎯 更换服务器前

**执行：**
```bash
# 完整备份
./scripts/backup/backup-all.sh

# 导出为MDX（便于版本控制）
./scripts/export/export-all-posts.py ./mdx-backup

# 提交到Git（可选）
git add ./mdx-backup
git commit -m "backup: 文章快照 $(date)"
```

---

## 🔄 灾难恢复

### 如果数据库损坏

```bash
# 1. 停止服务
docker-compose down

# 2. 恢复最近的备份
gunzip -c backups/db_20251230_020000.sql.gz | \
  docker exec -i blog-postgres psql -U blog_user blog_db

# 3. 重启服务
docker-compose up -d
```

### 如果需要查看旧版本

```bash
# 导出指定日期的文章
docker exec blog-postgres pg_dump -U blog_user blog_db > backup.sql
```

---

## 📊 实用命令

```bash
# 查看文章统计
docker exec blog-postgres psql -U blog_user blog_db -c "
SELECT
    status,
    COUNT(*) as count
FROM posts
WHERE deleted_at IS NULL
GROUP BY status;
"

# 查看最近10篇文章
docker exec blog-postgres psql -U blog_user blog_db -c "
SELECT
    slug,
    title,
    published_at
FROM posts
WHERE deleted_at IS NULL
ORDER BY published_at DESC
LIMIT 10;
"

# 查看备份大小
du -sh backups/

# 清理旧备份（保留最近7天）
find backups/ -name "*.gz" -mtime +7 -delete
```

---

## 💡 常见问题

### Q: 文章只能在数据库里吗？
**A:** 不是的！你可以：
- 随时导出为MDX文件
- 用文本编辑器查看和编辑
- 导出为CSV/JSON等多种格式

### Q: 我习惯了用本地编辑器写文章
**A:** 你可以：
1. 继续用本地编辑器写MDX
2. 写完后复制到管理后台
3. 或者使用导出/导入脚本

### Q: 备份文件占用空间大吗？
**A:**
- 压缩后的SQL备份通常只有几MB
- MDX文件体积更小
- 自动清理7天前的备份

### Q: 如何确保备份安全？
**A:**
```bash
# 定期下载备份到本地
scp -r user@server:/path/to/backups ./local-backup

# 或者同步到云存储
rsync -av backups/ your-cloud-storage:blog-backups/
```

---

## 🎯 推荐工作流

### 日常写作
1. 在管理后台写文章 ✍️
2. 保存草稿 💾
3. 预览效果 👀
4. 发布 🚀

### 本地编辑爱好者
1. 本地写MDX 📝
2. 导出数据库为MDX对比 📥
3. 通过API上传 📤
4. 在线查看效果 👀

### 备份习惯
1. 依赖自动备份 🤖
2. 重要节点手动备份 💾
3. 定期导出MDX 📥
4. 版本控制（可选） 📌

---

**需要帮助？** 查看管理后台的帮助文档或检查日志：
```bash
tail -f scripts/logs/backup.log
docker-compose logs -f backend
```
