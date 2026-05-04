# 博客系统端到端功能测试完整链路

> **测试环境**
> - 公网地址: `http://124.88.174.125:3001`
> - 后端 API: `http://124.88.174.125:3000`
> - 本地地址: `http://127.0.0.1:3001` / `http://127.0.0.1:3000`
> - 管理员: `admin@test.com` / `xK9#mP2$vL8@nQ5*wR4`
> - 测试日期: 2026-05-03
> - 当前分支: `remove-tiptap-only-blocknote`

---

## 0. 服务启动与基础设施检查（前置条件）

### 0.1 启动所有服务

```bash
cd /data1/zhengbi/zhengbi-yong.github.io

# 1. 启动基础设施
docker compose -f deployments/docker/compose-files/dev/docker-compose.yml up -d
sleep 5

# 2. 启动应用服务
docker compose -f docker-compose.local.yml up -d

# 3. 如果需要前端源码变更，重建
# docker compose -f docker-compose.local.yml build frontend
# docker compose -f docker-compose.local.yml up -d --no-deps frontend
```

### 0.2 验证所有容器健康

| # | 检查项 | 命令 | 预期 |
|---|--------|------|------|
| 1 | 所有容器运行中 | `docker ps --filter name=blog-` | 8 个容器全部 Up |
| 2 | PostgreSQL 可连接 | `docker exec blog-postgres pg_isready -U blog_user -d blog_db` | accepting connections |
| 3 | 后端健康检查 | `curl -s http://127.0.0.1:3000/.well-known/live` | 200 OK |
| 4 | 前端首页可访问 | `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001` | 200 |
| 5 | 数据库文章数 | `docker exec blog-postgres psql -U blog_user -d blog_db -c "SELECT COUNT(*) FROM posts;"` | 144 |
| 6 | Worker 健康 | `docker logs blog-local-worker-1 --tail 5` | 无 ERROR |

---

## 第1链：公开展示页面（未登录用户视角）

### 1.1 首页 (Homepage)

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 打开 `http://124.88.174.125:3001` | HTTP 状态码 | 200 |
| 2 | 检查页面标题 | 浏览器标题栏 | "首页 | Zhengbi Yong" 或类似 |
| 3 | 检查导航栏链接 | 点击每个导航项 | 博客、实验室、关于、搜索、登录均可点击 |
| 4 | 检查已登录/未登录状态 | 右上角 | 显示"登录"按钮（未登录）或用户头像（已登录） |
| 5 | 验证主题切换 | 点击调色板图标 → 选择主题 | 页面颜色变化，刷新后保持 |
| 6 | 验证暗色模式 | 点击太阳/月亮图标 | 切换 light/dark，刷新后保持 |
| 7 | 检查 footer | 滚动到底部 | 版权信息、链接完整 |

### 1.2 博客列表页

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 点击"博客"或访问 `/blog` | HTTP 200 | 显示文章列表，有封面图/标题/摘要/日期 |
| 2 | 翻页 | 点击底部分页器 `第2页` | URL 变为 `/blog/page/2`，加载新文章 |
| 3 | 检查文章卡片 | 每张卡片 | 有标题、日期、分类标签、摘要 |
| 4 | 点击任意文章 | 进入文章详情 | 跳转到 `/blog/{slug}` |
| 5 | 点击分类标签 | 点击卡片上的分类 | 跳转到该分类文章列表 |
| 6 | 空状态处理 | 访问不存在的分类 `/blog/category/nonexistent` | 显示"该分类下暂无文章" |
| 7 | 访问 `/tags/test` | 旧路由重定向 | 301 → `/blog/tag/test` |

