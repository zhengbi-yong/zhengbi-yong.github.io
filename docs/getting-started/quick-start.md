# 快速开始

本指南将帮助你在 5 分钟内启动博客平台。

## 前置要求

确保你的系统已安装以下工具：

- **Node.js** 20+ 和 **pnpm** (前端开发)
- **Rust** 1.70+ 和 **Cargo** (后端开发)
- **Docker** 和 **Docker Compose** (数据库)

## 三步启动

### 1️⃣ 克隆项目

```bash
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

### 2️⃣ 启动前端

```bash
cd frontend
pnpm install
pnpm dev
```

前端将在 **http://localhost:3001** 启动

### 3️⃣ 启动后端（可选）

如果需要完整的后端功能（用户认证、评论管理等）：

```bash
cd backend
./deploy.sh dev
# 等待数据库启动完成

export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
export REDIS_URL=redis://localhost:6379
cargo run --bin blog-api
```

后端 API 将在 **http://localhost:3000** 启动

## 验证安装

打开浏览器访问：

- **前端**: http://localhost:3001
- **API 文档** (如已启动后端): http://localhost:3000/swagger-ui/
- **健康检查**: http://localhost:3000/health

## 默认配置

### 开发环境端口

- 前端: `3001`
- 后端 API: `3000`
- PostgreSQL: `5432`
- Redis: `6379`

### 数据库默认账号

- **用户**: `blog_user`
- **密码**: `blog_password`
- **数据库**: `blog_db`

## 下一步

安装完成后，建议你：

1. 📖 阅读 [环境配置](environment-setup.md) 了解详细配置
2. ✍️ 查看 [内容管理](../guides/content-management.md) 学习如何创建文章
3. 🎨 探索 [写作指南](../guides/writing-guide.md) 了解 MDX 组件使用
4. 🚀 参考 [部署文档](../deployment/overview.md) 准备生产环境

## 常见问题

### 端口被占用

如果端口已被使用，可以修改：

**前端** (修改 `frontend/next.config.js`):
```javascript
module.exports = {
  // ...其他配置
}
```

环境变量：
```bash
export PORT=3002
```

**后端** (修改 `.env`):
```bash
PORT=3002
```

### Docker 相关问题

如果 Docker 数据库启动失败：

```bash
cd backend
./deploy.sh stop
./deploy.sh dev
```

### 依赖安装失败

**前端**:
```bash
rm -rf node_modules
pnpm install
```

**后端**:
```bash
cargo clean
cargo build
```

## 快速命令参考

### 前端

```bash
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm lint             # 运行代码检查
pnpm test             # 运行测试
```

### 后端

```bash
./deploy.sh dev       # 启动开发数据库
./deploy.sh prod      # 启动生产环境
./deploy.sh stop      # 停止所有服务
./deploy.sh status    # 查看服务状态
cargo run             # 运行 API 服务
cargo test            # 运行测试
```

## 获取帮助

如果遇到问题：

1. 查看 [故障排查](troubleshooting.md)
2. 搜索 [GitHub Issues](https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues)
3. 创建新 Issue 寻求帮助

---

**相关文档**:
- [安装指南](installation.md) - 详细的安装步骤
- [环境配置](environment-setup.md) - 环境变量配置
- [故障排查](troubleshooting.md) - 常见问题解决
