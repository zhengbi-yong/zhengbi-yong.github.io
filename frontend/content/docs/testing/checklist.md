---
title: "预期: 404 (或重定向到 404 页)"
---

1. ✅ 首页能打开 (200)
2. ✅ 博客列表能加载文章
3. ✅ 文章详情页代码块行号对齐 — 已修复 (mdx/CodeBlock.tsx pre 添加 m-0 font-mono)
4. ✅ 登录功能正常
5. ✅ 管理后台可访问
6. ✅ 创建一篇包含代码块的新文章
7. ✅ ODrive 文章编辑器加载 — 已修复 (blockquote→paragraph, 62 blocks/16 articles)
8. ✅ 404 页面 — 访问不存在的文章 /blog/nonexistent-slug 显示 404
9. ✅ 主题切换有效
10. ✅ API /posts 返回正确数据 — curl http://127.0.0.1:3000/api/v1/posts?per_page=3
11. ✅ API /posts/{slug} content_json 格式正确 — curl http://127.0.0.1:3000/api/v1/posts/{slug} | jq '.content_json | type'
12. ✅ 无 token 访问 admin API 被拒 (401) — curl http://127.0.0.1:3000/api/v1/admin/posts
13. ✅ 搜索功能 — 已修复 (search.rs SELECT DISTINCT → GROUP BY)
14. ✅ MDX 导出 — 已修复 (posts-manage URL 改为相对路径 /api/v1/...)
15. ✅ 暗色模式切换正常

---
## 测试命令参考

### 8. 随机抽查 3 篇文章的 404 页面
```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/blog/nonexistent-slug-123
# 预期: 404 (或重定向到 404 页)
```

### 10. API /posts 返回正确数据
```bash
curl -s 'http://127.0.0.1:3000/api/v1/posts?per_page=3' | jq '.posts | length'
# 预期: 3 (或实际返回数量)
```

### 11. API /posts/{slug} content_json 格式正确
```bash
SLUG="odrive-高性能电机控制器-从原理到实践-2024-2025更新版"
ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$SLUG'))")
curl -s "http://127.0.0.1:3000/api/v1/posts/$ENCODED" | jq '{type: (.content_json | type), blocks: (.content_json | length)}'
# 预期: type="array"，blocks > 0
```

### 12. 无 token 访问 admin API 被拒 (401)
```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/v1/admin/posts
# 预期: 401
```

### 搜索功能验证
```bash
# 搜索建议
curl -s 'http://127.0.0.1:3000/api/v1/search/suggest?q=py'

# 全文搜索
curl -s 'http://127.0.0.1:3000/api/v1/search?q=docker' | jq '.total'
```

### MDX 导出验证
```bash
# 先登录获取 token
TOKEN=$(curl -s -X POST http://127.0.0.1:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"xK9#mP2$vL8@nQ5*wR4"}' | jq -r '.access_token')

# 获取文章 UUID（从管理后台或数据库查询）
# 然后调用导出 API
curl -s "http://127.0.0.1:3000/api/v1/admin/posts/{UUID}/export/mdx" \
  -H "Authorization: Bearer $TOKEN" | jq '{slug, mdx_length: (.mdx | length)}'
```
