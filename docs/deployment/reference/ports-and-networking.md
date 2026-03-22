# Ports and Networking / 端口和网络

Understanding network topology, port mappings, and firewall configuration.
/ 理解网络拓扑、端口映射和防火墙配置。

---

## 📋 Overview / 概述

The blog platform uses a multi-container architecture with specific network requirements. This document explains the network topology, port mappings, and security considerations.
/ 博客平台使用具有特定网络要求的多容器架构。本文档解释网络拓扑、端口映射和安全注意事项。

---

## 🌐 Network Architecture / 网络架构

### High-Level Network Diagram / 高层网络图

```
Internet (Public)
        │
        │ HTTPS :443 / HTTP :80
        ▼
┌─────────────────────────────────────────┐
│           Nginx (Reverse Proxy)          │
│           Public IP / Domain             │
│  ┌────────────────────────────────────┐  │
│  │  SSL/TLS Termination (:443)        │  │
│  │  HTTP to HTTPS Redirect (:80)      │  │
│  │  Static File Serving               │  │
│  │  Load Balancing                    │  │
│  └────────────────────────────────────┘  │
└────────────────┬──────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌─────────┐             ┌──────────┐
│Frontend │             │ Backend  │
│Next.js  │◄───────────►│  Axum    │
│ :3001   │  API Calls  │  :3000   │
└────┬────┘             └─────┬────┘
     │                        │
     │                        │
     ▼                        ▼
┌─────────────────────────────────────────┐
│        Docker Internal Network          │
│                                         │
│  ┌────────────┐              ┌────────┐│
│  │ PostgreSQL │              │ Redis  ││
│  │   :5432    │              │  :6379 ││
│  └────────────┘              └────────┘│
└─────────────────────────────────────────┘
```

---

## 🔌 Port Reference / 端口参考

### Public Ports (External) / 公网端口（外部）

| Port / 端口 | Protocol / 协议 | Service / 服务 | Purpose / 用途 | Required / 必需 |
|-----------|----------------|--------------|--------------|---------------|
| **80** | HTTP | Nginx | HTTP (redirects to HTTPS) | ✅ Yes (for HTTP redirect) |
| **443** | HTTPS | Nginx | HTTPS (main traffic) | ✅ Yes |
| **22** | SSH | SSHD | Server administration | ✅ Yes (for management) |

**Note / 注意**: In the production Compose stack, only the edge proxy is public by default. Backend, frontend, PostgreSQL, Redis, Mailpit, Meilisearch, and MinIO bind to `127.0.0.1` unless you explicitly override their `*_BIND_HOST` values. / 在生产 Compose 栈中，默认只有边缘代理对外公开。后端、前端、PostgreSQL、Redis、Mailpit、Meilisearch 和 MinIO 默认绑定到 `127.0.0.1`，除非你显式覆写对应的 `*_BIND_HOST`。

### Internal Ports (Docker Network) / 内部端口（Docker网络）

| Port / 端口 | Service / 服务 | Internal Access / 内部访问 | External Access / 外部访问 |
|-----------|--------------|-------------------------|-------------------------|
| **3000** | Backend (Axum) | Docker containers only / 仅Docker容器 | Optional (development) / 可选（开发） |
| **3001** | Frontend (Next.js) | Docker + Nginx / Docker + Nginx | Optional (development) / 可选（开发） |
| **5432** | PostgreSQL | Docker containers only / 仅Docker容器 | ❌ No / 否 |
| **6379** | Redis | Docker containers only / 仅Docker容器 | ❌ No / 否 |

### Bind Host Defaults / 默认绑定地址

| Variable | Default | Meaning |
|---|---|---|
| `EDGE_BIND_HOST` | `0.0.0.0` | Edge proxy is reachable from outside the host |
| `FRONTEND_BIND_HOST` | `127.0.0.1` | Frontend direct port is host-local by default |
| `BACKEND_BIND_HOST` | `127.0.0.1` | Backend direct port is host-local by default |
| `POSTGRES_BIND_HOST` | `127.0.0.1` | PostgreSQL is not published publicly |
| `REDIS_BIND_HOST` | `127.0.0.1` | Redis is not published publicly |
| `MEILISEARCH_BIND_HOST` | `127.0.0.1` | Meilisearch is not published publicly |
| `MINIO_BIND_HOST` | `127.0.0.1` | MinIO API and console are not published publicly |
| `MAILPIT_BIND_HOST` | `127.0.0.1` | Mailpit SMTP and UI are not published publicly |

