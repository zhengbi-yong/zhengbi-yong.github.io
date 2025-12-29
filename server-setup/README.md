# 服务器部署配置文件

此目录包含所有用于服务器部署的配置文件。

## 文件说明

### .env.production
生产环境变量配置文件。

**重要：在部署前必须修改以下配置：**

1. **服务器 IP 地址**
   ```env
   NEXT_PUBLIC_SITE_URL=http://152.136.43.194
   NEXT_PUBLIC_API_URL=http://152.136.43.194/api
   CORS_ALLOWED_ORIGINS=http://152.136.43.194,http://152.136.43.194:3001
   ```

2. **安全密钥**（必须修改为随机字符串！）
   ```env
   JWT_SECRET=<your-32-char-secret>
   PASSWORD_PEPPER=<your-32-char-secret>
   SESSION_SECRET=<your-32-char-secret>
   ```

### nginx.conf
Nginx 主配置文件，包含全局设置。

### site.conf
Nginx 站点配置文件，配置反向代理规则。

**需要修改：**
```nginx
server_name 152.136.43.194;  # 改为你的服务器 IP 或域名
```

## 使用方法

### 快速部署

使用项目根目录的部署脚本：

```bash
cd ..
./scripts/deploy-production.sh 152.136.43.194 ubuntu
```

### 手动部署

```bash
# 1. 上传配置文件到服务器
scp .env.production ubuntu@your-server:~/blog/.env
scp nginx.conf ubuntu@your-server:~/blog/nginx.conf
scp site.conf ubuntu@your-server:~/blog/site.conf

# 2. 在服务器上应用配置
ssh ubuntu@your-server

# 配置 Nginx
sudo cp ~/blog/site.conf /etc/nginx/sites-available/default
sudo nginx -t
sudo systemctl reload nginx

# 启动服务
cd ~/blog
docker compose up -d
```

## 配置说明

### Nginx 反向代理

当前配置：
- `/` → 转发到前端 (http://localhost:3001)
- `/api` → 转发到后端 API (http://localhost:3000)

### 环境变量

关键变量说明：

| 变量 | 说明 | 示例 |
|------|------|------|
| `NEXT_PUBLIC_API_URL` | 前端访问后端的 URL | `http://152.136.43.194/api` |
| `NEXT_PUBLIC_SITE_URL` | 站点 URL | `http://152.136.43.194` |
| `CORS_ALLOWED_ORIGINS` | CORS 允许的来源 | `http://152.136.43.194,http://152.136.43.194:3001` |

## 安全建议

1. 生成新的安全密钥：
   ```bash
   # 使用 openssl 生成随机密钥
   openssl rand -hex 32
   ```

2. 修改数据库密码

3. 配置 HTTPS（使用 Let's Encrypt）

4. 限制防火墙规则

## 故障排查

### CORS 错误

确保 `CORS_ALLOWED_ORIGINS` 包含所有访问源：
- 如果通过 80 端口访问：`http://your-ip`
- 如果直接访问前端：`http://your-ip:3001`

### API 请求失败

1. 检查 `NEXT_PUBLIC_API_URL` 是否正确
2. 确认 Nginx 配置中的 `/api` 路由
3. 查看后端日志：`docker compose logs backend`

### 生成随机密钥

```bash
# JWT 密钥
openssl rand -hex 32

# Password Pepper
openssl rand -hex 32

# Session Secret
openssl rand -hex 32
```
