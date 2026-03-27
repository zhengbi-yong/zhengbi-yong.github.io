# Commands Reference / 命令参考

Essential commands for deployment, management, and troubleshooting.
/ 部署、管理和故障排查的必备命令。

---

## 📋 Overview / 概述

This reference covers commonly used commands for Docker, database operations, and system administration.
/ 本参考涵盖Docker、数据库操作和系统管理的常用命令。

### Quick Navigation / 快速导航

- [Project Deployment Commands](#project-deployment-commands) - Canonical repo workflows
- [Docker Commands](#docker-commands) - Container management
- [Docker Compose Commands](#docker-compose-commands) - Multi-container orchestration
- [Database Commands](#database-commands-postgresql) - PostgreSQL operations
- [Redis Commands](#redis-commands) - Cache operations
- [Network Commands](#network-commands) - Networking and ports
- [System Commands](#system-commands) - Server management

---

## 🚀 Project Deployment Commands

```bash
# Lowest-friction fresh-server deploy
bash scripts/deployment/provision-compose-host.sh --target ubuntu@203.0.113.10

# Generate a validated production env
bash scripts/deployment/generate-production-env.sh \
  --public-host 203.0.113.10 \
  --smtp-mode mailpit \
  --enable-bundled-mailpit \
  --output .env.production

# Bootstrap Docker/Compose on a remote host
bash scripts/deployment/bootstrap-remote-host.sh --target ubuntu@203.0.113.10

# Upload and deploy the canonical Compose runtime
bash scripts/deployment/deploy-remote-compose.sh \
  --target ubuntu@203.0.113.10 \
  --env-file .env.production

# Fast update using the existing remote env and only changed local images
bash scripts/deployment/refresh-remote-compose.sh \
  --target ubuntu@203.0.113.10 \
  --build-local-images

# Fast update + stale test-stack cleanup on small-memory hosts
bash scripts/deployment/refresh-remote-compose.sh \
  --target ubuntu@203.0.113.10 \
  --build-local-images \
  --cleanup-stale-projects

# Same fast update via Makefile wrapper
make refresh-remote-compose TARGET=ubuntu@203.0.113.10 BUILD_LOCAL_IMAGES=1

# Switch public traffic to the new Compose edge behind system nginx
bash scripts/deployment/cutover-system-nginx.sh \
  --target ubuntu@203.0.113.10 \
  --remote-dir /opt/blog-platform

# Roll system nginx back to the latest backup
bash scripts/deployment/rollback-system-nginx.sh \
  --target ubuntu@203.0.113.10 \
  --remote-dir /opt/blog-platform

# Validate and start the local production Compose stack
bash scripts/deployment/deploy-compose-stack.sh --env-file .env.production --pull

# Generate a CI-safe production env for smoke tests
make generate-ci-prod-env OUTPUT_FILE=.env.production.ci

# Build and smoke-test the canonical production Compose runtime
make smoke-prod-compose ENV_FILE=.env.production.ci

# Reuse the current local images for a fast repeat smoke
make smoke-prod-compose-fast ENV_FILE=.env.production

# Render versioned release assets
make render-release-assets VERSION=1.8.2

# Validate Kubernetes apply on a disposable local cluster
make validate-k8s-apply RELEASE_VERSION=1.8.2

# Regenerate and verify OpenAPI + frontend API types stay in sync
make verify-api-contract
```

---

## 🐳 Docker Commands

### Container Management / 容器管理

#### List Containers / 列出容器

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# List with size
docker ps -s

# Format output
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

#### View Logs / 查看日志

```bash
# View container logs
docker logs <container_name>

# Follow logs (live tail)
docker logs -f <container_name>

# Last 100 lines
docker logs --tail 100 <container_name>

# With timestamps
docker logs -t <container_name>

# Multiple containers
docker logs <container1> <container2>
```

#### Stop/Start/Restart / 停止/启动/重启

```bash
# Stop container
docker stop <container_name>

# Start stopped container
docker start <container_name>

# Restart container
docker restart <container_name>

# Force stop (after 10 seconds)
docker kill <container_name>

# Stop all running containers
docker stop $(docker ps -q)
```

#### Execute Commands in Container / 在容器中执行命令

```bash
# Execute command in running container
docker exec <container_name> <command>

# Example: Open bash in container
docker exec -it <container_name> bash

# Example: Open sh (alpine images)
docker exec -it <container_name> sh

# Example: Run single command
docker exec <container_name> ls -la

# Example: As specific user
docker exec -u postgres <container_name> psql
```

#### Container Info / 容器信息

```bash
# View container details
docker inspect <container_name>

# View container stats (CPU, memory, etc.)
docker stats <container_name>

# View container processes
docker top <container_name>

# View container port mappings
docker port <container_name>
```

#### Remove Containers / 删除容器

```bash
# Remove stopped container
docker rm <container_name>

# Force remove (running container)
docker rm -f <container_name>

# Remove all stopped containers
docker container prune

# Remove all containers (running + stopped)
docker rm -f $(docker ps -aq)
```

### Image Management / 镜像管理

```bash
# List images
docker images

# Pull image
docker pull <image_name>

# Build image
docker build -t <image_name> <path>

# Tag image
docker tag <image_id> <new_name>:<tag>

# Remove image
docker rmi <image_name>

# Remove all unused images
docker image prune -a

# Remove dangling images
docker image prune
```

### Volume Management / 卷管理

```bash
# List volumes
docker volume ls

# Create volume
docker volume create <volume_name>

# Inspect volume
docker volume inspect <volume_name>

# Remove volume
docker volume rm <volume_name>

# Remove all unused volumes
docker volume prune

# Backup volume
docker run --rm -v <volume_name>:/data -v $(pwd):/backup \
  alpine tar czf /backup/backup.tar.gz /data

# Restore volume
docker run --rm -v <volume_name>:/data -v $(pwd):/backup \
  alpine tar xzf /backup/backup.tar.gz -C /
```

### Network Management / 网络管理

```bash
# List networks
docker network ls

# Create network
docker network create <network_name>

# Inspect network
docker network inspect <network_name>

# Connect container to network
docker network connect <network_name> <container_name>

# Disconnect container from network
docker network disconnect <network_name> <container_name>

# Remove network
docker network rm <network_name>

# Remove all unused networks
docker network prune
```

### System Management / 系统管理

```bash
# Docker system info
docker info

# Disk usage
docker system df

# Remove all unused data (containers, networks, images, volumes)
docker system prune -a --volumes

# Remove build cache
docker builder prune

# View Docker events
docker events
```

---

## 🎼 Docker Compose Commands

### Basic Operations / 基本操作

```bash
# Start all services (detached)
docker compose up -d

# Start all services (foreground, view logs)
docker compose up

# Start specific services
docker compose up postgres redis

# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes data)
docker compose down -v

# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend
```

### Build & Rebuild / 构建和重新构建

```bash
# Build and start
docker compose up -d --build

# Rebuild specific service
docker compose up -d --build backend

# Force rebuild (no cache)
docker compose build --no-cache

# Build without starting
docker compose build
```

### Logs / 日志

```bash
# View all logs
docker compose logs

# Follow logs (live)
docker compose logs -f

# View specific service logs
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail 100

# Multiple services
docker compose logs -f backend frontend

# With timestamps
docker compose logs -t
```

### Service Status / 服务状态

```bash
# List all services
docker compose ps

# View service status
docker compose top

# View resource usage
docker compose stats
```

### Execute Commands / 执行命令

```bash
# Execute command in service
docker compose exec <service> <command>

# Example: Open bash
docker compose exec backend bash

# Example: Run database query
docker compose exec postgres psql -U blog_user -d blog_db

# Example: Run Redis CLI
docker compose exec redis redis-cli

# Execute as specific user
docker compose exec -u postgres postgres psql
```

### Configuration / 配置

```bash
# Validate compose file
docker compose config

# View compose file with variables resolved
docker compose config --resolve-image-digests

# View compose file for specific profile
docker compose --profile development config
```

### Scaling / 扩展

```bash
# Scale service (requires deploy config)
docker compose up -d --scale backend=3

# Scale down
docker compose up -d --scale backend=1
```

### Profiles / 配置文件

```bash
# Start with specific profile
docker compose --profile production up -d

# Start with multiple profiles
docker compose --profile development --profile monitoring up -d
```

---

## 🗄️ Database Commands (PostgreSQL)

### Connection / 连接

```bash
# Connect to database
docker compose exec postgres psql -U blog_user -d blog_db

# Connect with password prompt
docker compose exec -it postgres psql -U blog_user -d blog_db

# Connect as postgres superuser
docker compose exec -u postgres postgres psql

# Connect to different host
psql -h <host> -p 5432 -U blog_user -d blog_db
```

### Basic Queries / 基本查询

```bash
# List all databases
\l

# Connect to database
\c blog_db

# List all tables
\dt

# Describe table
\d table_name

# List all users
\du

# Show current database
SELECT current_database();

# Show current user
SELECT current_user;

# Show version
SELECT version();
```

### Database Operations / 数据库操作

```bash
# Create database
CREATE DATABASE blog_db;

# Drop database
DROP DATABASE blog_db;

# Drop database with connections
DROP DATABASE blog_db WITH (FORCE);

# Create user
CREATE USER blog_user WITH PASSWORD 'secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE blog_db TO blog_user;

# Grant schema privileges
GRANT ALL ON SCHEMA public TO blog_user;

# Alter user password
ALTER USER blog_user WITH PASSWORD 'new_password';

# Drop user
DROP USER blog_user;
```

### Backup & Restore / 备份和恢复

```bash
# Backup database (SQL dump)
docker compose exec postgres pg_dump -U blog_user blog_db > backup.sql

# Backup with compression
docker compose exec postgres pg_dump -U blog_user blog_db | gzip > backup.sql.gz

# Backup specific table
docker compose exec postgres pg_dump -U blog_user -t table_name blog_db > table_backup.sql

# Backup schema only
docker compose exec postgres pg_dump -U blog_user --schema-only blog_db > schema.sql

# Backup data only
docker compose exec postgres pg_dump -U blog_user --data-only blog_db > data.sql

# Restore database
docker compose exec -T postgres psql -U blog_user blog_db < backup.sql

# Restore from compressed backup
gunzip -c backup.sql.gz | docker compose exec -T postgres psql -U blog_user blog_db

# Restore specific table
docker compose exec -T postgres psql -U blog_user blog_db < table_backup.sql
```

### Query Operations / 查询操作

```bash
# Run query from command line
docker compose exec postgres psql -U blog_user -d blog_db -c "SELECT COUNT(*) FROM posts;"

# Run query from file
docker compose exec -T postgres psql -U blog_user -d blog_db < query.sql

# Run query and output to CSV
docker compose exec postgres psql -U blog_user -d blog_db -c "COPY (SELECT * FROM posts) TO STDOUT WITH CSV HEADER" > posts.csv

# Vacuum database (optimize)
docker compose exec postgres psql -U blog_user -d blog_db -c "VACUUM ANALYZE;"

# Reindex database
docker compose exec postgres psql -U blog_user -d blog_db -c "REINDEX DATABASE blog_db;"
```

### Maintenance / 维护

```bash
# Database size
docker compose exec postgres psql -U blog_user -d blog_db -c "SELECT pg_size_pretty(pg_database_size('blog_db'));"

# Table sizes
docker compose exec postgres psql -U blog_user -d blog_db -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# Kill all connections to database
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'blog_db' AND pid <> pg_backend_pid();

# Check for locks
docker compose exec postgres psql -U blog_user -d blog_db -c "SELECT * FROM pg_locks;"

# Check active connections
docker compose exec postgres psql -U blog_user -d blog_db -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Database statistics
docker compose exec postgres psql -U blog_user -d blog_db -c "SELECT * FROM pg_stat_database WHERE datname = 'blog_db';"
```

### User Management / 用户管理

```bash
# List all users and permissions
docker compose exec postgres psql -U postgres -c "\du"

# Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE blog_db TO blog_user;

# Grant all privileges on schema
GRANT ALL PRIVILEGES ON SCHEMA public TO blog_user;

# Grant all privileges on all tables in schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO blog_user;

# Grant all privileges on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO blog_user;

# Revoke privileges
REVOKE ALL ON DATABASE blog_db FROM blog_user;
```

---

## 💾 Redis Commands

### Connection / 连接

```bash
# Connect to Redis CLI
docker compose exec redis redis-cli

# Connect with authentication
docker compose exec redis redis-cli -a PASSWORD

# Ping Redis
docker compose exec redis redis-cli ping

# Test connection
docker compose exec redis redis-cli INFO server
```

### Basic Operations / 基本操作

```bash
# Set key
SET key "value"

# Get key
GET key

# Delete key
DEL key

# Check if key exists
EXISTS key

# Set key with expiration (seconds)
SET key "value" EX 3600

# Set key with expiration (milliseconds)
SETEX key 60000 "value"

# Get remaining TTL
TTL key

# Rename key
RENAME old_key new_key

# Get all keys (⚠️ use with caution)
KEYS *

# Search keys (safer)
SCAN 0 MATCH pattern*

# Get key type
TYPE key
```

### String Operations / 字符串操作

```bash
# Append to string
APPEND key "value"

# Get string length
STRLEN key

# Increment counter
INCR counter

# Increment by amount
INCRBY counter 5

# Decrement
DECR counter

# Decrement by amount
DECRBY counter 5

# Multiple set
MSET key1 "value1" key2 "value2"

# Multiple get
MGET key1 key2
```

### List Operations / 列表操作

```bash
# Push to list (left)
LPUSH list "value"

# Push to list (right)
RPUSH list "value"

# Pop from list (left)
LPOP list

# Pop from list (right)
RPOP list

# Get list range
LRANGE list 0 -1

# Get list length
LLEN list
```

### Hash Operations / 哈希操作

```bash
# Set hash field
HSET hash field "value"

# Get hash field
HGET hash field

# Get all hash fields
HGETALL hash

# Delete hash field
HDEL hash field

# Get all hash keys
HKEYS hash

# Get all hash values
HVALS hash

# Check if field exists
HEXISTS hash field
```

### Cache Management / 缓存管理

```bash
# Flush all cache (⚠️ deletes all data)
FLUSHALL

# Flush current database
FLUSHDB

# Get database size
DBSIZE

# Get memory usage
INFO memory

# Get memory usage for key
MEMORY USAGE key

# Get Redis info
INFO

# Get slow log
SLOWLOG GET 10

# Monitor commands (⚠️ performance impact)
MONITOR
```

### Backup & Restore / 备份和恢复

```bash
# Save database to disk
SAVE

# Background save
BGSAVE

# Last save time
LASTSAVE

# Disable snapshotting
CONFIG SET save ""

# Enable snapshotting
CONFIG SET save "900 1 300 10 60 10000"
```

---

## 🌐 Network Commands

### Port Checking / 端口检查

```bash
# Check if port is in use (Linux/Mac)
lsof -i :3000

# Check if port is in use (Windows)
netstat -ano | findstr :3000

# List all listening ports
netstat -tuln

# Check port with netcat
nc -zv localhost 3000

# Check port with curl
curl http://localhost:3000
```

### DNS & Connectivity / DNS和连接

```bash
# Check DNS resolution
nslookup google.com
dig google.com

# Test internet connectivity
ping -c 4 google.com

# Trace route
traceroute google.com

# Check HTTP response
curl -I https://example.com

# Check SSL certificate
openssl s_client -connect example.com:443
```

### Firewall / 防火墙

```bash
# Check firewall status (Linux UFW)
sudo ufw status

# Allow port
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny port
sudo ufw deny 22/tcp

# Enable firewall
sudo ufw enable

# Disable firewall
sudo ufw disable

# List rules (iptables)
sudo iptables -L -n -v
```

---

## 💻 System Commands

### Disk Space / 磁盘空间

```bash
# Check disk usage
df -h

# Check directory size
du -sh /path/to/directory

# Find large files
find / -type f -size +100M 2>/dev/null

# Find top 10 largest files
du -ah / | sort -rh | head -n 10

# Clean package cache (Ubuntu/Debian)
sudo apt clean
sudo apt autoremove

# Clean Docker system
docker system prune -a --volumes
```

### Memory / 内存

```bash
# Check memory usage
free -h

# Check memory by process
ps aux --sort=-%mem | head -n 10

# Check swap usage
swapon --show

# Create swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### CPU / 处理器

```bash
# Check CPU usage
top

# Check CPU by process
ps aux --sort=-%cpu | head -n 10

# Number of CPU cores
nproc

# CPU info
cat /proc/cpuinfo | grep "model name" | head -n 1
```

### Process Management / 进程管理

```bash
# List all processes
ps aux

# Find process by name
ps aux | grep process_name

# Kill process
kill <pid>

# Force kill process
kill -9 <pid>

# Kill process by name
pkill process_name

# Find and kill process
fkill process_name  # Requires node package
```

### Logs / 日志

```bash
# View system log
sudo journalctl

# Follow system log
sudo journalctl -f

# View service log
sudo journalctl -u servicename

# View last 100 lines
sudo journalctl -n 100

# View since specific time
sudo journalctl --since "1 hour ago"

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 Quick Workflows / 快速工作流

### Start Development Environment / 启动开发环境

```bash
# Clone repository
git clone https://github.com/zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# Start databases
docker compose up -d postgres redis

# Wait for databases to be ready (10 seconds)
sleep 10

# Start application
docker compose up -d

# Verify
docker compose ps

# View logs
docker compose logs -f
```

### Restart Services / 重启服务

```bash
# Restart backend
docker compose restart backend

# Restart all services
docker compose restart

# Rebuild and restart
docker compose up -d --build backend
```

### Database Backup / 数据库备份

```bash
# Create backup
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).sql"
docker compose exec postgres pg_dump -U blog_user blog_db > "$BACKUP_NAME"

# Compress backup
gzip "$BACKUP_NAME"

# List backups
ls -lh backup-*.sql.gz
```

### Database Restore / 数据库恢复

```bash
# Stop backend
docker compose stop backend

# Drop and recreate database
docker compose exec postgres psql -U postgres -c "DROP DATABASE blog_db;"
docker compose exec postgres psql -U postgres -c "CREATE DATABASE blog_db;"

# Restore from backup
gunzip -c backup-YYYYMMDD-HHMMSS.sql.gz | docker compose exec -T postgres psql -U blog_user blog_db

# Start backend
docker compose start backend
```

### Check System Health / 检查系统健康

```bash
# Check container status
docker compose ps

# Check disk space
df -h

# Check memory
free -h

# Check Docker logs
docker compose logs --tail 50

# Test database
docker compose exec postgres psql -U blog_user -d blog_db -c "SELECT 1;"

# Test Redis
docker compose exec redis redis-cli ping
```

---

## 📖 Related Documentation / 相关文档

- [Compose Production Stack](../guides/compose/production-stack.md) - Canonical Compose deployment
- [Automated Compose Deploy](../guides/server/automated-compose-deploy.md) - Remote SSH deployment
- [System Nginx Cutover](../guides/server/system-nginx-cutover.md) - Host nginx switch-over
- [Troubleshooting](../../getting-started/troubleshooting.md) - Common issues
- [Environment Variables](./environment-variables.md) - Configuration reference

---

**Version**: 2.0 (World-Class Deployment Documentation)
**Last Updated**: 2026-01-01
**Maintained By**: Deployment Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)
