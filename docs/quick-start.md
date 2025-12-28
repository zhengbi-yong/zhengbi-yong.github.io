# 快速开始指南

本指南帮助您在5分钟内完成博客系统的Docker部署。

## 📋 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 2GB+ 内存
- 20GB+ 磁盘空间
- 端口 80, 443, 3000, 3001, 5432, 6379 可用

## 🚀 三步部署

### 步骤1: 克隆项目

```bash
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io
```

### 步骤2: 配置系统

```bash
# Linux/macOS
chmod +x scripts/deploy.sh
./scripts/deploy.sh --auto-cleanup

# Windows
python scripts/deploy.py --auto-cleanup
```

**该脚本会自动：**
- ✅ 检查环境依赖
- ✅ 生成安全密钥
- ✅ 检查并清理端口占用
- ✅ 拉取Docker镜像
- ✅ 构建应用镜像
- ✅ 启动所有服务
- ✅ 验证部署状态

### 步骤3: 访问应用

打开浏览器访问：
- **前端**: http://localhost 或 http://your-server-ip
- **后端API**: http://localhost:3000/v1/
- **管理面板**: http://localhost:3000/admin/

## ⚙️ 自定义配置

### 修改域名

编辑 `config.yml`：

```yaml
domain:
  main: your-domain.com
  server_ip: your-server-ip
```

重新部署：
```bash
./scripts/deploy.sh --rebuild
```

### 配置SSL

```bash
# 1. 获取SSL证书
sudo certbot certonly --standalone -d your-domain.com

# 2. 复制证书
sudo cp /etc/letsencrypt/live/your-domain.com/*.pem nginx/ssl/

# 3. 更新config.yml
nano config.yml
# 设置: ssl.enabled: true, domain.force_https: true

# 4. 重新部署
./scripts/deploy.sh --rebuild
```

### 调整性能

编辑 `config.yml` 中的资源限制：

```yaml
resources:
  backend:
    cpu_limit: "4"      # 增加CPU
    memory_limit: "4G"  # 增加内存
```

## 📊 常用命令

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 更新代码
git pull && ./scripts/deploy.sh --rebuild
```

## 🔍 故障排查

### 端口被占用

```bash
# 自动清理
python3 scripts/config-manager.py cleanup-ports

# 手动清理
sudo lsof -i :3000  # 查看占用
sudo kill -9 <PID>  # 终止进程
```

### 服务启动失败

```bash
# 查看详细日志
docker compose logs backend
docker compose logs frontend

# 重新构建
./scripts/deploy.sh --rebuild
```

### 数据库连接失败

```bash
# 检查数据库状态
docker compose exec postgres pg_isready

# 重启数据库
docker compose restart postgres
```

## 📚 更多文档

- [完整配置指南](configuration/config-guide.md)
- [Docker部署文档](deployment/docker.md)
- [故障排查](troubleshooting.md)

## 💡 提示

1. **首次部署**可能需要10-15分钟（下载镜像）
2. **生产环境**务必配置SSL证书
3. 定期**备份数据库**（`./scripts/backup.sh`）
4. 关注**资源使用**（`docker stats`）

---

**需要帮助?** → 查看 [完整文档](deployment/docker.md) 或提交 [Issue](https://github.com/zhengbi-yong/zhengbi-yong.github.io/issues)