### 1.3 文章详情页 🔥 重点测试

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 打开一篇包含**代码块**的文章 | 代码块渲染 | 行号与代码行严格对齐，底部无多余空行 |
| 2 | 检查代码语言标签 | 代码块左上角 | bash/dockerfile/yaml 显示语言，plaintext 不显示 |
| 3 | 检查**图片**渲染 | 文章中的图片 | 正常显示，不超出容器 |
| 4 | 检查**表格**渲染 | 文章中的表格 | 对齐正确，边框完整 |
| 5 | 检查**标题层级** | h1-h6 | 字号层级正确，锚点链接可点击 |
| 6 | 检查**列表** | 有序/无序列表 | 缩进正确 |
| 7 | 检查**引用块** | blockquote | 左边框样式正确 |
| 8 | 检查**链接** | 内链/外链 | 内链跳转，外链 `target="_blank"` |
| 9 | 检查**行内代码** | 反引号文本 | 背景色高亮，等宽字体 |
| 10 | 检查**粗体/斜体** | 加粗/斜体文本 | 样式正确 |
| 11 | 检查文章元数据 | 标题下方 | 作者、日期、分类、标签、阅读时间 |
| 12 | 访问不存在的文章 | `/blog/nonexistent-slug-12345` | 显示 404 页面 |
| 13 | 修改日期格式 | 观察日期显示 | 格式统一（如 2026-05-03） |

### 1.4 标签/分类页面

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 访问 `/blog/tag/test` | 标签文章列表 | 显示包含该标签的文章 |
| 2 | 访问 `/blog/category/test` | 分类文章列表 | 显示该分类下的文章 |
| 3 | 标签页翻页 | 分页器 | URL `/blog/tag/{tag}/page/2` |
| 4 | 空标签 | 访问无文章的标签 | "暂无文章"提示 |

### 1.5 实验室页面 (Lab)

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 访问 `/lab` | HTTP 200 | 显示实验室项目卡片列表 |
| 2 | 访问 `/lab/music` | HTTP 200 | 音乐实验室页面 |
| 3 | 访问 `/lab/excalidraw` | HTTP 200 | 画图实验室页面 |
| 4 | 访问 `/lab/experiment` | HTTP 200 | 实验页面 |
| 5 | 旧路由重定向 | 访问 `/music` `/excalidraw` | 301 → `/lab/music` `/lab/excalidraw` |

### 1.6 搜索功能

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 访问 `/search` | HTTP 200 | 搜索页面加载 |
| 2 | 搜索已知关键词 | 输入"代码" / "docker" | 返回相关文章列表 |
| 3 | 搜索无结果 | 输入 `xyzabcdef123` | 显示"未找到相关结果" |
| 4 | 空搜索 | 不输入直接搜索 | 显示提示或全部文章 |
| 5 | 搜索建议 | 输入几个字符 | 下拉建议列表出现 |

### 1.7 用户公开主页

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 访问 `/users/admin` | HTTP 200 | 显示 admin 用户信息、头像、文章列表 |
| 2 | 访问不存在的用户 | `/users/nonexistent_123` | 404 页面 |
| 3 | 检查用户头像 | 头像显示 | 默认头像或自定义头像正常显示 |

### 1.8 其他公开页面

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 访问 `/about` | HTTP 200 | 关于页面 |
| 2 | 访问 `/projects` | HTTP 200 | 项目展示页面 |
| 3 | 访问 `/team` | HTTP 200 | 团队成员页面 |
| 4 | 访问 `/settings/themes` | HTTP 200 | 主题画廊（32 个主题） |
| 5 | 切换主题画廊中的主题 | 点击预览卡片 | 主题立即生效 |

---

## 第2链：后端 API（curl 直接测试）🔧

### 2.1 认证 API

