#!/bin/bash
set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "========================================"
echo "   博客系统自动备份脚本"
echo "========================================"
echo "开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 确保备份目录存在
mkdir -p "$BACKUP_DIR"

# 备份数据库
echo "1️⃣  备份数据库..."
if docker ps | grep -q blog-postgres; then
    docker exec blog-postgres pg_dump -U blog_user blog_db | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"
    echo "   ✓ 数据库备份完成: db_$DATE.sql.gz"
else
    echo "   ⚠️  PostgreSQL容器未运行，跳过数据库备份"
fi

# 备份Redis
echo ""
echo "2️⃣  备份Redis..."
if docker ps | grep -q blog-redis; then
    docker exec blog-redis redis-cli --rdb /data/dump.rdb > /dev/null 2>&1
    # 复制RDB文件到备份目录
    docker cp blog-redis:/data/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb" 2>/dev/null || echo "   ⚠️  Redis RDB文件复制失败"
    echo "   ✓ Redis备份完成: redis_$DATE.rdb"
else
    echo "   ⚠️  Redis容器未运行，跳过Redis备份"
fi

# 清理7天前的备份
echo ""
echo "3️⃣  清理旧备份..."
if command -v find >/dev/null 2>&1; then
    OLD_BACKUPS=$(find "$BACKUP_DIR" -name "*.gz" -mtime +7 2>/dev/null | wc -l)
    find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete 2>/dev/null
    find "$BACKUP_DIR" -name "*.rdb" -mtime +7 -delete 2>/dev/null
    echo "   ✓ 清理了 $OLD_BACKUPS 个旧备份文件"
else
    echo "   ⚠️  find命令不可用，跳过清理"
fi

# 统计备份信息
echo ""
echo "4️⃣  备份统计..."
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
DB_COUNT=$(ls -1 "$BACKUP_DIR"/db_*.gz 2>/dev/null | wc -l)
REDIS_COUNT=$(ls -1 "$BACKUP_DIR"/redis_*.rdb 2>/dev/null | wc -l)

echo "   📦 备份目录大小: $TOTAL_SIZE"
echo "   🗄️  数据库备份: $DB_COUNT 个"
echo "   💾 Redis备份: $REDIS_COUNT 个"

echo ""
echo "========================================"
echo "   备份完成！"
echo "   完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
echo ""
