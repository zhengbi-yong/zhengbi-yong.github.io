#!/bin/bash
# 定时任务设置脚本
# 每天凌晨2点执行备份

echo "========================================"
echo "   设置自动备份定时任务"
echo "========================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-all.sh"
LOG_FILE="$SCRIPT_DIR/../logs/backup.log"

# 确保日志目录存在
mkdir -p "$(dirname "$LOG_FILE")"

# 检查备份脚本是否存在
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ 错误: 备份脚本不存在: $BACKUP_SCRIPT"
    exit 1
fi

# 添加执行权限
chmod +x "$BACKUP_SCRIPT"
echo "✓ 备份脚本已设置执行权限"
echo ""

# 添加crontab任务
echo "添加定时任务到crontab..."
(crontab -l 2>/dev/null; echo "0 2 * * * cd $(dirname "$SCRIPT_DIR")/../ && ./scripts/backup/backup-all.sh >> $LOG_FILE 2>&1") | crontab -

echo "✓ 定时任务已设置: 每天凌晨2点执行备份"
echo ""
echo "查看当前crontab: crontab -l"
echo "编辑crontab: crontab -e"
echo "查看备份日志: tail -f $LOG_FILE"
echo ""