```bash
BASE="http://127.0.0.1:3000/api/v1"

# 测试 1: 登录成功
curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"xK9#mP2$vL8@nQ5*wR4"}' | jq .

# 预期: {"access_token":"...", "user":{"id":"...","email":"admin@test.com","role":"admin"}}

# 测试 2: 登录失败（错误密码）
curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"wrong_password"}' | jq .

# 预期: 401 或 {"error":"..."}

# 测试 3: 登录失败（不存在用户）
curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"no@user.com","password":"password123"}' | jq .

# 预期: 401

# 测试 4: 获取当前用户 (需要 token)
TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"xK9#mP2$vL8@nQ5*wR4"}' | jq -r '.access_token')

curl -s $BASE/auth/me -H "Authorization: Bearer $TOKEN" | jq .
# 预期: {"id":"...","email":"admin@test.com","role":"admin",...}

# 测试 5: 无 token 访问 /auth/me
curl -s $BASE/auth/me | jq .
# 预期: 401

# 测试 6: 错误 token 访问
curl -s $BASE/auth/me -H "Authorization: Bearer invalid_token" | jq .
# 预期: 401

# 测试 7: 登出
curl -s -X POST $BASE/auth/logout -H "Authorization: Bearer $TOKEN"
# 预期: 200
```

### 2.2 文章 API

```bash
# 测试 8: 获取文章列表（分页）
curl -s "$BASE/posts?per_page=3&page=1" | jq '.posts | length'
# 预期: 3 (或实际数量)

# 测试 9: 分页参数 per_page
curl -s "$BASE/posts?per_page=5" | jq '.posts | length'
# 预期: 5

# 测试 10: 按分类筛选
curl -s "$BASE/posts?category=test-category" | jq '.posts'
# 预期: 该分类下的文章

# 测试 11: 按标签筛选
curl -s "$BASE/posts?tag=test-tag" | jq '.posts'
# 预期: 包含该标签的文章

# 测试 12: 获取单篇文章
curl -s "$BASE/posts/some-article-slug" | jq '.'
# 预期: 包含 title, content, content_json, slug, created_at 等字段

# 测试 13: 验证 content_json 格式
curl -s "$BASE/posts/some-article-slug" | jq '.content_json | type'
# 预期: "array" (BlockNote blocks 数组)

# 测试 14: 获取不存在的文章
curl -s "$BASE/posts/this-does-not-exist-12345" | jq '.'
# 预期: 404

# 测试 15: 记录阅读
curl -s -X POST "$BASE/posts/some-article-slug/view" -H "Authorization: Bearer $TOKEN"
# 预期: 200

# 测试 16: 点赞文章
curl -s -X POST "$BASE/posts/some-article-slug/like" -H "Authorization: Bearer $TOKEN"
# 预期: 200, 返回 likes_count

# 测试 17: 取消点赞
curl -s -X DELETE "$BASE/posts/some-article-slug/like" -H "Authorization: Bearer $TOKEN"
# 预期: 200
```

### 2.3 分类/标签 API

```bash
# 测试 18: 获取分类列表
curl -s "$BASE/categories" | jq '. | length'
# 预期: 正常返回数组

# 测试 19: 获取标签列表
curl -s "$BASE/tags" | jq '. | length'
# 预期: 正常返回数组

# 测试 20: 热门标签
curl -s "$BASE/tags/popular" | jq '.'
# 预期: 按热度排序的标签列表

# 测试 21: 标签自动补全
curl -s "$BASE/tags/autocomplete?q=test" | jq '.'
# 预期: 匹配 "test" 的标签建议
```

### 2.4 用户公开 API

```bash
# 测试 22: 获取用户信息
curl -s "$BASE/users/admin" | jq '.'
# 预期: {username, display_name, avatar_url, bio, ...}

# 测试 23: 获取不存在用户
curl -s "$BASE/users/nonexistent" | jq '.'
# 预期: 404
```

### 2.5 搜索 API

```bash
# 测试 24: 全文搜索
curl -s "$BASE/search?q=docker" | jq '.'
# 预期: 返回匹配 "docker" 的文章列表

# 测试 25: 搜索建议
curl -s "$BASE/search/suggest?q=py" | jq '.'
# 预期: 匹配建议列表

# 测试 26: 空搜索
curl -s "$BASE/search?q=" | jq '.'
# 预期: 返回错误或空结果
```

