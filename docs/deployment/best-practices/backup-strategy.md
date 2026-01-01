# Backup Strategy / 备份策略

Comprehensive backup and disaster recovery planning for data protection.
/ 数据保护的综合备份和灾难恢复规划。

---

## 📋 Overview / 概述

A solid backup strategy is your insurance against data loss from hardware failure, human error, security breaches, or disasters.
/ 坚实的备份策略是您防止硬件故障、人为错误、安全漏洞或灾难导致数据损失的保险。

### 3-2-1 Backup Rule / 3-2-1备份规则

**Best Practice / 最佳实践**:

```
3 copies of data / 3份数据副本
2 different storage types / 2种不同的存储类型
1 offsite backup / 1个异地备份
```

**Example / 示例**:
- Primary: Live database / 主：活动数据库
- Copy 1: Local backup (server) / 副本1：本地备份（服务器）
- Copy 2: Remote backup (cloud) / 副本2：远程备份（云）

---

## 🗄️ What to Backup / 备份什么

### Critical Data / 关键数据

| Data Type / 数据类型 | Location / 位置 | Backup Method / 备份方法 | Frequency / 频率 |
|-------------------|----------------|---------------------|---------------|
| **PostgreSQL Database** | postgres container | pg_dump | Daily / 每天 |
| **Redis Cache** | redis container | RDB snapshot | Weekly (optional) / 每周（可选） |
| **Environment Variables** | .env file | Copy to secure location / 复制到安全位置 | On change / 更改时 |
| **SSL Certificates** | /etc/letsencrypt | Copy to backup / 复制到备份 | Weekly / 每周 |
| **User Uploads** | volumes | rsync / tar | Daily / 每天 |
| **Nginx Configuration** | /etc/nginx | Copy to backup / 复制到备份 | On change / 更改时 |

### Non-Essential (Don't Backup) / 非必需（不备份）

- Docker images (can be rebuilt) / Docker镜像（可以重建）
- Container logs (rotated automatically) / 容器日志（自动轮换）
- Temporary files / 临时文件
- Cache data (rebuildable) / 缓存数据（可重建）

---

## 📅 Backup Schedules / 备份计划

### Recommended Schedule / 推荐计划

#### Personal Blog / Low Traffic / 个人博客 / 低流量

**Daily Backups / 每日备份**:
- Database: Full backup daily / 数据库：每日完整备份
- Retention: 30 days / 保留：30天

**Weekly Backups / 每周备份**:
- SSL certificates / SSL证书
- Environment files / 环境文件
- Configuration files / 配置文件

**Monthly Backups / 每月备份**:
- Long-term archive (keep 12 months) / 长期归档（保留12个月）

#### Production Blog / High Traffic / 生产博客 / 高流量

**Hourly Backups / 每小时备份**:
- Database: Incremental backup / 数据库：增量备份
- Retention: 24 hours / 保留：24小时

**Daily Backups / 每日备份**:
- Database: Full backup / 数据库：完整备份
- User uploads / 用户上传
- Retention: 30 days / 保留：30天

**Weekly Backups / 每周备份**:
- Configuration files / 配置文件
- SSL certificates / SSL证书
- Retention: 8 weeks / 保留：8周

**Monthly Backups / 每月备份**:
- Full system backup / 完整系统备份
- Retention: 12 months / 保留：12个月

---

## 🛠️ Backup Implementation / 备份实现

### Database Backups / 数据库备份

#### Automated Backup Script / 自动备份脚本

```bash
#!/bin/bash
# scripts/backup/backup-database.sh

# Configuration
BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/blog_db_$TIMESTAMP.sql"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database backup
echo "Starting database backup..."
docker compose exec -T postgres pg_dump -U blog_user blog_db > "$BACKUP_FILE"

# Compress backup
echo "Compressing backup..."
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Upload to remote storage (optional)
# aws s3 cp "$BACKUP_FILE" s3://your-bucket/backups/

# Clean old backups
echo "Cleaning old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "blog_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Verify backup
if [ -f "$BACKUP_FILE" ]; then
    echo "✅ Backup completed successfully: $BACKUP_FILE"
    echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "❌ Backup failed!"
    exit 1
fi
```

**Make executable / 使可执行**:
```bash
chmod +x scripts/backup/backup-database.sh
```

