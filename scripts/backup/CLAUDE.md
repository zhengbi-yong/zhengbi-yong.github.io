# Backup Scripts Directory

## Purpose
Automated backup utilities for database, cache, and application data.

## Directory Structure

```
scripts/backup/
├── backup-all.sh      # Complete system backup
└── setup-cron.sh      # Automated backup scheduling
```

## Backup Scripts

### 1. Complete System Backup
**File**: `backup-all.sh`

**Purpose**: Automated backup of all critical system data

**Components**:
1. **PostgreSQL Database**
   - Container: `blog-postgres`
   - Output: `./backups/db_YYYYMMDD_HHMMSS.sql.gz`
   - Command: `docker exec blog-postgres pg_dump ... | gzip`

2. **Redis Cache**
   - Container: `blog-redis`
   - Output: `./backups/redis_YYYYMMDD_HHMMSS.rdb`
   - Method: Trigger RDB snapshot + copy file

3. **Old Backup Cleanup**
   - Retention: 7 days
   - Pattern: `*.gz`, `*.rdb` files
   - Tool: `find ... -mtime +7 -delete`

**Usage**:
```bash
cd scripts/backup
chmod +x backup-all.sh
./backup-all.sh
```

**Output Example**:
```
========================================
   博客系统自动备份脚本
========================================
开始时间: 2026-01-03 14:30:00

1️⃣  备份数据库...
   ✓ 数据库备份完成: db_20260103_143000.sql.gz

2️⃣  备份Redis...
   ✓ Redis备份完成: redis_20260103_143000.rdb

3️⃣  清理旧备份...
   ✓ 清理了 3 个旧备份文件

4️⃣  备份统计...
   📦 备份目录大小: 2.3G
   🗄️  数据库备份: 10 个
   💾 Redis备份: 10 个

========================================
   备份完成！
   完成时间: 2026-01-03 14:30:15
========================================
```

### 2. Automated Scheduling
**File**: `setup-cron.sh`

**Purpose**: Configure automated daily backups via cron

**Schedule**:
- **Frequency**: Daily at 2:00 AM
- **Crontab**: `0 2 * * * /path/to/backup-all.sh >> /var/log/backup.log 2>&1`

**Usage**:
```bash
chmod +x setup-cron.sh
sudo ./setup-cron.sh
```

**Output**:
- **Log file**: `/var/log/backup.log`
- **Notifications**: Optional email on failure

## Backup Storage

### Directory Structure
```
./backups/
├── db_20260101_020000.sql.gz
├── db_20260102_020000.sql.gz
├── redis_20260101_020000.rdb
├── redis_20260102_020000.rdb
└── ...
```

### Retention Policy
- **Database**: 7 days (configurable)
- **Redis**: 7 days (configurable)
- **Cleanup**: Automatic during each backup

### Size Estimation
- **Database**: ~50-200MB per backup (compressed)
- **Redis**: ~1-5MB per backup
- **Total weekly**: ~350-1,400MB

## Restore Procedures

### Database Restore
```bash
# List available backups
ls -lh ./backups/db_*.sql.gz

# Restore specific backup
gunzip -c ./backups/db_20260103_143000.sql.gz | \
  docker exec -i blog-postgres psql -U blog_user -d blog_db
```

### Redis Restore
```bash
# Stop Redis container
docker stop blog-redis

# Copy backup to container data directory
docker cp ./backups/redis_20260103_143000.rdb \
  blog-redis:/data/dump.rdb

# Start Redis container
docker start blog-redis
```

## Backup Validation

### Automated Checks
```bash
# Verify backup file integrity
gzip -t ./backups/db_20260103_143000.sql.gz

# Check backup size (should be > 0)
ls -lh ./backups/db_*.sql.gz | awk '{print $5}'

# Count backups
ls -1 ./backups/db_*.sql.gz | wc -l
```

### Test Restore
```bash
# Create test database
docker exec blog-postgres psql -U blog_user -c "CREATE DATABASE test_restore;"

# Restore to test database
gunzip -c ./backups/db_20260103_143000.sql.gz | \
  docker exec -i blog-postgres psql -U blog_user -d test_restore

# Verify data
docker exec blog-postgres psql -U blog_user -d test_restore -c "SELECT COUNT(*) FROM posts;"

# Cleanup test database
docker exec blog-postgres psql -U blog_user -c "DROP DATABASE test_restore;"
```

## Monitoring

### Log Monitoring
```bash
# View backup logs
tail -f /var/log/backup.log

# Check for errors
grep -i "error\|failed" /var/log/backup.log
```

### Alerts (Optional)
Configure email alerts for backup failures:
```bash
# In crontab
0 2 * * * /path/to/backup-all.sh 2>&1 | tee -a /var/log/backup.log | \
  mail -s "Backup Status" admin@example.com
```

## Best Practices

### 1. Backup Security
- **Encrypt**: Consider GPG encryption for sensitive data
- **Permissions**: Restrict backup file permissions (600 or 700)
- **Off-site**: Copy backups to remote storage (S3, GCS, etc.)

### 2. Backup Frequency
- **Production**: Daily backups
- **Development**: Weekly backups (optional)
- **Pre-deployment**: Manual backup before major changes

### 3. Testing
- **Monthly**: Test restore procedure
- **Quarterly**: Full disaster recovery drill
- **Documentation**: Keep restore instructions up-to-date

### 4. Storage Management
- **Monitor**: Check disk space weekly
- **Cleanup**: Automatic old file deletion
- **Compression**: Use gzip to save space

## Disaster Recovery

### Recovery Checklist
1. [ ] Stop application services
2. [ ] Restore database from latest backup
3. [ ] Restore Redis cache (if critical)
4. [ ] Verify data integrity
5. [ ] Restart services
6. [ ] Test application functionality
7. [ ] Monitor logs for issues

### Recovery Time Objectives
- **RTO (Recovery Time)**: < 1 hour
- **RPO (Recovery Point)**: < 24 hours (last backup)

## Related Modules
- `scripts/deployment/` - Deployment scripts
- `backend/docker-compose.yml` - Database service configuration
- `docs/operations/` - Operational procedures
- `scripts/data/sync/` - Data synchronization