### 2.6 阅读进度 API

```bash
# 测试 27: 更新阅读进度
curl -s -X POST "$BASE/posts/some-article-slug/reading-progress" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"progress":0.5}' | jq '.'

# 测试 28: 获取阅读进度
curl -s "$BASE/posts/some-article-slug/reading-progress" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 测试 29: 获取阅读历史
curl -s "$BASE/reading-progress/history" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## 第3链：管理员登录/登出/认证流程 🔐

### 3.1 正常登录流程

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 打开 `http://124.88.174.125:3001/login` | 登录页面渲染 | 显示登录表单（邮箱+密码） |
| 2 | 输入错误密码 | 错误提示 | 显示"邮箱或密码错误" |
| 3 | 输入正确凭据 `admin@test.com` / 密码 | 登录成功 | 跳转到首页或重定向目标 |
| 4 | 检查右上角 | 用户状态 | 显示用户头像/名称/退出按钮，不再是"登录" |
| 5 | 刷新页面 | 登录状态保持 | session 持久化，仍为已登录状态 |

### 3.2 管理后台入口

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 未登录访问 `/admin` | 认证拦截 | 自动跳转到 `/login?redirect=...` |
| 2 | 登录后重定向 | post-login redirect | 自动跳回刚才想访问的 `/admin` |
| 3 | 已登录访问 `/admin` | HTTP 200 | 显示管理仪表盘 |
| 4 | 访问 `/admin/posts` | HTTP 200 | 显示文章管理列表 |
| 5 | 访问 `/admin/users` | HTTP 200 | 显示用户管理列表 |
| 6 | 访问 `/admin/comments` | HTTP 200 | 显示评论管理 |
| 7 | 访问 `/admin/settings` | HTTP 200 | 显示设置页面 |
| 8 | 访问 `/admin/media` | HTTP 200 | 显示媒体管理 |
| 9 | 访问 `/admin/monitoring` | HTTP 200 | 显示监控面板 |

### 3.3 登出流程

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 点击右上角"退出"/"登出" | 登出成功 | 跳转到首页，右上角显示"登录"按钮 |
| 2 | 再次访问 `/admin` | 认证拦截 | 自动跳转到登录页 |
| 3 | 检查 session | 浏览器 DevTools | session cookie 已清除 |

### 3.4 登录态过期

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 长期不活动后刷新 | token 过期 | 自动跳转到登录页（非错误页） |
| 2 | 重新登录 | 正常流程 | 可继续使用 |

---

## 第4链：文章 CRUD 完整流程 ✍️

### 4.1 创建新文章

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 管理员登录 → `/admin/posts/new` | 编辑器加载 | 显示 BlockNote 编辑器，有工具栏 |
| 2 | 输入标题 | 标题输入框 | 可正常输入中文/英文/特殊字符 |
| 3 | **测试段落** | 输入纯文本 | 正常显示，自动创建 paragraph block |
| 4 | **测试标题** | 使用 `/h1` `/h2` 或工具栏 | 正常创建各级标题 |
| 5 | **测试代码块** | 输入 `/code` 或工具栏代码按钮 | 代码块创建，语言选择可用，代码高亮 |
| 6 | **测试图片** | 插入图片 | 图片上传/显示正常 |
| 7 | **测试列表** | 有序/无序列表 | 缩进层级正确 |
| 8 | **测试引用** | 引用块 | 样式正确 |
| 9 | **测试表格** | 创建表格 | 行列正常 |
| 10 | **测试粗体/斜体/链接** | 工具栏按钮 | 样式正确应用 |
| 11 | 设置分类和标签 | 元数据面板 | 可添加/删除分类和标签 |
| 12 | 设置摘要 | 摘要输入框 | 保存成功 |
| 13 | 设置特色图片 | 上传封面 | 预览显示 |
| 14 | 保存/发布 | 点击"保存"或"发布" | 显示成功提示 |
| 15 | 访问前端查看文章 | `/blog/{new-slug}` | 内容完全一致，排版正确 |