#### Schedule with Cron / 使用Cron计划

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/scripts/backup/backup-database.sh >> /var/log/db-backup.log 2>&1

# Add hourly backup (production)
0 * * * * /path/to/scripts/backup/backup-database.sh >> /var/log/db-backup.log 2>&1
```

### Manual Backup / 手动备份

```bash
# Quick backup (current directory)
docker compose exec postgres pg_dump -U blog_user blog_db > backup-$(date +%Y%m%d).sql

# Compressed backup
docker compose exec postgres pg_dump -U blog_user blog_db | gzip > backup-$(date +%Y%m%d).sql.gz

# Backup specific table
docker compose exec postgres pg_dump -U blog_user -t posts blog_db > posts-backup.sql

# Schema only
docker compose exec postgres pg_dump -U blog_user --schema-only blog_db > schema.sql

# Data only
docker compose exec postgres pg_dump -U blog_user --data-only blog_db > data.sql
```

### Volume Backups / 卷备份

```bash
#!/bin/bash
# scripts/backup/backup-volumes.sh

# Backup Docker volumes
BACKUP_DIR="/backups/volumes"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup each volume
for volume in frontend_user_uploads postgres_data; do
    echo "Backing up $volume..."
    docker run --rm \
        -v zhengbi-yong_${volume}:/data:ro \
        -v "$BACKUP_DIR":/backup \
        alpine tar czf "/backup/${volume}_${TIMESTAMP}.tar.gz" -C /data .
done

echo "✅ Volume backups completed"
```

### Configuration Backups / 配置备份

```bash
#!/bin/bash
# scripts/backup/backup-config.sh

BACKUP_DIR="/backups/config"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# Backup environment files
cp .env "$BACKUP_DIR/.env.$TIMESTAMP"

# Backup Nginx configuration
docker compose exec nginx cat /etc/nginx/nginx.conf > "$BACKUP_DIR/nginx.$TIMESTAMP.conf"

# Backup SSL certificates
cp -r /etc/letsencrypt "$BACKUP_DIR/letsencrypt.$TIMESTAMP/"

# Backup Docker Compose files
cp docker-compose.yml "$BACKUP_DIR/docker-compose.$TIMESTAMP.yml"

echo "✅ Configuration backups completed"
```

---

## ☁️ Offsite Backup / 异地备份

### Cloud Storage Options / 云存储选项

#### AWS S3 / AWS S3

```bash
# Install AWS CLI
sudo apt install awscli

# Configure AWS
aws configure

# Sync backups to S3
aws s3 sync /backups/ s3://your-bucket/backups/ --delete

# Automated script
#!/bin/bash
aws s3 cp /backups/postgres/blog_db_latest.sql.gz \
    s3://your-bucket/backups/db/$(date +%Y%m%d)/blog_db.sql.gz
```

#### Backblaze B2 (Cheaper than S3) / Backblaze B2（比S3便宜）

```bash
# Install B2 CLI
pip install b2

# Configure B2
b2 authorize-account

# Upload backup
b2 upload-file your-bucket-name \
    /backups/postgres/blog_db_latest.sql.gz \
    backups/db/$(date +%Y%m%d)_blog_db.sql.gz
```

#### Google Cloud Storage / Google Cloud Storage

```bash
# Install gcloud CLI
# https://cloud.google.com/sdk/docs/install

# Upload backup
gsutil cp /backups/postgres/blog_db_latest.sql.gz \
    gs://your-bucket/backups/db/$(date +%Y%m%d)_blog_db.sql.gz
```

### Remote Server Backup / 远程服务器备份

```bash
# rsync to remote server
rsync -avz --delete /backups/ user@remote-server:/backups/

# Via SSH key
rsync -avz -e "ssh -i /path/to/key" /backups/ user@remote-server:/backups/

# Automated in cron
0 3 * * * rsync -avz --delete /backups/ user@remote-server:/backups/ >> /var/log/rsync.log 2>&1
```

---

## 🔄 Restoration Procedures / 恢复流程

### Database Restoration / 数据库恢复

#### Full Database Restore / 完整数据库恢复

```bash
#!/bin/bash
# scripts/backup/restore-database.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

