# 常见问题

本文档汇总了项目中常见的疑问和解决方案。

## 目录

- [快速开始](#快速开始)
- [开发问题](#开发问题)
- [部署问题](#部署问题)
- [功能使用](#功能使用)
- [技术问题](#技术问题)

---

## 快速开始

### Q: 如何快速启动项目？

**A**: 按照 [快速开始指南](../getting-started/quick-start.md) 操作：

```bash
# 前端
cd frontend
pnpm install
pnpm dev

# 后端
cd backend
./scripts/deployment/deploy.sh dev
```

### Q: 需要安装哪些软件？

**A**: 必需软件：
- Node.js 20+ 和 pnpm
- Rust 1.70+ 和 Cargo
- Docker 和 Docker Compose

详见 [安装指南](../getting-started/installation.md)。

### Q: 如何配置环境变量？

**A**: 参考 [环境配置指南](../getting-started/environment-setup.md)。

前端配置文件：`frontend/.env.local`
后端配置文件：`backend/.env`

---

## 开发问题

### Q: 前端构建失败怎么办？

**A**: 常见解决方案：

```bash
# 1. 清理缓存
rm -rf .next node_modules/.cache

# 2. 重新安装依赖
pnpm install

# 3. 重新构建
pnpm build
```

详见 [故障排查指南](../getting-started/troubleshooting.md)。

### Q: 后端无法启动？

**A**: 检查以下几点：

1. **数据库是否运行**:
```bash
docker ps | grep postgres
```

2. **环境变量是否正确**:
```bash
echo $DATABASE_URL
echo $REDIS_URL
```

3. **端口是否被占用**:
```bash
# 检查 3000 端口
lsof -ti:3000
```

详见 [后端故障排查](../development/operations/troubleshooting-guide.md#后端问题)。

### Q: 如何运行测试？

**A**:
```bash
# 前端测试
cd frontend
pnpm test

# 后端测试
cd backend
cargo test
```

详见：
- [前端测试指南](../development/frontend/testing.md)
- [后端测试指南](../development/backend/testing.md)

### Q: 如何添加新的博客文章？

**A**: 按照 [写作指南](../guides/writing-guide.md) 创建 MDX 文件：

1. 在 `frontend/data/blog/` 创建文件
2. 使用 frontmatter 配置元数据
3. 使用 Markdown 编写内容
4. 可以使用 React 组件

---

## 部署问题

### Q: 如何部署到 GitHub Pages？

**A**:

```bash
cd frontend
EXPORT=1 BASE_PATH=/repo-name pnpm build
```

详见 [部署指南](../deployment/README.md)。

### Q: 如何部署到生产服务器？

**A**: 按照 [自动化 Compose 部署指南](../deployment/guides/server/automated-compose-deploy.md) 操作：

1. 准备服务器
2. 安装 Docker
3. 配置 Nginx
4. 获取 SSL 证书
5. 部署应用

### Q: 如何配置 HTTPS？

**A**: 使用 Let's Encrypt 免费证书：

```bash
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d yourdomain.com
```

详见 [System Nginx Cutover](../deployment/guides/server/system-nginx-cutover.md)。

### Q: 如何实现高可用部署？

**A**: 参考 [Kubernetes Base](../deployment/guides/kubernetes/base.md)：

- 负载均衡
- 数据库主从复制
- Redis 高可用
- 自动故障转移

---

## 功能使用

### Q: 如何使用 Refine 管理后台？

**A**: 详见 [Refine 集成指南](../development/frontend/refine-integration.md)。

基本使用：
```typescript
import { useList, useUpdate, useDelete } from '@refinedev/core'

const { data } = useList({
  resource: 'admin/users',
  pagination: { current: 1, pageSize: 20 },
})
```

### Q: 评论系统如何工作？

**A**: 评论系统支持：
- 嵌套评论（最多 5 层）
- Markdown 格式
- 评论审核
- 点赞功能

详见 [组件参考 - 评论系统](../development/components-reference.md#评论系统)。

### Q: 如何配置搜索功能？

**A**: 项目默认使用 Kbar 搜索。

配置：
```typescript
// siteMetadata.ts
search: {
  provider: 'kbar',
  kbarConfig: {
    searchDocumentsPath: 'search.json'
  }
}
```

快捷键：`Cmd/Ctrl + K`

### Q: 如何使用 3D 组件？

**A**: 在 MDX 中导入组件：

```mdx
import { ThreeViewer } from '@/components/3d/ThreeViewer'

<ThreeViewer
  modelPath="/models/robot.glb"
  width="100%"
  height={500}
/>
```

详见 [组件参考 - 3D 可视化](../development/components-reference.md#3d-可视化)。

---

## 技术问题

### Q: 为什么选择 Next.js？

**A**: Next.js 提供：
- 服务器端渲染（SEO 友好）
- 静态生成（性能优秀）
- 文件系统路由
- API 路由
- 丰富的生态系统

### Q: 为什么选择 Rust 后端？

**A**: Rust 提供：
- 内存安全
- 高性能
- 并发安全
- 类型安全
- 强大的生态系统（Axum, SQLx）

### Q: 为什么使用 PostgreSQL？

**A**: PostgreSQL 提供：
- ACID 事务
- 复杂查询支持
- 全文搜索
- JSON 支持
- 可靠性高

### Q: 为什么使用 Redis？

**A**: Redis 提供：
- 高性能缓存
- 数据结构丰富
- 持久化选项
- 高可用支持

### Q: 如何监控应用性能？

**A**: 使用多种工具：

1. **前端性能**:
   - Lighthouse
   - Core Web Vitals

2. **后端性能**:
   - Prometheus + Grafana
   - 日志分析

详见 [性能监控指南](../development/operations/performance-monitoring.md)。

---

## 安全问题

### Q: 如何保护 API？

**A**: 多层安全措施：

1. **JWT 认证**
2. **速率限制**
3. **CORS 配置**
4. **输入验证**
5. **SQL 注入防护**

详见 [安全指南](../development/operations/security-guide.md)。

### Q: 密码如何存储？

**A**: 使用 Argon2 哈希算法：

- 抗 GPU 破解
- 内存硬哈希
- 可调整的工作因子

```rust
let hash = hash_password(password)?;
let is_valid = verify_password(password, &hash)?;
```

### Q: 如何防止 CSRF 攻击？

**A**:
1. SameSite Cookie
2. CSRF Token
3. 验证 Origin 头

详见 [安全指南 - Web 安全](../development/operations/security-guide.md#web-安全)。

---

## 性能问题

### Q: 如何优化前端性能？

**A**:

1. **代码分割**
2. **懒加载**
3. **图片优化**
4. **缓存策略**

详见 [性能监控 - 前端性能](../development/operations/performance-monitoring.md#前端性能监控)。

### Q: 如何优化后端性能？

**A**:

1. **数据库索引**
2. **连接池**
3. **Redis 缓存**
4. **查询优化**

详见 [性能监控 - 后端性能](../development/operations/performance-monitoring.md#后端性能监控)。

---

## 故障排查

### Q: 数据库连接失败？

**A**: 检查步骤：

```bash
# 1. 确认数据库运行
docker ps | grep postgres

# 2. 检查连接字符串
echo $DATABASE_URL

# 3. 测试连接
psql $DATABASE_URL
```

详见 [数据库问题故障排查](../development/operations/troubleshooting-guide.md#数据库问题)。

### Q: Redis 连接失败？

**A**:

```bash
# 检查 Redis 运行
docker ps | grep redis

# 测试连接
redis-cli ping
```

详见 [Redis 问题](../development/operations/troubleshooting-guide.md#redis-问题)。

### Q: 如何查看日志？

**A**:

```bash
# 前端日志
tail -f logs/frontend.log

# 后端日志
tail -f logs/backend.log

# Docker 日志
docker-compose logs -f
```

详见 [诊断工具](../development/operations/troubleshooting-guide.md#诊断工具)。

---

## 贡献问题

### Q: 如何贡献代码？

**A**: 按照 [开发最佳实践](../development/best-practices.md)：

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 开启 Pull Request

### Q: 代码风格要求？

**A**: 遵循项目规范：

- **TypeScript**: ESLint + Prettier
- **Rust**: rustfmt + Clippy
- **提交信息**: Conventional Commits

详见 [代码风格](../development/best-practices.md#代码风格)。

---

## 更多帮助

### Q: 文档中没有找到答案？

**A**:

1. 查看 [术语表](./glossary.md)
2. 查看 [故障排查指南](../getting-started/troubleshooting.md)
3. 提交 [GitHub Issue](https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues)

### Q: 如何联系项目维护者？

**A**:

- **GitHub Issues**: https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues
- **Email**: 见项目主页

---

## 相关文档

- [快速开始](../getting-started/quick-start.md) - 5 分钟启动项目
- [故障排查](../getting-started/troubleshooting.md) - 常见问题解决
- [最佳实践](../development/best-practices.md) - 开发规范
- [API 参考](../development/backend/api-reference.md) - API 文档

---

**最后更新**: 2025-12-27
**维护者**: Documentation Team