This makes the default single-host deployment safer while still allowing SSH-based access for maintenance and debugging.

### Development Ports / 开发端口

| Port / 端口 | Service / 服务 | Purpose / 用途 |
|-----------|--------------|--------------|
| **3000** | Backend | Direct API access (development) / 直接API访问（开发） |
| **3001** | Frontend | Direct frontend access (development) / 直接前端访问（开发） |
| **5432** | PostgreSQL | Direct database access (development) / 直接数据库访问（开发） |
| **6379** | Redis | Direct cache access (development) / 直接缓存访问（开发） |

---

## 🔥 Firewall Configuration / 防火墙配置

### UFW (Uncomplicated Firewall) / UFW防火墙

**Enable UFW / 启用UFW**:
```bash
# Check status
sudo ufw status

# Enable firewall
sudo ufw enable

# Set default rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

**Allow Required Ports / 允许必需端口**:
```bash
# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp
sudo ufw allow 22/tcp comment 'SSH access'

# Allow HTTP
sudo ufw allow 80/tcp comment 'HTTP'

# Allow HTTPS
sudo ufw allow 443/tcp comment 'HTTPS'

# Optional staging/canary edge port
sudo ufw allow 18080/tcp comment 'Staging edge'

# Check rules
sudo ufw status numbered
```

**Example Output / 示例输出**:
```
Status: active

     To                         Action      From
     --                         ------      ----
[ 1] 22/tcp                     ALLOW IN    Anywhere                   (SSH)
[ 2] 80/tcp                     ALLOW IN    Anywhere                   (HTTP)
[ 3] 443/tcp                    ALLOW IN    Anywhere                   (HTTPS)
[ 4] 18080/tcp                  ALLOW IN    Anywhere                   (Staging)
```

**Deny Specific Ports (Optional) / 拒绝特定端口（可选）**:
```bash
# Explicitly deny database ports
sudo ufw deny 5432/tcp comment 'PostgreSQL'
sudo ufw deny 6379/tcp comment 'Redis'
```

**Delete Rules / 删除规则**:
```bash
# Delete by number
sudo ufw delete 1

# Delete by rule
sudo ufw delete allow 80/tcp
```

### iptables / iptables防火墙

**View Rules / 查看规则**:
```bash
# List all rules
sudo iptables -L -n -v

# List with line numbers
sudo iptables -L -n -v --line-numbers

# List NAT rules
sudo iptables -t nat -L -n -v
```

**Add Rules / 添加规则**:
```bash
# Allow SSH
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT

# Allow HTTPS
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow established connections
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Drop everything else
sudo iptables -A INPUT -j DROP
```

**Save Rules / 保存规则**:
```bash
# Ubuntu/Debian
sudo apt install iptables-persistent
sudo netfilter-persistent save

# RHEL/CentOS
sudo service iptables save
```

### firewalld (RHEL/CentOS) / firewalld防火墙

```bash
# Check status
sudo firewall-cmd --state

# List active zones
sudo firewall-cmd --get-active-zones

# List open ports
sudo firewall-cmd --list-ports

# Allow HTTP
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-port=80/tcp

# Allow HTTPS
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=443/tcp

# Reload firewall
sudo firewall-cmd --reload