# Stop backend (prevent new connections)
echo "Stopping backend..."
docker compose stop backend

# Drop existing database
echo "Dropping existing database..."
docker compose exec postgres psql -U postgres -c "DROP DATABASE blog_db;"

# Create fresh database
echo "Creating new database..."
docker compose exec postgres psql -U postgres -c "CREATE DATABASE blog_db;"

# Restore backup
echo "Restoring from $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres psql -U blog_user blog_db

# Start backend
echo "Starting backend..."
docker compose start backend

echo "✅ Database restored successfully"
```

**Usage / 使用**:
```bash
# Restore from backup
./scripts/backup/restore-database.sh /backups/postgres/blog_db_20240101_020000.sql.gz

# Or manual restore
gunzip -c backup.sql.gz | docker compose exec -T postgres psql -U blog_user blog_db
```

#### Point-in-Time Recovery (PITR) / 时间点恢复

**Requires WAL archiving** (advanced setup) / 需要WAL归档（高级设置）

```bash
# Configure PostgreSQL for PITR
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backups/wal/%f'
max_wal_senders = 3
```

### Volume Restoration / 卷恢复

```bash
#!/bin/bash
# scripts/backup/restore-volume.sh

VOLUME_NAME=$1
BACKUP_FILE=$2

if [ -z "$VOLUME_NAME" ] || [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <volume_name> <backup_file.tar.gz>"
    exit 1
fi

# Stop containers using the volume
docker compose stop $(docker ps -q --filter volume=zhengbi-yong_${VOLUME_NAME})

# Restore volume
docker run --rm \
    -v zhengbi-yong_${VOLUME_NAME}:/data \
    -v $(dirname "$BACKUP_FILE"):/backup \
    alpine tar xzf /backup/$(basename "$BACKUP_FILE") -C /data

# Start containers
docker compose start

echo "✅ Volume $VOLUME_NAME restored"
```

### Disaster Recovery Checklist / 灾难恢复清单

**Step 1: Assess Damage / 评估损失**
- [ ] Identify what's lost / 识别丢失的内容
- [ ] Determine cause / 确定原因
- [ ] Prevent further damage / 防止进一步损坏

**Step 2: Prepare for Recovery / 准备恢复**
- [ ] Verify backup integrity / 验证备份完整性
- [ ] Document current state / 记录当前状态
- [ ] Plan recovery steps / 计划恢复步骤

**Step 3: Execute Recovery / 执行恢复**
- [ ] Restore from latest good backup / 从最新的良好备份恢复
- [ ] Verify data integrity / 验证数据完整性
- [ ] Test application functionality / 测试应用功能

**Step 4: Post-Recovery / 恢复后**
- [ ] Monitor for issues / 监控问题
- [ ] Investigate root cause / 调查根本原因
- [ ] Implement preventive measures / 实施预防措施
- [ ] Update disaster recovery plan / 更新灾难恢复计划

---

## ✅ Backup Testing / 备份测试

### Regular Backup Verification / 定期备份验证

**Automated Backup Test / 自动备份测试**:

```bash
#!/bin/bash
# scripts/backup/test-backup.sh

# Create temporary database
TEMP_DB="test_restore_$(date +%Y%m%d)"
docker compose exec postgres psql -U postgres -c "CREATE DATABASE $TEMP_DB;"

# Restore latest backup to temp database
LATEST_BACKUP=$(ls -t /backups/postgres/*.sql.gz | head -1)
echo "Testing backup: $LATEST_BACKUP"
gunzip -c "$LATEST_BACKUP" | docker compose exec -T postgres psql -U blog_user $TEMP_DB

# Verify data
TABLE_COUNT=$(docker compose exec postgres psql -U blog_user $TEMP_DB -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
POST_COUNT=$(docker compose exec postgres psql -U blog_user $TEMP_DB -tAc "SELECT COUNT(*) FROM posts;")

if [ "$TABLE_COUNT" -gt 0 ] && [ "$POST_COUNT" -ge 0 ]; then
    echo "✅ Backup test PASSED"
    echo "Tables: $TABLE_COUNT, Posts: $POST_COUNT"
else
    echo "❌ Backup test FAILED"
    exit 1
fi

# Cleanup
docker compose exec postgres psql -U postgres -c "DROP DATABASE $TEMP_DB;"
```

**Schedule weekly backup tests / 每周安排备份测试**:
```bash
# Add to crontab
0 3 * * 0 /path/to/scripts/backup/test-backup.sh >> /var/log/backup-test.log 2>&1
```

---

## 📊 Backup Monitoring / 备份监控

### Monitoring Backup Success / 监控备份成功

```bash
#!/bin/bash
# Check if backup exists today
BACKUP_DATE=$(date +%Y%m%d)
BACKUP_FILE="/backups/postgres/blog_db_${BACKUP_DATE}*.sql.gz"

if ls $BACKUP_FILE 1> /dev/null 2>&1; then
    echo "✅ Backup exists for today"
    # Send success notification (optional)
    # curl -X POST https://hooks.slack.com/... -d "Backup completed successfully"
else
    echo "❌ Backup missing for today!"
    # Send alert
    # curl -X POST https://hooks.slack.com/... -d "❌ Backup failed!"
fi
```

### Backup Metrics to Track / 要跟踪的备份指标

| Metric / 指标 | Target / 目标 |
|-------------|-------------|
| **Backup success rate / 备份成功率** | >99% |
| **Backup completion time / 备份完成时间** | <5 minutes |
| **Restore test success / 恢复测试成功** | 100% |
| **Backup age / 备份年龄** | <24 hours |
| **Storage used / 已用存储** | <80% of quota |

---

## 🔒 Backup Security / 备份安全

### Encrypt Backups / 加密备份

```bash
# Encrypt backup with GPG
docker compose exec postgres pg_dump -U blog_user blog_db | \
    gzip | \
    gpg --symmetric --cipher-algo AES256 > backup.sql.gz.gpg

# Decrypt backup
gpg --decrypt backup.sql.gz.gpg | gunzip | \
    docker compose exec -T postgres psql -U blog_user blog_db
```

### Secure Backup Storage / 安全备份存储

**✅ DO / 要做**:
- ✅ Encrypt backups at rest / 静态加密备份
- ✅ Use strong encryption (AES-256) / 使用强加密（AES-256）
- ✅ Limit access to backup files / 限制对备份文件的访问
- ✅ Store encryption key separately / 单独存储加密密钥
- ✅ Test restore process regularly / 定期测试恢复流程

**❌ DON'T / 不要做**:
- ❌ Store backups on same server as database / 将备份存储在与数据库相同的服务器上
- ❌ Upload backups to public cloud without encryption / 在不加密的情况下将备份上传到公共云
- ❌ Store encryption key with backup / 将加密密钥与备份一起存储

---

## 📖 Related Documentation / 相关文档

- [Commands Reference](../reference/commands.md) - Backup and restore commands
- [Production Server Guide](../guides/server/production-server.md) - Automated backups
- [Security Best Practices](./security.md) - Backup encryption
- [Troubleshooting](../getting-started/troubleshooting-common.md) - Recovery issues

---

## ❓ FAQ / 常见问题

### Q: How often should I backup? / 应该多久备份一次？

**A / 答**: / 建议：
- **Personal blog**: Daily backups / 个人博客：每日备份
- **Production blog**: Hourly incremental + daily full / 生产博客：每小时增量 + 每日完整
- **Critical data**: Every 15 minutes (Point-in-Time Recovery) / 关键数据：每15分钟（时间点恢复）

### Q: How long should I keep backups? / 应该保留备份多久？

**A / 答**: / 推荐：
- **Daily backups**: 30 days / 每日备份：30天
- **Weekly backups**: 8 weeks / 每周备份：8周
- **Monthly backups**: 12 months / 每月备份：12个月
- **Compliance/legal**: Follow requirements (often 3-7 years) / 合规/法律：遵循要求（通常3-7年）

### Q: Should I backup Redis cache? / 应该备份Redis缓存吗？

**A / 答**: Generally no. Redis cache is temporary and can be rebuilt. Only backup if you have persistent data in Redis (sessions, rate limiting). / 通常不需要。Redis缓存是临时的，可以重建。只有在Redis中有持久数据（会话、速率限制）时才备份。

---

**Version**: 2.0 (World-Class Deployment Documentation)
**Last Updated**: 2026-01-01
**Maintained By**: Deployment Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)
