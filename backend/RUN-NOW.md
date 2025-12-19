# 立即运行 Blog Backend

由于 Docker 权限问题，我们提供几种方法来运行后端：

## 方法 1：使用离线模式（最简单）

```bash
# 1. 进入项目目录
cd /home/sisyphus/zhengbi-yong.github.io/blog-backend

# 2. 使用离线模式编译和运行
SQLX_OFFLINE=true cargo run

# 或者在后台运行
SQLX_OFFLINE=true cargo run &
```

**优点**：不需要数据库连接就可以编译和运行
**缺点**：运行时仍需要数据库

## 方法 2：修复 Docker 权限

```bash
# 选项 A：重新登录（推荐）
# 注销并重新登录，docker 组权限会生效

# 选项 B：使用 newgrp 命令
newgrp docker
# 然后运行
docker compose up -d
```

## 方法 3：使用本地 PostgreSQL

```bash
# 1. 安装 PostgreSQL（如果还没有）
sudo apt update
sudo apt install postgresql postgresql-contrib

# 2. 启动 PostgreSQL
sudo systemctl start postgresql

# 3. 创建数据库和用户
sudo -u postgres createdb blog_db
sudo -u postgres createuser blog_user
sudo -u postgres psql -c "ALTER USER blog_user PASSWORD 'blog_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE blog_db TO blog_user;"

# 4. 运行应用
cd /home/sisyphus/zhengbi-yong.github.io/blog-backend
cargo run
```

## 方法 4：快速运行（推荐）

```bash
# 使用我们创建的快速启动脚本
cd /home/sisyphus/zhengbi-yong.github.io/blog-backend
./quick-start.sh

# 然后选择选项 3（离线模式）来编译
# 之后可以正常运行：
cargo run
```

## 访问 API

一旦服务器运行起来，你可以访问：

- **API 文档**: http://localhost:3000/swagger-ui/
- **健康检查**: http://localhost:3000/healthz
- **指标监控**: http://localhost:3000/metrics

## 常见问题

### 1. "Database connection refused"
数据库没有启动。使用方法 3 设置本地 PostgreSQL，或修复 Docker 权限。

### 2. "Permission denied" with Docker
你的用户需要重新登录才能使用 Docker：
```bash
# 记住要保存工作
logout
# 然后重新登录
```

### 3. "SQLx offline mode error"
确保设置了环境变量：
```bash
export SQLX_OFFLINE=true
cargo run
```

## 测试 API

使用 curl 测试 API：

```bash
# 健康检查
curl http://localhost:3000/healthz

# 查看指标
curl http://localhost:3000/metrics
```

## 下一步

1. 配置 `.env` 文件中的实际设置
2. 为生产环境设置适当的 CORS 源
3. 配置邮件设置（可选）
4. 设置监控和日志记录