### 4.2 编辑已有文章

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | `/admin/posts` → 点击任意文章"编辑" | 编辑器加载 | 显示该文章全部内容 |
| 2 | 内容完整性 | 对比原文章 | **所有** block 类型完整加载（段落/代码/图片/表格/列表） |
| 3 | 代码块 reload | 编辑页代码块 | 代码内容完整，语言标记保留 |
| 4 | 修改标题 | 更改标题 | slug 不变（或按规则更新） |
| 5 | 修改内容 | 增删改 paragraph | 保存后正确更新 |
| 6 | 修改代码块 | 编辑代码内容 | 保存后行号对齐、语言标记保留 |
| 7 | 修改标签/分类 | 元数据面板 | 更新成功 |
| 8 | 保存 | 点击保存 | 成功提示 |
| 9 | 验证前端 | 刷新文章详情页 | 所有修改正确反映 |

### 4.3 删除文章

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | `/admin/posts` → 点击删除 | 确认对话框 | 弹出确认提示 |
| 2 | 确认删除 | 删除成功 | 文章从列表消失 |
| 3 | 访问已删除文章 | `/blog/{deleted-slug}` | 404 |

### 4.4 批量操作（如有）

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 多选文章 | 复选框 | 可选中多篇 |
| 2 | 批量删除 | 批量操作按钮 | 确认后全部删除 |
| 3 | 批量修改标签 | 批量标签 | 选中的文章全部更新标签 |

---

## 第5链：文章导入/导出/格式验证 📦

### 5.1 BlockNote JSON 导出

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 运行导出脚本 | `bash scripts/export_blocknote_json.sh` | 成功导出所有文章 JSON |
| 2 | 检查导出文件 | `ls exports/blocknote_json/` | 每个文章一个 JSON 文件 |
| 3 | 随机抽查 3 篇 | 读取 JSON 内容 | content_json 格式正确（BlockNote blocks 数组） |
| 4 | 验证代码块格式 | 代码块中 no `\n` text node | content 中 text 节点不含单独 `\n` 节点 |
| 5 | 验证 style 格式 | style 为 `{}` 非 `true`/`false` | 符合 BlockNote 0.49.0 schema |

### 5.2 数据库导出/导入（迁移用）

```bash
cd /data1/zhengbi/zhengbi-yong.github.io
DB="postgresql://blog_user:password@127.0.0.1:5432/blog_db"

# 导出
DATABASE_URL="$DB" python3 scripts/blog-migrate.py pg_dump --out /tmp/test-export.dump

# 验证导出
DATABASE_URL="$DB" python3 scripts/blog-migrate.py verify

# 测试导入（如有测试数据库）
# DATABASE_URL="$TEST_DB" python3 scripts/blog-migrate.py pg_restore --file /tmp/test-export.dump
```

### 5.3 content_json 格式验证

```bash
# 运行数据库格式验证
bash scripts/validate_db.sh

# 预期: 144 篇文章 0 错误
```

### 5.4 导出→再导入→对比（完整闭环）

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 选一篇文章（含代码块、图片、表格） | 确认内容完整 | - |
| 2 | 导出该文章的 content_json | 保存为 JSON 文件 | JSON 格式正确 |
| 3 | 通过 API 创建新文章 | POST `/api/v1/admin/posts` | 201 Created |
| 4 | 导入步骤2的 content_json | 作为 content_json 字段传入 | 保存成功 |
| 5 | 在前端查看文章 | 新文章详情页 | 内容与原文章完全一致 |
| 6 | 在编辑器中打开 | 新文章编辑页 | BlockNote 正确加载所有 block |
| 7 | 对比两篇文章 | 视觉对比 | 排版、代码高亮、图片、表格完全一致 |

---

## 第6链：用户管理 👥

