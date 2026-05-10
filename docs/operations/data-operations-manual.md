---
title: Blog 数据操作完整手册
---

# Blog 数据操作完整手册

> **核心原则**: 所有内容操作的唯一数据格式是 **BlockNote 0.49.0 JSON**。
> 任何导入/导出/迁移/编辑操作，在数据入库之前必须通过格式验证。
> 遵循本手册操作，不会出现之前遇到的数据格式错误。

**最后更新**: 2026-05-03  
**适用版本**: BlockNote 0.49.0, PostgreSQL 17, Docker Compose local

---

## 目录

1. [快速参考卡](#快速参考卡)
2. [场景一: 服务器间数据库迁移](#场景一-服务器间数据库迁移)
3. [场景二: 从 MDX 文件批量导入](#场景二-从-mdx-文件批量导入)
4. [场景三: 数据库备份与恢复](#场景三-数据库备份与恢复)
5. [场景四: 编辑器往返流程](#场景四-编辑器往返流程)
6. [场景五: 全新数据库初始化](#场景五-全新数据库初始化)
7. [场景六: 内容格式升级](#场景六-内容格式升级)
8. [场景七: 单篇/部分文章导入导出](#场景七-单篇部分文章导入导出)
9. [场景八: 回滚与灾难恢复](#场景八-回滚与灾难恢复)
10. [附录A: BlockNote 0.49.0 Schema 速查](#附录a-blocknote-0490-schema-速查)
11. [附录B: 验证检查点详解](#附录b-验证检查点详解)
12. [附录C: 常见错误速查表](#附录c-常见错误速查表)

---

## 快速参考卡

| 操作 | 命令 | 验证 |
|------|------|------|
| 验证全部文章 | `python3 scripts/validate_content_json.py --db` | 0 errors |
| 导出全部 MDX | `docker exec blog-postgres psql ... -o /tmp/export.json` | — |
| MDX → BlockNote JSON | `python3 frontend/scripts/rebuild_content_json.py` | → validate |
| DB 备份 | `docker exec blog-postgres pg_dump ... \| gzip > backup.gz` | — |
| DB 恢复 | `gunzip -c backup.gz \| docker exec -i blog-postgres psql ...` | → validate |
| 单篇导入 | `python3 scripts/import_single_article.py --file article.mdx` | → validate |
| 回滚 | `git checkout` 迁移脚本 + 恢复备份 | → validate |

---

## 场景一: 服务器间数据库迁移

> **场景**: 将博客从服务器 A 迁移到服务器 B。数据库是唯一数据源。

### 步骤

```bash
# ─── 1. 服务器 A: 导出完整数据库 ───
ssh user@server-a
docker exec blog-postgres pg_dump -U blog_user -d blog_db \
  --clean --if-exists --no-owner \
  | gzip > /tmp/blog_migration_$(date +%Y%m%d).sql.gz

# 下载到本地
scp user@server-a:/tmp/blog_migration_20260503.sql.gz ./

# ─── 2. 服务器 B: 恢复数据库 ───
scp blog_migration_20260503.sql.gz user@server-b:/tmp/
ssh user@server-b

# 确保新数据库已创建（如果还没有）
docker exec blog-postgres psql -U blog_user -d postgres \
  -c "CREATE DATABASE blog_db OWNER blog_user;" 2>/dev/null || true

# 恢复
gunzip -c /tmp/blog_migration_20260503.sql.gz \
  | docker exec -i blog-postgres psql -U blog_user -d blog_db

# ─── 3. 重启应用服务 ───
docker compose -f docker-compose.local.yml restart api worker frontend

# ─── 4. ⚠️ 必做: 验证数据格式 ───
docker exec blog-postgres psql -U blog_user -d blog_db -t -A \
  -c "SELECT json_agg(json_build_object('slug', slug, 'content_json', content_json::text)) FROM posts WHERE content_json IS NOT NULL;" \
  -o /tmp/all_posts.json
docker cp blog-postgres:/tmp/all_posts.json /tmp/all_posts.json

source .env.local
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5432/blog_db" \
  python3 scripts/validate_content_json.py --db
# 期望输出: ✅ All content_json validates against BlockNote 0.49.0 schema
```

### 验证通过标准
- `validate_content_json.py` 输出 `✅ All ... articles validate cleanly`
- 前端 `http://server-b:3001` 博客列表正常加载
- 任意打开 3 篇文章，确认代码块高亮、表格、标题均正常

### 常见问题
| 问题 | 解决 |
|------|------|
| `database "blog_db" does not exist` | 先 `CREATE DATABASE blog_db` |
| pg_dump 版本不匹配 | 使用 `--no-owner --no-acl` 参数 |
| 恢复后验证失败 | 说明源库数据已有格式问题，先修源库再迁移 |

---

## 场景二: 从 MDX 文件批量导入

> **场景**: 有一批 MDX 文件需要导入到数据库中，替换或补充现有内容。

### 前置条件
- MDX 文件位于 `content/posts/` 目录（或其他目录）
- 文件中包含标准 Markdown 语法

### 步骤

```bash
# ─── 1. 导出 MDX 文件列表为 JSON ───
# 方法 A: 从文件系统读取
python3 -c "
import json, os
posts = []
for f in sorted(os.listdir('content/posts')):
    if f.endswith('.mdx'):
        slug = f.replace('.mdx', '')
        with open(f'content/posts/{f}') as fh:
            content = fh.read()
        # 分离 frontmatter 和正文
        parts = content.split('---', 2)
        body = parts[2] if len(parts) > 2 else content
        posts.append({'slug': slug, 'content_mdx': body.strip()})
with open('/tmp/mdx_import.json', 'w') as out:
    json.dump(posts, out, ensure_ascii=False)
print(f'Exported {len(posts)} posts')
"

# 方法 B: 从数据库导出已有 MDX
docker exec blog-postgres psql -U blog_user -d blog_db -t -A \
  -c "SELECT json_agg(json_build_object('id', id, 'slug', slug, 'content_mdx', content_mdx)) FROM posts WHERE content_mdx IS NOT NULL;" \
  -o /tmp/posts_mdx_export.json
docker cp blog-postgres:/tmp/posts_mdx_export.json /tmp/posts_mdx_export.json
cp /tmp/posts_mdx_export.json /tmp/mdx_import.json

# ─── 2. 转换为 BlockNote JSON ───
python3 frontend/scripts/rebuild_content_json.py
# 输出: ✅ post-name  328 blocks, H45, code×12, table×3...
# 期望: Updated: N, Errors: 0

# ─── 3. ⚠️ 必做: 入库前验证 ───
python3 -c "
import json, sys
sys.path.insert(0, 'scripts')
from validate_content_json import validate_blocknote_json

with open('/tmp/content_json_rebuilt.json') as f:
    data = json.load(f)

errors = []
for post_id, cj_str in data.items():
    blocks = json.loads(cj_str) if isinstance(cj_str, str) else cj_str
    errors.extend(validate_blocknote_json(blocks, post_id))

if errors:
    print(f'❌ {len(errors)} validation errors — DO NOT APPLY TO DB')
    for e in errors[:20]:
        print(f'  • {e}')
    exit(1)
else:
    print(f'✅ All {len(data)} posts validated — safe to apply')
"

# ─── 4. 应用到数据库 ───
docker cp /tmp/update_content_json.sql blog-postgres:/tmp/
docker exec blog-postgres psql -U blog_user -d blog_db \
  -f /tmp/update_content_json.sql

# ─── 5. ⚠️ 入库后验证 ───
DATABASE_URL="postgresql://blog_user:blog_password@127.0.0.1:5432/blog_db" \
  python3 scripts/validate_content_json.py --db

# ─── 6. 重启前端清除缓存 ───
docker compose -f docker-compose.local.yml restart frontend
```

### 如果验证失败

```bash
# 查看错误类型分布
python3 -c "
import json, sys
sys.path.insert(0, 'scripts')
from validate_content_json import validate_blocknote_json
from collections import Counter

with open('/tmp/content_json_rebuilt.json') as f:
    data = json.load(f)

error_types = Counter()
for post_id, cj_str in data.items():
    blocks = json.loads(cj_str)
    for e in validate_blocknote_json(blocks, post_id):
        error_types[e.split(':')[-1].strip()[:60]] += 1

for k, v in error_types.most_common():
    print(f'  {v:>4}x  {k}')
"

# 常见修复方向:
# - 'unknown block type' → rebuild_content_json.py 的 parser 缺少该语法
# - 'table missing tableContent' → make_table() 需要 tableContent 包装
# - 'codeBlock missing language' → make_codeblock() 需要默认 language
# - 'styles must be object' → 旧格式 boolean styles，需要转换
```

---

## 场景三: 数据库备份与恢复

> **场景**: 定期备份，或运维操作前创建还原点。

### 备份

```bash
# ─── 完整备份（包含 schema + 数据） ───
BACKUP_FILE="backups/blog_db_$(date +%Y%m%d_%H%M%S).sql.gz"
docker exec blog-postgres pg_dump -U blog_user -d blog_db \
  --clean --if-exists --no-owner \
  | gzip > "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE ($(du -h $BACKUP_FILE | cut -f1))"

# ─── 仅备份 content_json（轻量） ───
docker exec blog-postgres psql -U blog_user -d blog_db -t -A \
  -c "SELECT json_agg(row_to_json(p)) FROM (SELECT id, slug, title, content_json, content_mdx, status, published_at FROM posts ORDER BY slug) p;" \
  -o /tmp/content_only_$(date +%Y%m%d).json
docker cp blog-postgres:/tmp/content_only_$(date +%Y%m%d).json \
  ./backups/content_only_$(date +%Y%m%d).json
```

### 恢复

```bash
# ─── 从完整备份恢复 ───
# ⚠️ 这会删除并重建所有数据

# 1. 停止应用（避免连接冲突）
docker compose -f docker-compose.local.yml stop api worker

# 2. 恢复
BACKUP_FILE="backups/blog_db_20260503_120000.sql.gz"
gunzip -c "$BACKUP_FILE" \
  | docker exec -i blog-postgres psql -U blog_user -d blog_db

# 3. 启动应用
docker compose -f docker-compose.local.yml up -d api worker

# 4. ⚠️ 必做: 验证
DATABASE_URL="postgresql://blog_user:blog_password@127.0.0.1:5432/blog_db" \
  python3 scripts/validate_content_json.py --db
```

### 仅恢复 content_json（不影响其他表）

```bash
# 从 content_only JSON 恢复
python3 -c "
import json

with open('backups/content_only_20260503.json') as f:
    posts = json.load(f)

sql = ['BEGIN;']
for p in posts:
    cj = json.dumps(p['content_json'], ensure_ascii=False) if isinstance(p['content_json'], (list, dict)) else p['content_json']
    escaped = cj.replace(\"'\", \"''\")
    sql.append(f\"UPDATE posts SET content_json = '{escaped}' WHERE id = '{p['id']}';\")
sql.append('COMMIT;')

with open('/tmp/restore_content.sql', 'w') as f:
    f.write('\n'.join(sql))
print(f'Generated {len(posts)} UPDATE statements')
"

docker cp /tmp/restore_content.sql blog-postgres:/tmp/
docker exec blog-postgres psql -U blog_user -d blog_db -f /tmp/restore_content.sql

# ⚠️ 验证
DATABASE_URL="postgresql://blog_user:blog_password@127.0.0.1:5432/blog_db" \
  python3 scripts/validate_content_json.py --db
```

---

## 场景四: 编辑器往返流程

> **场景**: 从数据库导出 → 在 BlockNote 编辑器中修改 → 保存回数据库。

### 导出（用于编辑）

```bash
# ─── 导出单篇文章为 BlockNote JSON 文件 ───
SLUG="my-article-slug"

docker exec blog-postgres psql -U blog_user -d blog_db -t -A \
  -c "SELECT content_json::text FROM posts WHERE slug = '$SLUG';" \
  -o /tmp/article_export.txt
docker cp blog-postgres:/tmp/article_export.txt /tmp/

# 写入本地 JSON 文件
python3 -c "
import json
with open('/tmp/article_export.txt') as f:
    raw = f.read().strip()
data = json.loads(raw)  # 已经是 BlockNote blocks 数组
with open('${SLUG}_blocks.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print(f'Exported {len(data)} blocks')
"
```

### 编辑后导入

```bash
# ─── 1. 验证编辑后的文件 ───
python3 -c "
import json, sys
sys.path.insert(0, 'scripts')
from validate_content_json import validate_blocknote_json

with open('${SLUG}_blocks.json') as f:
    blocks = json.load(f)

errors = validate_blocknote_json(blocks, '$SLUG')
if errors:
    print(f'❌ {len(errors)} errors — fix before importing:')
    for e in errors[:20]:
        print(f'  • {e}')
    exit(1)
else:
    print('✅ Valid BlockNote JSON')
"

# ─── 2. 导入到数据库 ───
python3 -c "
import json

with open('${SLUG}_blocks.json') as f:
    blocks = json.load(f)

cj_str = json.dumps(blocks, ensure_ascii=False)
escaped = cj_str.replace(\"'\", \"''\")
sql = f\"UPDATE posts SET content_json = '{escaped}' WHERE slug = '${SLUG}';\"

with open('/tmp/import_single.sql', 'w') as f:
    f.write(sql)
"

docker cp /tmp/import_single.sql blog-postgres:/tmp/
docker exec blog-postgres psql -U blog_user -d blog_db -f /tmp/import_single.sql

# ─── 3. 验证全局数据依然完好 ───
DATABASE_URL="postgresql://blog_user:blog_password@127.0.0.1:5432/blog_db" \
  python3 scripts/validate_content_json.py --db --quiet && echo "✅ OK"
```

### 直接在 BlockNote 编辑器中编辑（推荐）

如果使用博客自带的 Admin 编辑器（`http://localhost:3001/admin`）：

1. 登录进入管理后台
2. 点击文章进入编辑页
3. 编辑器是 BlockNote，保存时自动调用 API 写回 `content_json`
4. **无需手动导入导出** — 编辑器的 `onChange` 回调直接产生 BlockNote JSON

> ⚠️ Admin 编辑器保存后，建议定期跑全量验证确保没有意外引入格式问题：
> ```bash
> python3 scripts/validate_content_json.py --db --quiet
> ```

---

## 场景五: 全新数据库初始化

> **场景**: 在新环境从零开始搭建博客，从 MDX 文件初始化数据库。

### 步骤

```bash
# ─── 1. 启动基础服务 ───
docker compose -f docker-compose.local.yml up -d postgres redis minio meilisearch

# ─── 2. 等待数据库就绪 ───
until docker exec blog-postgres pg_isready -U blog_user; do sleep 2; done

# ─── 3. 运行数据库迁移 ───
docker compose -f docker-compose.local.yml run --rm migrator

# ─── 4. 准备 MDX 导入数据 ───
# 确保 MDX 文件在 content/posts/ 目录下
ls content/posts/*.mdx | wc -l  # 确认文件数量

# 生成导入 JSON
python3 -c "
import json, os
posts = []
for f in sorted(os.listdir('content/posts')):
    if f.endswith('.mdx'):
        slug = f.replace('.mdx', '')
        with open(f'content/posts/{f}') as fh:
            content = fh.read()
        parts = content.split('---', 2)
        body = parts[2] if len(parts) > 2 else content
        posts.append({'slug': slug, 'content_mdx': body.strip(), 'title': slug})
with open('/tmp/mdx_import.json', 'w') as out:
    json.dump(posts, out, ensure_ascii=False)
print(f'Prepared {len(posts)} posts for import')
"

# ─── 5. 转换为 BlockNote JSON ───
# 修改 rebuild_content_json.py 使其支持 --input 参数
python3 frontend/scripts/rebuild_content_json.py

# ─── 6. ⚠️ 入库前验证 ───
python3 -c "
import json, sys
sys.path.insert(0, 'scripts')
from validate_content_json import validate_blocknote_json
with open('/tmp/content_json_rebuilt.json') as f:
    data = json.load(f)
errors = []
for pid, cj in data.items():
    errors.extend(validate_blocknote_json(json.loads(cj), pid))
assert not errors, f'{len(errors)} validation errors'
print('✅ Validated')
"

# ─── 7. 写入数据库 ───
docker cp /tmp/update_content_json.sql blog-postgres:/tmp/
docker exec blog-postgres psql -U blog_user -d blog_db -f /tmp/update_content_json.sql

# ─── 8. ⚠️ 入库后验证 ───
DATABASE_URL="postgresql://blog_user:blog_password@127.0.0.1:5432/blog_db" \
  python3 scripts/validate_content_json.py --db

# ─── 9. 启动应用 ───
docker compose -f docker-compose.local.yml up -d api worker frontend
docker compose -f docker-compose.local.yml restart frontend  # 清除构建缓存
```

---

## 场景六: 内容格式升级

> **场景**: BlockNote 版本升级后，需要将旧格式 content_json 升级到新格式。

### 升级前检查

```bash
# ─── 1. 备份 ───
bash scripts/backup/backup-all.sh

# ─── 2. 检查当前格式问题 ───
DATABASE_URL="postgresql://blog_user:blog_password@127.0.0.1:5432/blog_db" \
  python3 scripts/validate_content_json.py --db
# 记录错误数量和类型

# ─── 3. 导出所有文章的 MDX 原文 ───
docker exec blog-postgres psql -U blog_user -d blog_db -t -A \
  -c "SELECT json_agg(json_build_object('id', id, 'slug', slug, 'content_mdx', content_mdx)) FROM posts WHERE content_mdx IS NOT NULL;" \
  -o /tmp/posts_mdx_export.json
docker cp blog-postgres:/tmp/posts_mdx_export.json /tmp/
```

### 执行升级

```bash
# ─── 1. 从 MDX 原文重新生成 BlockNote JSON ───
# 这是最安全的升级方式 — 从源 MDX 重新解析，避免修补旧格式
python3 frontend/scripts/rebuild_content_json.py

# ─── 2. ⚠️ 入库前验证（拦截所有格式错误） ───
python3 -c "
import json, sys
sys.path.insert(0, 'scripts')
from validate_content_json import validate_blocknote_json

with open('/tmp/content_json_rebuilt.json') as f:
    data = json.load(f)

errors = []
for pid, cj_str in data.items():
    blocks = json.loads(cj_str)
    errors.extend(validate_blocknote_json(blocks, pid[:40]))

if errors:
    print(f'❌ BLOCKED: {len(errors)} validation errors')
    from collections import Counter
    for k, v in Counter(e.split(':')[-1].strip()[:60] for e in errors).most_common(10):
        print(f'  {v:>4}x  {k}')
    exit(1)
else:
    print(f'✅ All {len(data)} posts pass validation — safe to apply')
"

# ─── 3. 应用 ───
docker cp /tmp/update_content_json.sql blog-postgres:/tmp/
docker exec blog-postgres psql -U blog_user -d blog_db -f /tmp/update_content_json.sql

# ─── 4. ⚠️ 入库后验证 ───
DATABASE_URL="postgresql://blog_user:blog_password@127.0.0.1:5432/blog_db" \
  python3 scripts/validate_content_json.py --db

# ─── 5. 重启 ───
docker compose -f docker-compose.local.yml restart frontend
```

### 如果升级脚本需要修改

编辑 `frontend/scripts/rebuild_content_json.py` 后：

```bash
# 本地快速验证（不碰数据库）
python3 -c "
import json, sys
sys.path.insert(0, 'scripts')
sys.path.insert(0, 'frontend/scripts')
from rebuild_content_json import parse_mdx_to_blocks
from validate_content_json import validate_blocknote_json

# 测试一篇有代表性的文章
test_mdx = '''
# Test Heading

This is **bold** and *italic* text.

| Col A | Col B |
|-------|-------|
| val1  | val2  |

\`\`\`python
print('hello')
\`\`\`

> A quote with **bold**
'''

blocks = parse_mdx_to_blocks(test_mdx)
errors = validate_blocknote_json(blocks, 'test')

if errors:
    for e in errors:
        print(f'  ❌ {e}')
else:
    print(f'✅ Test passed — {len(blocks)} blocks generated')
"
```

---

## 场景七: 单篇/部分文章导入导出

### 导出单篇

```bash
SLUG="my-article"

# 导出为 BlockNote JSON
docker exec blog-postgres psql -U blog_user -d blog_db -t -A \
  -c "SELECT content_json::text FROM posts WHERE slug = '$SLUG';" \
  -o /tmp/single_export.txt
docker cp blog-postgres:/tmp/single_export.txt /tmp/

python3 -c "
import json
with open('/tmp/single_export.txt') as f:
    raw = f.read().strip()
blocks = json.loads(raw)
with open('${SLUG}.blocknote.json', 'w') as f:
    json.dump(blocks, f, ensure_ascii=False, indent=2)
print(f'Exported {len(blocks)} blocks → ${SLUG}.blocknote.json')
"
```

### 导出多篇（按条件筛选）

```bash
# 导出所有 published 文章
docker exec blog-postgres psql -U blog_user -d blog_db -t -A \
  -c "SELECT json_agg(json_build_object('id', id, 'slug', slug, 'content_json', content_json::text)) FROM posts WHERE status = 'published';" \
  -o /tmp/published_posts.json
docker cp blog-postgres:/tmp/published_posts.json ./

# 导出特定 tag 的文章
TAG="robotics"
docker exec blog-postgres psql -U blog_user -d blog_db -t -A \
  -c "SELECT json_agg(json_build_object('id', p.id, 'slug', p.slug, 'content_json', p.content_json::text)) FROM posts p JOIN post_tags pt ON p.slug = pt.post_slug JOIN tags t ON pt.tag_id = t.id WHERE t.slug = '$TAG';" \
  -o /tmp/tag_${TAG}.json
docker cp blog-postgres:/tmp/tag_${TAG}.json ./
```

### 导入单篇

```bash
SLUG="my-article"

# ─── 1. 验证 JSON 文件 ───
python3 -c "
import json, sys
sys.path.insert(0, 'scripts')
from validate_content_json import validate_blocknote_json

with open('${SLUG}.blocknote.json') as f:
    blocks = json.load(f)

errors = validate_blocknote_json(blocks, '$SLUG')
if errors:
    print(f'❌ Validation failed — DO NOT IMPORT')
    for e in errors:
        print(f'  • {e}')
    exit(1)
print('✅ Valid')
"

# ─── 2. 导入 ───
python3 -c "
import json
with open('${SLUG}.blocknote.json') as f:
    blocks = json.load(f)
cj = json.dumps(blocks, ensure_ascii=False).replace(\"'\", \"''\")
sql = f\"UPDATE posts SET content_json = '{cj}' WHERE slug = '${SLUG}';\" + \
      f\"INSERT INTO posts (slug, content_json) SELECT '${SLUG}', '{cj}' WHERE NOT EXISTS (SELECT 1 FROM posts WHERE slug = '${SLUG}');\"
with open('/tmp/import_single.sql', 'w') as f:
    f.write(sql)
"

docker cp /tmp/import_single.sql blog-postgres:/tmp/
docker exec blog-postgres psql -U blog_user -d blog_db -f /tmp/import_single.sql

# ─── 3. 验证 ───
DATABASE_URL="postgresql://blog_user:blog_password@127.0.0.1:5432/blog_db" \
  python3 scripts/validate_content_json.py --db --quiet && echo "✅"
```

---

## 场景八: 回滚与灾难恢复

### 快速回滚（迁移脚本出错后）

```bash
# ─── 1. 停止写操作 ───
docker compose -f docker-compose.local.yml stop api worker

# ─── 2. 从最近的备份恢复 ───
LATEST_BACKUP=$(ls -t backups/db_*.sql.gz | head -1)
echo "Restoring from: $LATEST_BACKUP"

gunzip -c "$LATEST_BACKUP" \
  | docker exec -i blog-postgres psql -U blog_user -d blog_db

# ─── 3. 启动服务 ───
docker compose -f docker-compose.local.yml up -d api worker frontend

# ─── 4. 验证 ───
DATABASE_URL="postgresql://blog_user:blog_password@127.0.0.1:5432/blog_db" \
  python3 scripts/validate_content_json.py --db
```

### 仅回滚 content_json（不丢其他数据）

```bash
# 如果只改了 content_json 且有备份
# 从 content_only 备份恢复（见场景三）

# 或者从 git 恢复旧版本迁移脚本重新生成
git stash  # 暂存当前修改
python3 frontend/scripts/rebuild_content_json.py  # 用旧脚本生成
docker cp /tmp/update_content_json.sql blog-postgres:/tmp/
docker exec blog-postgres psql -U blog_user -d blog_db -f /tmp/update_content_json.sql
git stash pop  # 恢复修改继续调试
```

### 灾难恢复检查清单

- [ ] 确认最近备份文件存在 (`ls -lh backups/`)
- [ ] 确认备份内容完整 (`gunzip -c backup.gz | wc -l`)
- [ ] 确认 Docker 服务正常 (`docker ps`)
- [ ] 恢复数据库
- [ ] 跑验证 (`validate_content_json.py --db`)
- [ ] 检查前端页面正常加载
- [ ] 抽查 3+ 篇文章内容无误

---

## 附录A: BlockNote 0.49.0 Schema 速查

### 块类型层级

```
document → blocks[]
  ├── paragraph → content: inline[]           (text, link, mention)
  ├── heading(1-3) → content: inline[]
  ├── codeBlock → content: inline[]           (props.language required)
  ├── bulletListItem → content: inline[]
  ├── numberedListItem → content: inline[]
  ├── checkListItem → content: inline[]       (props.checked: bool)
  ├── toggleListItem → content: inline[]
  ├── blockquote → content: blocks[]          (嵌套 blocks, 非 inline!)
  ├── divider → content: none
  ├── image → content: none                   (props.url required)
  ├── video → content: none                   (props.url required)
  ├── audio → content: none
  ├── file → content: none
  └── table → content: tableRow[]
       └── tableRow → content: (tableHeader | tableCell)[]
            ├── tableHeader → content: tableParagraph[]
            └── tableCell → content: tableParagraph[]
                 └── tableParagraph → content: inline[]
```

### 内联节点

```
text:  {type: "text", text: "...", styles: {bold: {}, italic: {}, ...}}
link:  {type: "link", href: "url", content: [text...]}
```

### 样式值

```json
// ✅ 正确 — 空对象
{"bold": {}, "italic": {}, "code": {}, "strike": {}, "highlight": {}}

// ❌ 错误 — boolean（BlockNote 0.49.0 拒绝）
{"bold": true, "italic": false}
```

---

## 附录B: 验证检查点详解

### 检查点位置

```
数据流:  MDX 文件 → converter → JSON 文件 → SQL → 数据库 → API → 前端
                ↑            ↑          ↑       ↑
             检查点①      检查点②    检查点③  检查点④
```

| 检查点 | 位置 | 命令 | 拦截什么 |
|--------|------|------|----------|
| ① | converter 输出 | `validate_blocknote_json()` in Python | converter bug |
| ② | JSON 文件入库前 | 同①，手动调用 | 写入错误数据 |
| ③ | SQL 执行后 | `validate_content_json.py --db` | SQL 转义问题 |
| ④ | 前端渲染时 | 浏览器 F12 Console | 运行时 schema 拒绝 |

### 强制验证节点

以下操作**必须**在完成后运行验证：

- ✅ 任何 `UPDATE posts SET content_json = ...` 之后
- ✅ `rebuild_content_json.py` 应用到数据库之后
- ✅ 数据库迁移/恢复之后
- ✅ 手动编辑 content_json 之后
- ✅ BlockNote 版本升级之后

---

## 附录C: 常见错误速查表

| 错误信息 | 根因 | 修复 |
|----------|------|------|
| `tableCell ... ONLY accepts tableParagraph, got 'text'` | tableCell 的 content 直接放了 text 节点 | 加 `tableParagraph` 包装层 |

| `codeBlock missing props.language` | 没有指定语言 | 设 `props.language = "plaintext"` |
| `blockquote ... unknown block type 'text'` | blockquote content 直接放了 inline text | 用 paragraph 包裹 |
| `style 'bold' must be object {}, got bool` | styles 用了 `{bold: true}` | 改为 `{bold: {}}` |
| `heading level 4 not in {1, 2, 3}` | 标题层级超过 BlockNote 上限 | 截断到 3 |
| `unknown block type 'xxx'` | 使用了不支持的块类型 | 检查 VALID_BLOCK_TYPES |

### 调试步骤

```bash
# 1. 定位问题文章
docker exec blog-postgres psql -U blog_user -d blog_db -t -A \
  -c "SELECT slug FROM posts WHERE content_json::text LIKE '%problematic_pattern%' LIMIT 5;"

# 2. 查看原始 JSON（前 500 字符）
docker exec blog-postgres psql -U blog_user -d blog_db -t -A \
  -c "SELECT left(content_json::text, 500) FROM posts WHERE slug = 'problem-slug';"

# 3. 复制出来本地调试
docker exec blog-postgres psql -U blog_user -d blog_db -t -A \
  -c "SELECT content_json::text FROM posts WHERE slug = 'problem-slug';" \
  -o /tmp/debug.json
docker cp blog-postgres:/tmp/debug.json /tmp/

python3 -c "
import json, sys
sys.path.insert(0, 'scripts')
from validate_content_json import validate_blocknote_json
with open('/tmp/debug.json') as f:
    blocks = json.loads(f.read().strip())
for e in validate_blocknote_json(blocks, 'debug'):
    print(e)
"
```

---

## 附录D: 辅助脚本索引

| 脚本 | 用途 | 位置 |
|------|------|------|
| `validate_content_json.py` | BlockNote 0.49.0 格式验证 | `scripts/` |
| `rebuild_content_json.py` | MDX → BlockNote JSON 转换 | `frontend/scripts/` |
| `export-all-posts.py` | 导出文章为 MDX 文件 | `scripts/export/` |
| `export-posts-to-mdx.sh` | 多格式导出 (SQL/CSV/JSON/MDX) | `scripts/export/` |
| `backup-all.sh` | 完整系统备份 | `scripts/backup/` |
| `fix_content_json.py` | 修复旧格式 content_json | `scripts/` (legacy) |
| `fix_tables.py` | 修复表格格式 | `scripts/` (legacy) |

> ⚠️ `fix_content_json.py` 和 `fix_tables.py` 已被 `rebuild_content_json.py` + `validate_content_json.py` 取代。
> 新操作优先使用 rebuild + validate 组合。