# Remove port
sudo firewall-cmd --permanent --remove-port=80/tcp
sudo firewall-cmd --reload
```

### Cloud Provider Firewalls / 云提供商防火墙

**DigitalOcean (Cloud Firewalls)**:
- Go to Networking → Firewalls
- Create inbound rules:
  - SSH: Port 22, Your IP (or all for now)
  - HTTP: Port 80, All IPv4
  - HTTPS: Port 443, All IPv4
- Apply to droplet(s)

**AWS (Security Groups)**:
- Go to EC2 → Security Groups
- Inbound rules:
  - Type: SSH, Port: 22, Source: Your IP
  - Type: HTTP, Port: 80, Source: 0.0.0.0/0
  - Type: HTTPS, Port: 443, Source: 0.0.0.0/0

**Linode (Cloud Firewalls)**:
- Go to Firewalls
- Add rules:
  - SSH: Port 22, All IPs (or your IP)
  - HTTP: Port 80, All IPv4
  - HTTPS: Port 443, All IPv4

---

## 🐳 Docker Networking / Docker网络

### Default Network / 默认网络

```bash
# List Docker networks
docker network ls

# Inspect default network
docker network inspect zhengbi-yong_default

# View network details
docker network inspect --format='{{range .Containers}}{{.Name}}{{end}}' zhengbi-yong_default
```

**Network Topology / 网络拓扑**:
```
zhengbi-yong_default (bridge network)
├── frontend (container IP: 172.18.0.2)
├── backend (container IP: 172.18.0.3)
├── postgres (container IP: 172.18.0.4)
├── redis (container IP: 172.18.0.5)
└── nginx (container IP: 172.18.0.6)
```

### Container Communication / 容器通信

**Docker Internal DNS / Docker内部DNS**:
```bash
# Containers can reach each other by service name
# Frontend → Backend
http://backend:3000

# Backend → PostgreSQL
postgresql://postgres:5432/blog_db

# Backend → Redis
redis://redis:6379
```

**Test Connectivity / 测试连接**:
```bash
# From frontend container
docker compose exec frontend ping -c 2 backend

# From backend container
docker compose exec backend ping -c 2 postgres
docker compose exec backend ping -c 2 redis

# Check DNS resolution
docker compose exec frontend nslookup backend
```

### Port Mappings / 端口映射

**Docker Compose Port Mapping / Docker Compose端口映射**:
```yaml
# docker-compose.yml
services:
  nginx:
    ports:
      - "80:80"    # Host:Container
      - "443:443"

  frontend:
    ports:
      - "3001:3000"  # Expose on host port 3001
    # OR (no host mapping, internal only)
    expose:
      - "3000"

  backend:
    expose:
      - "3000"    # Internal only (no host access)

  postgres:
    # No ports exposed - internal only
```

**Verify Port Mappings / 验证端口映射**:
```bash
# Check all port mappings
docker compose ps

# Check specific container
docker port <container_name>

# Check listening ports inside container
docker compose exec backend netstat -tuln

# Check from host
netstat -tuln | grep -E '3000|3001|80|443'
```

---

## 🔒 Security Best Practices / 安全最佳实践

### Network Isolation / 网络隔离

**✅ DO / 要做**:
- ✅ Keep database ports (5432, 6379) internal only / 仅在内部保留数据库端口
- ✅ Use reverse proxy (Nginx) for public access / 使用反向代理（Nginx）进行公网访问
- ✅ Enable firewall rules / 启用防火墙规则
- ✅ Use separate networks for different services / 为不同的服务使用独立的网络

**❌ DON'T / 不要做**:
- ❌ Expose database ports to public internet / 将数据库端口暴露到公网
- ❌ Expose backend API directly (use Nginx) / 直接暴露后端API（使用Nginx）
- ❌ Allow all traffic in firewall / 在防火墙中允许所有流量

### Hardening Firewall / 加固防火墙

**Additional Rules / 附加规则**:
```bash
# Rate limiting for SSH (prevent brute force)
sudo ufw limit 22/tcp

# Allow only specific IP for SSH (more secure)
sudo ufw allow from YOUR_IP to any port 22

# Block common attack ports
sudo ufw deny 23/tcp    # Telnet
sudo ufw deny 25/tcp    # SMTP (if not running mail server)
```

### SSL/TLS Configuration / SSL/TLS配置

**Nginx Configuration / Nginx配置**:
```nginx
# Force HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
}
```

---

## 🔍 Troubleshooting Networking / 网络故障排查

### Port Already in Use / 端口已被占用

**Problem / 问题**:
```
Error: bind: address already in use
```

**Solutions / 解决方案**:
```bash
# Find process using port (Linux/Mac)
sudo lsof -i :80
sudo lsof -i :3000