### 6.1 用户列表查看

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 管理员登录 → `/admin/users` | 页面加载 | 显示所有用户列表 |
| 2 | 用户信息完整性 | 每行数据 | ID、邮箱、角色、注册时间 |
| 3 | 搜索用户 | 搜索框输入邮箱 | 过滤显示匹配用户 |
| 4 | 分页 | 翻页 | 分页器正常 |

### 6.2 用户角色管理

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 创建测试用户（通过 API） | 注册新用户 | 201 Created |
| 2 | 在列表中看到新用户 | 角色显示 | "user" |
| 3 | 提升为管理员 | 修改角色为 "admin" | 角色更新成功 |
| 4 | 降级为普通用户 | 修改角色为 "user" | 角色更新成功 |
| 5 | 批量修改角色 | 选中多个用户 → 批量操作 | 所有选中用户角色更新 |

### 6.3 删除用户

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 删除测试用户 | 确认删除 | 用户从列表消失 |
| 2 | 尝试删除自己（admin） | 安全保护 | 不允许删除自己 |
| 3 | 已删除用户登录 | 用已删除账号登录 | 401 或错误提示 |

---

## 第7链：评论系统 💬

### 7.1 创建评论（公开）

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 打开任意文章，滚动到评论区域 | 评论表单 | 显示输入框 |
| 2 | 未登录评论 | 游客评论 | 需要填写昵称/邮箱（或要求登录） |
| 3 | 登录后评论 | 输入内容提交 | 评论发布成功，显示在列表中 |
| 4 | 实时显示 | 新评论 | 出现在评论列表顶部/底部 |

### 7.2 评论管理（管理员）

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 访问 `/admin/comments` | 评论管理页 | 显示所有评论列表 |
| 2 | 审核评论 | 修改评论状态（通过/待审/垃圾） | 状态更新成功 |
| 3 | 删除评论 | 删除指定评论 | 评论从列表消失 |
| 4 | 前端验证 | 刷新文章页 | 被删除评论不再显示 |

---

## 第8链：主题系统 🎨

### 8.1 主题切换

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 打开 `/settings/themes` | 主题画廊 | 显示 32 个主题，7 个分类 |
| 2 | 点击任意主题 | 即时预览 | 页面颜色变化 |
| 3 | 刷新页面 | 持久化 | 主题保持不变（localStorage） |
| 4 | 切换为不同分类 | 点击分类标签 | 过滤显示该分类主题 |
| 5 | 页面头部快速切换 | 点击导航栏调色板图标 | 弹出主题选择器 |

### 8.2 暗色模式

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 点击太阳/月亮图标 | 切换 dark/light | 全站颜色变化 |
| 2 | 刷新页面 | 持久化 | 暗色模式保持 |
| 3 | 暗色+主题叠加 | 切换暗色下的主题 | 暗色背景+主题色正确 |
| 4 | 代码块暗色 | 代码块在暗色下 | 可读性良好，高亮正常 |

### 8.3 主题系统诊断

```bash
# 验证 Tailwind @theme 桥接
CSS_URL=$(curl -s http://127.0.0.1:3001/ | grep -oP 'href="[^"]*\.css[^"]*"' | head -1 | sed 's/href="//;s/"//')
curl -s "http://127.0.0.1:3001$CSS_URL" | grep -o "var(--theme-[a-z-]*" | sort -u
# 预期: 15-20+ 个 var(--theme-*) 引用

# 验证 gray 调色板覆盖
curl -s "http://127.0.0.1:3001$CSS_URL" | grep -o '\-\-color-white:[^;]*'
# 预期: --color-white:var(--theme-bg)

# 验证 <html> 上 data-theme 属性
curl -s http://127.0.0.1:3001/ | grep -o 'data-theme="[^"]*"'
# 应有默认主题
```

---

## 第9链：安全与边界测试 🛡️

