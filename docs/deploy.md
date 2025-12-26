# 部署与维护完整指南

本文档是一份面向实践的完整教程，详细说明部署时需要做什么、为什么要这样做，以及日常维护的操作和意义。

## 目录

- [第一部分：部署教程](#第一部分部署教程)
  - [阶段一：单服务器部署](#阶段一单服务器部署)
  - [阶段二：双服务器高可用部署](#阶段二双服务器高可用部署)
  - [阶段三：小规模集群部署](#阶段三小规模集群部署)
  - [阶段四：中等规模部署](#阶段四中等规模部署)
  - [阶段五：世界级部署](#阶段五世界级部署)
- [第二部分：维护教程](#第二部分维护教程)
  - [日常检查](#日常检查)
  - [数据备份](#数据备份)
  - [性能优化](#性能优化)
  - [安全维护](#安全维护)
  - [故障处理](#故障处理)
  - [容量规划](#容量规划)
  - [成本优化](#成本优化)
  - [升级更新](#升级更新)
- [第三部分：常见场景](#第三部分常见场景)
- [第四部分：多项目管理](#第四部分多项目管理)
- [第五部分：服务器切换](#第五部分服务器切换)

---

## 第一部分：部署教程

### 阶段一：单服务器部署

**适用场景**：初创期、用户 < 1000、日 PV < 1万

#### 步骤1：准备服务器环境

**做什么**：
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git vim ufw fail2ban

# 创建专用用户
sudo useradd -m -s /bin/bash blogadmin
sudo usermod -aG sudo blogadmin
```

**为什么**：
- **更新系统**：修复已知安全漏洞，获得最新的功能支持
- **安装基础工具**：curl/wget用于下载，git用于代码管理，vim用于编辑，ufw用于防火墙，fail2ban用于防暴力破解
- **创建专用用户**：避免使用root用户操作，降低安全风险，权限隔离

#### 步骤2：安装Docker

**做什么**：
```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 将用户添加到docker组
sudo usermod -aG docker blogadmin

# 安装Docker Compose
sudo apt install -y docker-compose-plugin

# 验证安装
docker --version
docker compose version
```

**为什么**：
- **Docker容器化**：确保开发、测试、生产环境一致，避免"在我机器上能跑"问题
- **隔离性**：数据库和应用运行在独立容器中，互不影响
- **易迁移**：容器可以轻松在不同服务器间迁移
- **用户添加到docker组**：避免每次使用docker都需要sudo

#### 步骤3：配置防火墙

**做什么**：
```bash
# 设置默认策略
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 允许SSH（防止自己被锁在外面）
sudo ufw allow 22/tcp

# 允许HTTP和HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

**为什么**：
- **默认拒绝入站**：只开放明确需要的端口，其他端口全部关闭
- **允许SSH**：确保你还能远程连接服务器（重要！）
- **开放80/443**：让用户能通过HTTP/HTTPS访问网站
- **安全第一**：未配置防火墙的服务器会在几分钟内被扫描和攻击

#### 步骤4：部署数据库

**做什么**：
```bash
# 创建项目目录
mkdir -p ~/blog-system
cd ~/blog-system

# 创建docker-compose.yml
cat > docker-compose.yml << 'EOF'
services:
  postgres:
    image: postgres:16-alpine
    container_name: blog-postgres
    environment:
      POSTGRES_USER: blog_user
      POSTGRES_PASSWORD: $(openssl rand -base64 32)
      POSTGRES_DB: blog_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: blog-redis
    command: redis-server --appendonly yes --requirepass $(openssl rand -base64 32)
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
EOF

# 启动数据库
docker compose up -d

# 检查容器状态
docker ps
```

**为什么**：
- **PostgreSQL**：关系型数据库，存储文章、用户等核心数据，支持事务和复杂查询
- **Redis**：内存缓存，存储session和热点数据，大幅提升响应速度
- **随机密码**：避免使用默认密码被攻击，使用`openssl`生成强密码
- **数据卷挂载**：容器删除后数据不丢失，数据持久化存储
- **restart策略**：服务器重启后容器自动启动，无需手动干预
- **Alpine镜像**：体积小（约20MB），启动快，节省资源

#### 步骤5：初始化数据库

**做什么**：
```bash
# 复制迁移文件到服务器
cd ~/blog-system
mkdir -p migrations

# 执行迁移（按顺序执行）
docker exec -i blog-postgres psql -U blog_user -d blog_db < migrations/0001_initial.sql
docker exec -i blog-postgres psql -U blog_user -d blog_db < migrations/0002_add_tags.sql
docker exec -i blog-postgres psql -U blog_user -d blog_db < migrations/0003_add_views.sql
docker exec -i blog-postgres psql -U blog_user -d blog_db < migrations/0004_add_user_roles.sql
docker exec -i blog-postgres psql -U blog_user -d blog_db < migrations/0005_add_comment_likes.sql

# 创建管理员账户
docker exec -i blog-postgres psql -U blog_user -d blog_db << 'EOSQL'
INSERT INTO users (id, email, username, password_hash, profile, email_verified, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@yourdomain.com',
  'admin',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEmc0i',
  '{"bio": "系统管理员"}'::jsonb,
  true,
  'admin',
  NOW(),
  NOW()
);
EOSQL

# 验证数据
docker exec -it blog-postgres psql -U blog_user -d blog_db -c "SELECT email, username, role FROM users;"
```

**为什么**：
- **按顺序执行迁移**：数据库结构有依赖关系，必须按顺序创建表和字段
- **创建管理员**：首次部署需要管理员账户来登录后台管理
- **验证数据**：确保数据导入成功，没有语法错误
- **密码哈希**：使用bcrypt加密，即使数据库泄露也无法直接获取密码

#### 步骤6：部署后端应用

**做什么**：
```bash
# 克隆代码
cd ~/blog-system
git clone https://github.com/yourusername/your-repo.git backend

# 配置环境变量
cat > backend/.env << 'EOF'
DATABASE_URL=postgresql://blog_user:your_password@localhost:5432/blog_db
REDIS_URL=redis://://localhost:6379
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 24)
PASSWORD_PEPPER=$(openssl rand -base64 16)
HOST=0.0.0.0
PORT=3000
ENVIRONMENT=production
EOF

# 构建Rust应用（本地编译或使用预编译二进制）
cd backend
cargo build --release --bin api

# 创建systemd服务
sudo cat > /etc/systemd/system/blog-backend.service << 'EOF'
[Unit]
Description=Blog Backend API
After=network.target docker-compose.service

[Service]
Type=simple
User=blogadmin
WorkingDirectory=/home/blogadmin/blog-system/backend
Environment="RUST_LOG=info"
EnvironmentFile=/home/blogadmin/blog-system/backend/.env
ExecStart=/home/blogadmin/blog-system/backend/target/release/api
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
sudo systemctl daemon-reload
sudo systemctl start blog-backend
sudo systemctl enable blog-backend

# 检查状态
sudo systemctl status blog-backend
curl http://localhost:3000/health
```

**为什么**：
- **Rust编译**：编译后的二进制文件性能极高，无需运行时环境
- **环境变量**：将敏感信息（密钥、密码）与代码分离，避免泄露
- **随机密钥**：JWT_SECRET用于签名token，SESSION_SECRET用于加密session，必须随机生成且足够长
- **systemd服务**：
  - 自动重启：崩溃后自动恢复
  - 开机启动：服务器重启后自动运行
  - 日志管理：通过journalctl统一查看日志
- **After=network.target**：确保网络就绪后再启动
- **RestartSec=10**：连续崩溃时等待10秒再重启，避免快速循环重启

#### 步骤7：部署前端应用

**做什么**：
```bash
# 克隆代码
cd ~/blog-system
git clone https://github.com/yourusername/your-repo.git frontend

# 安装依赖
cd frontend
pnpm install

# 配置环境变量
cat > .env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SITE_NAME=我的博客
EOF

# 构建生产版本
pnpm build

# 创建systemd服务
sudo cat > /etc/systemd/system/blog-frontend.service << 'EOF'
[Unit]
Description=Blog Frontend
After=network.target

[Service]
Type=simple
User=blogadmin
WorkingDirectory=/home/blogadmin/blog-system/frontend
Environment="NODE_ENV=production"
Environment="PORT=3001"
Environment="HOSTNAME=0.0.0.0"
ExecStart=$(which pnpm) start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
sudo systemctl daemon-reload
sudo systemctl start blog-frontend
sudo systemctl enable blog-frontend

# 检查状态
sudo systemctl status blog-frontend
curl http://localhost:3001
```

**为什么**：
- **pnpm install**：安装项目依赖，锁定版本避免不一致
- **生产构建**：优化代码体积和性能，移除开发工具
- **分离部署**：前端和后端独立运行，可以单独扩展和更新
- **不同端口**：前端3001，后端3000，避免冲突

#### 步骤8：配置Nginx反向代理

**做什么**：
```bash
# 安装Nginx
sudo apt install -y nginx

# 创建站点配置
sudo cat > /etc/nginx/sites-available/blog << 'EOF'
# HTTP服务器（自动重定向到HTTPS）
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Let's Encrypt验证
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # 其他请求重定向到HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS服务器
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 前端
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location /_next/static/ {
        proxy_pass http://localhost:3001;
        proxy_cache_valid 200 7d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载Nginx
sudo systemctl reload nginx
```

**为什么**：
- **反向代理**：
  - 统一入口：前端和后端通过同一个域名访问
  - 隐藏端口：用户不需要知道3000/3001端口
  - SSL终结：统一处理HTTPS加密
- **HTTP重定向到HTTPS**：强制使用加密连接，保护用户数据
- **安全头**：
  - HSTS：强制浏览器只使用HTTPS
  - X-Frame-Options：防止点击劫持
  - X-Content-Type-Options：防止MIME类型混淆
- **proxy_set_header**：传递真实IP和协议给后端，用于日志和安全检查
- **静态文件缓存**：Next.js的静态文件可以缓存7天，减轻服务器压力
- **http2**：多路复用，提升性能

#### 步骤9：配置SSL证书

**做什么**：
```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 测试自动续期
sudo certbot renew --dry-run

# 查看定时任务
sudo systemctl status certbot.timer
```

**为什么**：
- **HTTPS加密**：防止数据被窃听和篡改，现代浏览器对HTTP网站标记为"不安全"
- **Let's Encrypt**：免费、自动化的SSL证书，降低成本
- **自动续期**：证书有效期90天，certbot会自动续期，避免证书过期导致网站无法访问
- **多域名**：同时为yourdomain.com和www.yourdomain.com申请证书

#### 步骤10：配置日志轮转

**做什么**：
```bash
# 创建日志轮转配置
sudo cat > /etc/logrotate.d/blog << 'EOF'
/home/blogadmin/blog-system/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 blogadmin blogadmin
    sharedscripts
    postrotate
        systemctl reload blog-backend > /dev/null 2>&1 || true
        systemctl reload blog-frontend > /dev/null 2>&1 || true
    endscript
}
EOF

# 测试配置
sudo logrotate -d /etc/logrotate.d/blog
```

**为什么**：
- **日志轮转**：防止日志文件无限增长占满磁盘
- **保留14天**：既能排查问题，又不会占用太多空间
- **压缩旧日志**：节省磁盘空间
- **postrotate**：轮转后通知应用重新打开日志文件

---

### 阶段二：双服务器高可用部署

**适用场景**：用户 1000-10000、日 PV 1-10万、需要高可用

#### 为什么要升级到双服务器？

**单服务器的问题**：
1. **单点故障**：服务器宕机后服务完全不可用
2. **性能瓶颈**：CPU、内存、磁盘都有限制
3. **维护困难**：升级时必须停机

**双服务器的优势**：
1. **高可用**：一台故障，另一台接管
2. **负载均衡**：两台分担请求，性能翻倍
3. **零停机维护**：轮流升级，用户无感知

#### 步骤1：准备第二台服务器

**做什么**：
```bash
# 在两台服务器上配置SSH密钥互信
ssh-keygen -t rsa -b 4096

# 将公钥复制到对方服务器
ssh-copy-id blogadmin@server1-ip
ssh-copy-id blogadmin@server2-ip

# 测试免密登录
ssh blogadmin@server1-ip
ssh blogadmin@server2-ip
```

**为什么**：
- **SSH互信**：服务器之间可以自动同步数据和配置，无需输入密码
- **自动化**：为后续的数据同步和故障切换做准备

#### 步骤2：配置Keepalived实现虚拟IP

**做什么**：
```bash
# 在两台服务器上安装keepalived
sudo apt install -y keepalived

# 在主服务器（MASTER）上配置
sudo cat > /etc/keepalived/keepalived.conf << 'EOF'
vrrp_script check_nginx {
    script "/usr/bin/systemctl is-active nginx"
    interval 2
    weight -20
}

vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 100
    advert_int 1

    authentication {
        auth_type PASS
        auth_pass your-secret-password
    }

    virtual_ipaddress {
        192.168.1.100/24
    }

    track_script {
        check_nginx
    }
}
EOF

# 在备用服务器（BACKUP）上配置
sudo cat > /etc/keepalived/keepalived.conf << 'EOF'
vrrp_script check_nginx {
    script "/usr/bin/systemctl is-active nginx"
    interval 2
    weight -20
}

vrrp_instance VI_1 {
    state BACKUP
    interface eth0
    virtual_router_id 51
    priority 90  # 优先级低于MASTER
    advert_int 1

    authentication {
        auth_type PASS
        auth_pass your-secret-password
    }

    virtual_ipaddress {
        192.168.1.100/24
    }

    track_script {
        check_nginx
    }
}
EOF

# 启动keepalived
sudo systemctl start keepalived
sudo systemctl enable keepalived

# 验证虚拟IP
ip addr show eth0
```

**为什么**：
- **虚拟IP（VIP）**：对外提供一个固定的IP地址，不管哪台服务器在运行
- **VRRP协议**：两台服务器之间通过心跳检测，主服务器故障时备用服务器自动接管VIP
- **优先级**：主服务器100，备用90，确保主服务器正常运行时持有VIP
- **健康检查**：定期检查Nginx是否运行，如果不正常则降低优先级，触发切换
- **advert_int 1**：每秒发送一次心跳，快速检测故障

#### 步骤3：配置PostgreSQL主从复制

**做什么**：
```bash
# === 主服务器配置 ===

# 修改postgresql.conf
sudo cat >> /etc/postgresql/16/main/postgresql.conf << 'EOF'
wal_level = replica
max_wal_senders = 3
wal_keep_size = 1GB
synchronous_commit = on
synchronous_standby_names = 'postgres-slave'
EOF

# 修改pg_hba.conf允许从服务器连接
sudo cat >> /etc/postgresql/16/main/pg_hba.conf << 'EOF'
host    replication     replicator      192.168.1.0/24      scram-sha-256
EOF

# 重启PostgreSQL
sudo systemctl restart postgresql

# 创建复制用户
sudo -u postgres psql << 'EOSQL'
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'replicator-password';
EOSQL

# === 从服务器配置 ===

# 停止PostgreSQL
sudo systemctl stop postgresql

# 清空数据目录
sudo rm -rf /var/lib/postgresql/16/main/*

# 使用pg_basebackup从主服务器同步数据
sudo -u postgres pg_basebackup \
    -h 主服务器IP \
    -D /var/lib/postgresql/16/main \
    -U replicator \
    -P \
    -R

# 启动PostgreSQL
sudo systemctl start postgresql

# 验证复制状态
sudo -u postgres psql -x -c "SELECT * FROM pg_stat_replication;"
```

**为什么**：
- **数据冗余**：主从数据库各有完整数据，主数据库故障时可以切换到从数据库
- **读写分离**：主数据库处理写操作，从数据库处理读操作，提升性能
- **wal_level = replica**：启用WAL日志，用于数据复制
- **pg_basebackup**：从主服务器完整复制数据到从服务器
- **流复制**：主数据库的更改实时传输到从数据库，延迟通常<1秒

#### 步骤4：配置Redis主从复制

**做什么**：
```bash
# === 主服务器配置 ===

# 修改redis.conf
sudo cat >> /etc/redis/redis.conf << 'EOF'
bind 0.0.0.0
requirepass your-redis-password
masterauth your-redis-password
EOF

# 重启Redis
sudo systemctl restart redis

# === 从服务器配置 ===

# 修改redis.conf
sudo cat >> /etc/redis/redis.conf << 'EOF'
bind 0.0.0.0
requirepass your-redis-password
masterauth your-redis-password
replicaof 主服务器IP 6379
EOF

# 重启Redis
sudo systemctl restart redis

# 验证复制状态
redis-cli -a your-redis-password INFO replication
```

**为什么**：
- **Redis复制**：主Redis的写入会同步到从Redis，数据保持一致
- **Session冗余**：用户登录状态在两台Redis上都有，一台故障不影响用户
- **读写分离**：应用可以从从Redis读取，减轻主Redis压力

#### 步骤5：配置Nginx负载均衡

**做什么**：
```bash
# 在两台服务器的Nginx上配置负载均衡

sudo cat > /etc/nginx/nginx.conf << 'EOF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    # 上游服务器组
    upstream backend_servers {
        least_conn;
        server 192.168.1.101:3000 max_fails=3 fail_timeout=30s;
        server 192.168.1.102:3000 max_fails=3 fail_timeout=30s;
    }

    upstream frontend_servers {
        least_conn;
        server 192.168.1.101:3001 max_fails=3 fail_timeout=30s;
        server 192.168.1.102:3001 max_fails=3 fail_timeout=30s;
    }

    # 其他配置...
}
EOF

# 修改站点配置使用upstream
sudo cat > /etc/nginx/sites-available/blog << 'EOF'
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL配置...

    location / {
        proxy_pass http://frontend_servers;
        # 其他proxy配置...
    }

    location /api/ {
        proxy_pass http://backend_servers;
        # 其他proxy配置...
    }
}
EOF

# 重载Nginx
sudo systemctl reload nginx
```

**为什么**：
- **负载均衡**：请求分发到两台服务器，每台处理一半请求
- **least_conn**：最少连接算法，将请求发给连接数较少的服务器，避免负载不均
- **max_fails=3 fail_timeout=30s**：连续失败3次后，30秒内不再转发到该服务器，自动剔除故障节点
- **高可用**：一台服务器故障时，另一台自动接管所有请求

---

### 阶段三：小规模集群部署

**适用场景**：用户 1万-10万、日 PV 10-100万

#### 为什么要升级到集群？

**双服务器的局限**：
1. **仍有限制**：只能扩展到2倍性能
2. **数据库瓶颈**：主从复制中，主数据库仍然承担所有写操作
3. **扩展复杂**：添加更多服务器需要重新配置

**集群的优势**：
1. **无限扩展**：可以随时添加更多服务器
2. **专业组件**：引入专业数据库集群、缓存集群
3. **弹性伸缩**：根据流量自动调整资源

#### 步骤1：部署PostgreSQL主从集群（1主2从）

**做什么**：
```bash
# 使用 Patroni 管理PostgreSQL集群

# 在所有数据库节点上安装
sudo apt install -y postgresql-16 patroni etcd

# 配置Patroni（在节点1）
sudo cat > /etc/patroni/patroni.yml << 'EOF'
name: pg-node-1
scope: pg-cluster
restapi:
  listen: 0.0.0.0:8008
  connect_address: 192.168.1.101:8008
etcd:
  hosts:
    - 192.168.1.101:2379
    - 192.168.1.102:2379
    - 192.168.1.103:2379
bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576
  postgresql:
    use_pg_rewind: true
    remove_data_directory_on_rewind_failure: true
    data_dir: /var/lib/postgresql/16/main
    bin_name: /usr/lib/postgresql/16/bin/postgres
    config_dir: /etc/postgresql/16/main
    pg_hba:
      - host replication replicator 0.0.0.0/0 md5
      - host all all 0.0.0.0/0 md5
postgresql:
  listen: 0.0.0.0:5432
  connect_address: 192.168.1.101:5432
  data_dir: /var/lib/postgresql/16/main
  bin_name: /usr/lib/postgresql/16/bin/postgres
  config_dir: /etc/postgresql/16/main
  authentication:
    replication:
      username: replicator
      password: replicator-password
  parameters:
    max_connections: 200
    shared_buffers: 2GB
    effective_cache_size: 6GB
    maintenance_work_mem: 512MB
    checkpoint_completion_target: 0.9
    wal_buffers: 16MB
    default_statistics_target: 100
    random_page_cost: 1.1
    effective_io_concurrency: 200
    work_mem: 4MB
    min_wal_size: 1GB
    max_wal_size: 4GB
    max_worker_processes: 4
    max_parallel_workers_per_gather: 2
    max_parallel_workers: 4
tags:
  nofailover: false
  noloadbalance: false
  clonefrom: false
  nosync: false
EOF

# 启动Patroni（在每个节点上）
sudo systemctl start patroni
sudo systemctl enable patroni

# 查看集群状态
sudo patronictl -c /etc/patroni/patroni.yml list pg-cluster
```

**为什么**：
- **自动故障切换**：主数据库故障时，Patroni自动将从数据库提升为主库，通常在30秒内完成
- **避免脑裂**：通过etcd进行分布式协调，确保只有一个主数据库
- **零停机维护**：可以逐个升级节点，不影响服务
- **配置管理**：统一的配置文件，简化管理

#### 步骤2：部署Redis Sentinel集群

**做什么**：
```bash
# 安装Redis
sudo apt install -y redis-server

# 配置Redis主节点
sudo cat > /etc/redis/redis.conf << 'EOF'
bind 0.0.0.0
port 6379
requirepass your-redis-password
masterauth your-redis-password
maxmemory 1gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
EOF

# 配置Redis从节点
sudo cat > /etc/redis/redis.conf << 'EOF'
bind 0.0.0.0
port 6379
requirepass your-redis-password
masterauth your-redis-password
replicaof 主节点IP 6379
maxmemory 1gb
maxmemory-policy allkeys-lru
EOF

# 配置Sentinel（监控和自动故障切换）
sudo cat > /etc/redis/sentinel.conf << 'EOF'
port 26379
sentinel monitor mymaster 主节点IP 6379 2
sentinel auth-pass mymaster your-redis-password
sentinel down-after-milliseconds mymaster 5000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 10000
sentinel deny-scripts-reconfig yes
EOF

# 启动服务
sudo systemctl start redis-server
sudo systemctl start redis-sentinel
sudo systemctl enable redis-server
sudo systemctl enable redis-sentinel

# 查看Sentinel状态
redis-cli -p 26379 INFO sentinel
```

**为什么**：
- **自动故障切换**：主Redis故障时，Sentinel自动选举新的主节点
- **高可用**：即使主节点故障，服务也能在几秒内恢复
- **读写分离**：应用可以连接从节点读取数据，提升性能
- **maxmemory-policy**：内存满时自动淘汰最少使用的key，避免OOM

#### 步骤3：部署应用服务器集群

**做什么**：
```bash
# 在多台应用服务器上部署后端
# 使用 Docker Swarm 或 Kubernetes

# === 方案A：Docker Swarm（简单场景）===

# 初始化Swarm集群
docker swarm init --advertise-addr 192.168.1.101

# 添加工作节点
# 在其他服务器上执行
docker swarm join --token TOKEN 192.168.1.101:2377

# 部署应用栈
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  api:
    image: your-registry/blog-api:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    environment:
      - DATABASE_URL=postgresql://user:pass@pg-cluster:5432/blog_db
      - REDIS_URL=redis://redis-cluster:6379
    networks:
      - app-network

  frontend:
    image: your-registry/blog-frontend:latest
    deploy:
      replicas: 3
    networks:
      - app-network

networks:
  app-network:
    driver: overlay
EOF

# 部署栈
docker stack deploy -c docker-compose.yml blog

# 查看服务状态
docker service ls
docker service ps blog_api
```

**为什么**：
- **多副本**：3个API实例，一个故障其他继续服务
- **负载均衡**：自动在副本间分配请求
- **滚动更新**：更新时逐个替换副本，不影响服务
- **资源限制**：防止单个容器占用过多资源
- **健康检查**：自动重启不健康的容器

---

## 第二部分：维护教程

### 日常检查

#### 每日检查任务

**做什么**：
```bash
# 创建每日检查脚本
cat > ~/scripts/daily-check.sh << 'EOF'
#!/bin/bash

echo "=== 每日健康检查 $(date) ==="

# 1. 检查服务状态
echo "### 服务状态 ###"
systemctl is-active blog-backend && echo "✓ 后端运行正常" || echo "✗ 后端停止"
systemctl is-active blog-frontend && echo "✓ 前端运行正常" || echo "✗ 前端停止"
systemctl is-active nginx && echo "✓ Nginx运行正常" || echo "✗ Nginx停止"
systemctl is-active docker && echo "✓ Docker运行正常" || echo "✗ Docker停止"

# 2. 检查端口监听
echo -e "\n### 端口监听 ###"
netstat -tlnp | grep :3000 > /dev/null && echo "✓ 后端端口3000正常" || echo "✗ 后端端口未监听"
netstat -tlnp | grep :3001 > /dev/null && echo "✓ 前端端口3001正常" || echo "✗ 前端端口未监听"
netstat -tlnp | grep :80 > /dev/null && echo "✓ HTTP端口80正常" || echo "✗ HTTP端口未监听"
netstat -tlnp | grep :443 > /dev/null && echo "✓ HTTPS端口443正常" || echo "✗ HTTPS端口未监听"

# 3. 检查数据库
echo -e "\n### 数据库状态 ###"
docker exec blog-postgres pg_isready -U blog_user && echo "✓ PostgreSQL运行正常" || echo "✗ PostgreSQL停止"
docker exec blog-redis redis-cli ping | grep -q PONG && echo "✓ Redis运行正常" || echo "✗ Redis停止"

# 4. 检查磁盘空间
echo -e "\n### 磁盘空间 ###"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 70 ]; then
    echo "✓ 磁盘使用率: ${DISK_USAGE}%"
elif [ $DISK_USAGE -lt 85 ]; then
    echo "⚠ 磁盘使用率: ${DISK_USAGE}% (需要注意)"
else
    echo "✗ 磁盘使用率: ${DISK_USAGE}% (需要清理)"
fi

# 5. 检查内存使用
echo -e "\n### 内存使用 ###"
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEM_USAGE -lt 70 ]; then
    echo "✓ 内存使用率: ${MEM_USAGE}%"
elif [ $MEM_USAGE -lt 90 ]; then
    echo "⚠ 内存使用率: ${MEM_USAGE}% (需要注意)"
else
    echo "✗ 内存使用率: ${MEM_USAGE}% (需要优化)"
fi

# 6. 检查SSL证书
echo -e "\n### SSL证书 ###"
CERT_DAYS=$(echo | openssl s_client -connect localhost:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
CERT_EPOCH=$(date -d "$CERT_DAYS" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($CERT_EPOCH - $CURRENT_EPOCH) / 86400 ))

if [ $DAYS_LEFT -gt 30 ]; then
    echo "✓ SSL证书有效期: ${DAYS_LEFT}天"
else
    echo "✗ SSL证书即将过期: ${DAYS_LEFT}天 (需要更新)"
fi

# 7. API健康检查
echo -e "\n### API健康检查 ###"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ 后端API正常"
else
    echo "✗ 后端API异常 (HTTP $HTTP_CODE)"
fi

# 8. 检查最近的错误日志
echo -e "\n### 最近的错误 ###"
echo "后端错误（最近10条）:"
journalctl -u blog-backend --since "1 hour ago" --no-pager | grep -i error | tail -5

echo "前端错误（最近10条）:"
journalctl -u blog-frontend --since "1 hour ago" --no-pager | grep -i error | tail -5

echo -e "\n=== 检查完成 ==="
EOF

chmod +x ~/scripts/daily-check.sh

# 添加到定时任务（每天早上9点执行）
crontab -e
# 添加这行
0 9 * * * /home/blogadmin/scripts/daily-check.sh >> /var/log/daily-check.log 2>&1
```

**为什么**：
- **主动发现**：在用户报告之前发现问题
- **快速响应**：每天检查，及时处理异常
- **趋势分析**：通过日志了解系统使用趋势
- **预防性维护**：在问题严重化之前解决

---

### 数据备份

#### 为什么备份至关重要？

**没有备份的后果**：
1. **数据丢失**：硬件故障、误删操作、勒索软件都可能导致数据永久丢失
2. **业务停摆**：没有数据无法提供服务，损失收入和声誉
3. **法律风险**：用户数据丢失可能违反隐私保护法规

**备份的价值**：
1. **灾难恢复**：快速恢复业务，减少停机时间
2. **数据归档**：保留历史数据，用于审计和分析
3. **测试环境**：使用真实数据测试新功能

#### 自动备份脚本

**做什么**：
```bash
cat > ~/scripts/backup.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/home/blogadmin/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

echo "=== 开始备份 $DATE ==="

# 1. 备份PostgreSQL
echo "备份PostgreSQL..."
docker exec blog-postgres pg_dump -U blog_user -d blog_db \
  --clean --if-exists \
  --format=plain \
  --no-owner \
  --no-acl \
  > $BACKUP_DIR/postgres_$DATE.sql

# 压缩SQL备份
gzip $BACKUP_DIR/postgres_$DATE.sql

# 2. 备份Redis
echo "备份Redis..."
docker exec blog-redis redis-cli SAVE
docker cp blog-redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb
gzip $BACKUP_DIR/redis_$DATE.rdb

# 3. 备份上传文件
echo "备份上传文件..."
tar czf $BACKUP_DIR/uploads_$DATE.tar.gz /home/blogadmin/blog-system/frontend/public/uploads/

# 4. 备份配置文件
echo "备份配置文件..."
tar czf $BACKUP_DIR/config_$DATE.tar.gz \
  /home/blogadmin/blog-system/backend/.env \
  /home/blogadmin/blog-system/frontend/.env.production \
  /etc/nginx/sites-available/blog \
  /etc/systemd/system/blog-*.service

# 5. 计算校验和
echo "计算校验和..."
sha256sum $BACKUP_DIR/*_$DATE.* > $BACKUP_DIR/checksums_$DATE.txt

# 6. 清理旧备份
echo "清理${RETENTION_DAYS}天前的备份..."
find $BACKUP_DIR -name "*_$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)*" -delete

# 7. 检查备份大小
echo -e "\n备份文件大小:"
ls -lh $BACKUP_DIR/*_$DATE.*

# 8. 测试备份完整性
echo -e "\n测试备份完整性..."
sha256sum -c $BACKUP_DIR/checksums_$DATE.txt

echo -e "\n=== 备份完成 ==="
echo "备份位置: $BACKUP_DIR"
echo "备份大小: $(du -sh $BACKUP_DIR/*_$DATE.* | awk '{s+=$1} END {print s}' | numfmt --to=iec)"

# 9. 可选：上传到云存储
if [ -n "$S3_BUCKET" ]; then
    echo "上传到S3..."
    aws s3 sync $BACKUP_DIR s3://$S3_BUCKET/blog-backups/ \
      --storage-class STANDARD_IA \
      --exclude "*" \
      --include "*_$DATE.*"
    echo "已上传到S3"
fi
EOF

chmod +x ~/scripts/backup.sh

# 添加到定时任务（每天凌晨2点）
crontab -e
# 添加这行
0 2 * * * /home/blogadmin/scripts/backup.sh >> /var/log/backup.log 2>&1
```

**为什么**：
- **自动执行**：每天凌晨2点自动备份，避免人工遗漏
- **多份备份**：数据库、缓存、文件、配置都备份
- **压缩存储**：gzip压缩节省90%空间
- **校验和**：SHA256验证备份完整性
- **清理旧备份**：保留30天，平衡存储成本和数据安全
- **云存储**：异地备份，防止机房故障

---

## 第三部分：常见场景

### 场景1：流量突增应对

**现象**：
- 网站响应变慢
- 服务器负载飙升
- 部分请求超时

**临时应对**：
```bash
# 1. 检查当前负载
top
htop

# 2. 启用缓存（如果还没启用）
# 在Nginx中启用快速缓存
location /api/v1/posts {
    proxy_cache api_cache;
    proxy_cache_valid 200 1m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
}

# 3. 临时扩容
# 增加应用实例
docker compose up -d --scale api=3

# 4. 降级非核心功能
# 例如：暂停推荐算法、实时统计
# 在应用配置中设置
FEATURE_RECOMMENDATIONS=false
FEATURE_REALTIME_STATS=false
```

**长期优化**：
- 部署CDN
- 实施读写分离
- 增加服务器
- 优化数据库查询

### 场景2：数据库锁死

**现象**：
- 所有请求超时
- 数据库CPU 100%
- 查询无法执行

**紧急处理**：
```bash
# 1. 找到阻塞进程
docker exec blog-postgres psql -U blog_user -d blog_db << 'EOSQL'
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change,
    waiting_event_type,
    query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;
EOSQL

# 2. 杀死长时间运行的查询
docker exec blog-postgres psql -U blog_user -d blog_db << 'EOSQL'
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active'
AND query_start < NOW() - INTERVAL '10 minutes';
EOSQL

# 3. 重启PostgreSQL（最后手段）
docker restart blog-postgres
```

---

## 第四部分：多项目管理

### 使用同一套代码管理多个项目

本文档详细说明如何使用同一套代码管理多个项目（如公司主页 + 个人主页）。

#### 架构设计

**整体架构**：
```
服务器 (123.56.78.90)
│
├── 共享代码库 (/opt/blog-system)
│   ├── backend/          # 共享后端代码
│   │   └── target/release/api  # 一个二进制文件
│   ├── frontend/         # 共享前端代码
│   │   ├── .next/        # 构建产物
│   │   └── config/       # 不同项目的配置
│   └── scripts/          # 共享脚本
│
├── Docker容器
│   ├── company-postgres  (端口5432)  # 公司数据库
│   ├── company-redis     (端口6379)  # 公司缓存
│   ├── personal-postgres (端口5433)  # 个人数据库
│   └── personal-redis    (端口6380)  # 个人缓存
│
├── 服务实例
│   ├── company-backend   (端口3000)  # 公司后端
│   ├── company-frontend  (端口3001)  # 公司前端
│   ├── personal-backend  (端口3002)  # 个人后端
│   └── personal-frontend (端口3003)  # 个人前端
│
└── Nginx反向代理
    ├── company.com       → company-frontend
    ├── blog.company.com  → company-backend
    ├── personal.com      → personal-frontend
    └── api.personal.com  → personal-backend
```

**关键设计原则**：
1. **代码共享**：所有项目使用相同的后端和前端代码
2. **数据隔离**：每个项目有独立的数据库和Redis实例
3. **配置分离**：每个项目有独立的环境变量和配置文件
4. **独立部署**：每个项目作为独立的systemd服务运行
5. **统一维护**：代码更新时，所有项目同时升级

#### 环境变量配置

**公司项目配置**：
```bash
# 数据库配置
DATABASE_URL=postgresql://company_user:company_password@localhost:5432/company_db
POSTGRES_USER=company_user
POSTGRES_PASSWORD=company_password_change_this
POSTGRES_DB=company_db

# Redis配置
REDIS_URL=redis://localhost:6379

# 安全配置（使用不同的密钥！）
JWT_SECRET=company-jwt-secret-key-32-chars-minimum
SESSION_SECRET=company-session-secret-24-chars
PASSWORD_PEPPER=company-password-pepper-16-chars

# 项目标识
PROJECT_NAME=company
PROJECT_ID=company

# CORS配置（公司域名）
CORS_ALLOWED_ORIGINS=https://www.company.com,https://company.com

# 服务器配置
HOST=0.0.0.0
PORT=3000
ENVIRONMENT=production
```

**个人项目配置**：
```bash
# 数据库配置
DATABASE_URL=postgresql://personal_user:personal_password@localhost:5433/personal_db
POSTGRES_USER=personal_user
POSTGRES_PASSWORD=personal_password_change_this
POSTGRES_DB=personal_db

# Redis配置
REDIS_URL=redis://localhost:6380

# 安全配置（不同的密钥！）
JWT_SECRET=personal-jwt-secret-key-32-chars-minimum
SESSION_SECRET=personal-session-secret-24-chars
PASSWORD_PEPPER=personal-password-pepper-16-chars

# 项目标识
PROJECT_NAME=personal
PROJECT_ID=personal

# CORS配置（个人域名）
CORS_ALLOWED_ORIGINS=https://blog.personal.com,https://personal.com

# 服务器配置
HOST=0.0.0.0
PORT=3002
ENVIRONMENT=production
```

---

## 第五部分：服务器切换

本节说明如何在新服务器上部署应用，并实现零停机迁移。

### 迁移步骤

#### 1. 准备新服务器

**在新服务器上**：
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装基础工具
sudo apt install -y git nginx certbot python3-certbot-nginx

# 克隆代码
git clone https://github.com/yourusername/your-repo.git ~/blog-system
cd ~/blog-system
```

#### 2. 启动数据库

```bash
# 复制数据库配置
cp backend/docker-compose.yml.example backend/docker-compose.yml
# 编辑密码等配置

# 启动数据库
docker compose up -d

# 等待数据库启动
sleep 10

# 验证
docker ps
```

#### 3. 迁移数据

**在旧服务器上**：
```bash
# 备份数据库
docker exec blog-postgres pg_dump -U blog_user blog_db > backup.sql

# 备份 Redis
docker exec blog-redis redis-cli SAVE
docker cp blog-redis:/data/dump.rdb redis_backup.rdb

# 传输到新服务器
scp backup.sql blogadmin@new-server-ip:~/blog-system/
scp redis_backup.rdb blogadmin@new-server-ip:~/blog-system/
```

**在新服务器上**：
```bash
# 恢复数据库
docker exec -i blog-postgres psql -U blog_user blog_db < backup.sql

# 恢复 Redis
docker cp redis_backup.rdb blog-redis:/data/dump.rdb
docker restart blog-redis
```

#### 4. 部署应用

**在新服务器上**：
```bash
# 配置环境变量
cat > backend/.env << 'EOF'
DATABASE_URL=postgresql://blog_user:your_password@localhost:5432/blog_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 24)
PASSWORD_PEPPER=$(openssl rand -base64 16)
HOST=0.0.0.0
PORT=3000
ENVIRONMENT=production
EOF

# 构建后端
cd backend
cargo build --release --bin api

# 创建 systemd 服务
sudo cat > /etc/systemd/system/blog-backend.service << 'EOF'
[Unit]
Description=Blog Backend API
After=network.target docker-compose.service

[Service]
Type=simple
User=blogadmin
WorkingDirectory=/home/blogadmin/blog-system/backend
Environment="RUST_LOG=info"
EnvironmentFile=/home/blogadmin/blog-system/backend/.env
ExecStart=/home/blogadmin/blog-system/backend/target/release/api
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
sudo systemctl daemon-reload
sudo systemctl start blog-backend
sudo systemctl enable blog-backend
```

**部署前端**（类似步骤）...

#### 5. 配置 Nginx 和 SSL

```bash
# 配置 Nginx（同上）

# 申请 SSL 证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 6. 切换 DNS

1. **在旧服务器上运行**：保持服务运行
2. **修改 DNS 记录**：将域名 A 记录指向新服务器 IP
3. **等待 DNS 传播**：通常 10-60 分钟
4. **验证新服务器**：通过域名访问，确认正常
5. **停止旧服务器**：确认无流量后关闭

#### 7. 监控和验证

```bash
# 检查服务状态
sudo systemctl status blog-backend blog-frontend

# 查看日志
journalctl -u blog-backend -f

# 测试 API
curl http://localhost:3000/health
```

### 快速回滚

如果新服务器有问题，快速回滚：

```bash
# 1. 修改 DNS 指回旧服务器 IP

# 2. 在新服务器上停止服务
sudo systemctl stop blog-backend blog-frontend

# 3. 在旧服务器上确认服务运行
sudo systemctl start blog-backend blog-frontend
```

---

## 总结

### 部署核心理念

1. **自动化优于手动**：一切可自动化的都应该自动化
2. **监控优于报警**：主动发现问题
3. **备份优于后悔**：没有备份就不要上线
4. **渐进优于激进**：分阶段升级，快速回滚
5. **文档优于记忆**：记录所有操作和决策

### 维护核心原则

1. **预防胜于治疗**：定期检查，提前发现
2. **小步快跑**：频繁小更新，避免大爆炸
3. **故障演练**：平时多流汗，战时少流血
4. **持续改进**：每次故障都是优化机会
5. **文档同步**：更新代码的同时更新文档

### 快速参考

| 场景 | 命令 |
|------|------|
| 查看服务状态 | `sudo systemctl status blog-backend` |
| 查看实时日志 | `journalctl -u blog-backend -f` |
| 重启服务 | `sudo systemctl restart blog-backend` |
| 查看容器状态 | `docker ps` |
| 进入容器 | `docker exec -it container-name bash` |
| 数据库连接 | `docker exec -it blog-postgres psql -U blog_user -d blog_db` |
| 备份数据库 | `./scripts/backup.sh` |
| 诊断问题 | `./scripts/diagnose.sh` |

记住：**运维的核心不是解决问题，而是预防问题**。良好的监控、备份和自动化流程比任何故障处理技巧都重要。

---

**文档版本**：v2.0
**最后更新**：2025-12-26
**维护者**：开发团队