# Find process using port (Windows)
netstat -ano | findstr :80
netstat -ano | findstr :3000

# Kill process
kill -9 <PID>  # Linux/Mac
taskkill /F /PID <PID>  # Windows

# Or stop Docker container using port
docker ps | grep <port>
docker stop <container_name>
```

### Container Cannot Reach Another / 容器无法到达另一个

**Problem / 问题**: Backend cannot connect to database

**Solutions / 解决方案**:
```bash
# Check both containers are running
docker compose ps

# Check network connectivity
docker compose exec backend ping -c 2 postgres

# Check DNS resolution
docker compose exec backend nslookup postgres

# Check if service is listening
docker compose exec postgres netstat -tuln | grep 5432

# Check Docker network
docker network inspect zhengbi-yong_default

# Restart network
docker compose down
docker compose up -d
```

### Firewall Blocking Connection / 防火墙阻止连接

**Problem / 问题**: Cannot access site from public

**Solutions / 解决方案**:
```bash
# Check firewall status
sudo ufw status

# Check if port is allowed
sudo ufw status | grep 80

# Temporarily disable firewall (testing only)
sudo ufw disable

# Test connection
curl http://your-server-ip

# Re-enable firewall
sudo ufw enable

# Add missing rule
sudo ufw allow 80/tcp
```

### SSL Certificate Issues / SSL证书问题

**Problem / 问题**: HTTPS not working

**Solutions / 解决方案**:
```bash
# Check if port 443 is open
sudo ufw status | grep 443
netstat -tuln | grep 443

# Check Nginx configuration
docker compose exec nginx nginx -t

# Check SSL certificates
docker compose exec nginx ls -la /etc/nginx/ssl/

# Renew Let's Encrypt certificate
sudo certbot renew

# Restart Nginx
docker compose restart nginx
```

---

## 📊 Network Performance / 网络性能

### Check Network Latency / 检查网络延迟

```bash
# Ping test
ping -c 4 yourdomain.com

# Measure HTTP response time
curl -o /dev/null -s -w "%{time_total}\n" https://yourdomain.com

# Check DNS resolution time
time nslookup yourdomain.com

# Trace route
traceroute yourdomain.com
```

### Monitor Network Traffic / 监控网络流量

```bash
# Real-time monitoring
iftop

# Connection monitoring
sudo nethogs

# Docker container network stats
docker stats

# Detailed network stats
sudo iptables -L -v -n
```

---

## 📖 Related Documentation / 相关文档

- [Architecture Overview](../concepts/architecture.md) - System architecture
- [Compose Production Stack](../guides/compose/production-stack.md) - Canonical single-host networking
- [System Nginx Cutover](../guides/server/system-nginx-cutover.md) - Host nginx networking model
- [Security Best Practices](../best-practices/security.md) - Security hardening
- [Commands Reference](./commands.md) - Network commands

---

## ❓ FAQ / 常见问题

### Q: Can I change the ports? / 可以更改端口吗？

**A / 答**: Yes, but requires configuration changes in multiple places (Docker Compose, Nginx, firewall). Generally not recommended unless necessary. / 可以，但需要在多个地方更改配置（Docker Compose、Nginx、防火墙）。通常不建议，除非必要。

### Q: Do I need to open port 22 to everyone? / 需要向所有人开放22端口吗？

**A / 答**: No. For better security, restrict to your IP only: / 不可以。为了更好的安全性，仅限制为您的IP：
```bash
sudo ufw allow from YOUR_IP to any port 22
```

### Q: Why are database ports not exposed? / 为什么数据库端口不暴露？

**A / 答**: Security best practice. Database should only be accessible from backend container within Docker network. / 安全最佳实践。数据库应该只能从Docker网络内的后端容器访问。

---

**Version**: 2.0 (World-Class Deployment Documentation)
**Last Updated**: 2026-01-01
**Maintained By**: Deployment Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)