### 9.1 认证保护

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 无 token 访问管理 API | `curl $BASE/admin/posts` | 401 |
| 2 | 过期 token 访问 | 使用过期 JWT | 401 |
| 3 | 篡改 token 访问 | 使用被修改的 JWT | 401 |
| 4 | 无 token 创建文章 | POST `/api/v1/admin/posts` | 401 |
| 5 | 无 token 删除用户 | DELETE admin user API | 401 |

### 9.2 CSRF 保护

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 无 CSRF token 发送 batch 请求 | POST `/api/v1/admin/users/batch/role` | 403 |
| 2 | 带 CSRF token 发送 | 先登录取 cookie → 带 token | 200 |

### 9.3 CORS

```bash
# 从不同 origin 发起请求
curl -s -X POST http://127.0.0.1:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://evil.com" \
  -d '{"email":"admin@test.com","password":"xK9#mP2$vL8@nQ5*wR4"}' \
  -v 2>&1 | grep -i "access-control"

# dev 环境应允许跨域
```

### 9.4 输入验证

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 超长标题 | 5000 字符标题 | 400 或截断 |
| 2 | 空内容文章 | content_json=null | 400 |
| 3 | SQL 注入 | 在搜索框输入 `'; DROP TABLE--` | 不执行，安全处理 |
| 4 | XSS | content 包含 `<script>alert(1)</script>` | 被转义，不执行 |

### 9.5 速率限制

```bash
# 快速连续请求
for i in $(seq 1 100); do
  curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/api/v1/posts &
done
# 预期: 部分请求返回 429 Too Many Requests
```

---

## 第10链：媒体管理 📁

### 10.1 上传媒体

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 管理员 → `/admin/media` | 媒体管理页 | 显示已有媒体列表 |
| 2 | 上传图片 | 拖拽或选择文件 | 上传成功，列表中显示 |
| 3 | 上传非图片文件 | PDF/DOCX 等 | 按支持的文件类型处理 |
| 4 | 超大文件 | 超过限制大小 | 错误提示 |

### 10.2 管理媒体

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 查看未使用媒体 | 筛选未使用 | 显示孤立媒体文件 |
| 2 | 删除媒体 | 删除指定文件 | 文件从列表和存储中移除 |
| 3 | 在文章中引用媒体 | 编辑文章→插入已上传图片 | 图片正确显示 |

---

## 第11链：文章版本控制 📝

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 编辑一篇文章多次保存 | 自动创建版本 | 版本列表有多个记录 |
| 2 | 查看版本历史 | `/admin/posts/versions/{slug}` | 显示所有版本、时间、变更摘要 |
| 3 | 对比两个版本 | 版本对比功能 | 显示 diff |
| 4 | 回滚到旧版本 | 恢复指定版本 | 文章内容恢复为该版本 |
| 5 | 删除版本 | 删除指定版本 | 版本从列表消失 |

---

## 第12链：跨浏览器/设备兼容性 🌐

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | Chrome 桌面 | 所有页面 | UI 正常，功能正常 |
| 2 | Firefox 桌面 | 所有页面 | UI 正常，功能正常 |
| 3 | Safari 桌面 | 所有页面 | UI 正常（如有设备） |
| 4 | Safari 移动端 | 响应式布局 | 导航折叠、内容自适应 |
| 5 | Chrome 移动端 | 响应式布局 | 同上 |
| 6 | 平板横屏 | 响应式布局 | 列表变双列/三列 |
| 7 | 慢网络 (3G 模拟) | 加载体验 | loading 状态显示，不白屏 |

---

## 第13链：性能与 SEO 📊

### 13.1 性能

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | Lighthouse 首页 | Performance | ≥ 80 |
| 2 | Lighthouse 文章页 | Performance | ≥ 70 |
| 3 | 首屏加载时间 | FCP | < 2s |
| 4 | 最大内容绘制 | LCP | < 3s |

### 13.2 SEO

| 步骤 | 操作 | 验证点 | 预期结果 |
|------|------|--------|----------|
| 1 | 查看页面源码 | title/meta description | 每个页面有独立标题和描述 |
| 2 | Open Graph 标签 | og:title, og:image | 分享到社交媒体有预览 |
| 3 | 结构化数据 | JSON-LD | 文章有 BlogPosting schema |
| 4 | sitemap.xml | 访问 `/sitemap.xml` | 包含所有文章 URL |
| 5 | robots.txt | 访问 `/robots.txt` | 正确配置 |

---

## 测试结果记录表

| 链路 | 测试项 | 结果 | 发现的问题 | 修复记录 |
|------|--------|------|------------|----------|
| 0 | 服务启动 | ⬜ | | |
| 0 | 容器健康 | ⬜ | | |
| 1.1 | 首页 | ⬜ | | |
| 1.2 | 博客列表 | ⬜ | | |
| 1.3 | 文章详情(代码块对齐) | ⬜ | | |
| 1.3 | 文章详情(图片) | ⬜ | | |
| 1.3 | 文章详情(表格) | ⬜ | | |
| 1.3 | 404 页面 | ⬜ | | |
| 1.4 | 标签/分类 | ⬜ | | |
| 1.5 | Lab 页面 | ⬜ | | |
| 1.6 | 搜索 | ⬜ | | |
| 1.7 | 用户主页 | ⬜ | | |
| 1.8 | 主题画廊 | ⬜ | | |
| 2.1 | API 认证 | ⬜ | | |
| 2.2 | API 文章 CRUD | ⬜ | | |
| 2.3 | API 分类/标签 | ⬜ | | |
| 2.4 | API 用户 | ⬜ | | |
| 2.5 | API 搜索 | ⬜ | | |
| 3 | 管理员登录/登出 | ⬜ | | |
| 3.2 | 管理后台入口 | ⬜ | | |
| 3.3 | 登出流程 | ⬜ | | |
| 3.4 | 登录态过期 | ⬜ | | |
| 4.1 | 创建文章(所有 block 类型) | ⬜ | | |
| 4.2 | 编辑文章(内容完整性) | ⬜ | | |
| 4.3 | 删除文章 | ⬜ | | |
| 5.1 | JSON 导出 | ⬜ | | |
| 5.3 | 格式验证 | ⬜ | | |
| 5.4 | 导出→导入闭环 | ⬜ | | |
| 6 | 用户管理 | ⬜ | | |
| 7 | 评论系统 | ⬜ | | |
| 8 | 主题系统 | ⬜ | | |
| 9.1 | 认证保护 | ⬜ | | |
| 9.2 | CSRF | ⬜ | | |
| 9.3 | CORS | ⬜ | | |
| 9.4 | 输入验证 | ⬜ | | |
| 9.5 | 速率限制 | ⬜ | | |
| 10 | 媒体管理 | ⬜ | | |
| 11 | 版本控制 | ⬜ | | |
| 12 | 跨浏览器 | ⬜ | | |
| 13 | 性能/SEO | ⬜ | | |

---

## 快速冒烟测试（最小子集）

如果时间紧张，**至少完成这 15 步** 来验证核心功能：

1. ✅ 首页能打开 (200)
2. ✅ 博客列表能加载文章
3. ✅ 文章详情页代码块行号对齐（重点回归）
4. ✅ 登录功能正常
5. ✅ 管理后台可访问
6. ✅ 创建一篇包含代码块的新文章
7. ✅ 编辑一篇已有文章，保存后前端验证
8. ✅ 随机抽查 3 篇文章的 404 页面
9. ✅ 主题切换有效
10. ✅ API `/posts` 返回正确数据
11. ✅ API `/posts/{slug}` content_json 格式正确
12. ✅ 无 token 访问 admin API 被拒 (401)
13. ✅ 搜索功能返回结果
14. ✅ 导出 BlockNote JSON 格式验证通过
15. ✅ 暗色模式切换正常
