#!/usr/bin/env bash
# 导出所有镜像为 tar 文件
# 用于在没有网络的环境中部署

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}"
cd "$PROJECT_ROOT"

# 检查 Docker 是否可用
if command -v docker &> /dev/null; then
    DOCKER_CMD="docker"
elif [ -x "/usr/bin/docker" ]; then
    DOCKER_CMD="/usr/bin/docker"
else
    log_error "Docker未安装或不在PATH中"
    exit 1
fi

# 创建导出目录
EXPORT_DIR="$PROJECT_ROOT/docker-images-export"
mkdir -p "$EXPORT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  导出所有 Docker 镜像${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

log_info "导出目录: $EXPORT_DIR"
echo ""

# 导出基础镜像
log_info "步骤 1/3: 导出基础镜像..."
$DOCKER_CMD save postgres:17-alpine -o "$EXPORT_DIR/postgres-17-alpine.tar" &
$DOCKER_CMD save redis:7.4-alpine -o "$EXPORT_DIR/redis-7.4-alpine.tar" &
$DOCKER_CMD save nginx:1.27-alpine -o "$EXPORT_DIR/nginx-1.27-alpine.tar" &
wait
log_info "基础镜像导出完成 ✓"
echo ""

# 导出应用镜像
log_info "步骤 2/3: 导出应用镜像..."
$DOCKER_CMD save blog-backend:local -o "$EXPORT_DIR/blog-backend-local.tar" &
$DOCKER_CMD save blog-frontend:local -o "$EXPORT_DIR/blog-frontend-local.tar" &
wait
log_info "应用镜像导出完成 ✓"
echo ""

# 显示文件大小
log_info "步骤 3/3: 导出文件信息:"
echo ""
echo -e "${BLUE}导出的文件:${NC}"
ls -lh "$EXPORT_DIR"
echo ""

# 计算总大小
total_size=$(du -sh "$EXPORT_DIR" | cut -f1)
log_info "总大小: $total_size"
echo ""

# 创建导入脚本
log_info "创建导入脚本..."
cat > "$EXPORT_DIR/import-images.sh" << 'EOF'
#!/usr/bin/env bash
# 在服务器上导入所有镜像

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "  导入 Docker 镜像"
echo "=========================================="
echo ""

log_info "步骤 1/2: 导入基础镜像..."
docker load -i postgres-17-alpine.tar &
docker load -i redis-7.4-alpine.tar &
docker load -i nginx-1.27-alpine.tar &
wait
log_info "基础镜像导入完成 ✓"
echo ""

log_info "步骤 2/2: 导入应用镜像..."
docker load -i blog-backend-local.tar &
docker load -i blog-frontend-local.tar &
wait
log_info "应用镜像导入完成 ✓"
echo ""

log_info "所有镜像导入完成！"
echo ""
echo "查看镜像: docker images | grep -E 'postgres|redis|nginx|blog-'"
echo ""
EOF

chmod +x "$EXPORT_DIR/import-images.sh"

# 创建 README
cat > "$EXPORT_DIR/README.md" << 'EOF'
# Docker 镜像导出包

本目录包含了所有构建好的 Docker 镜像。

## 文件说明

- `postgres-17-alpine.tar` - PostgreSQL 数据库镜像
- `redis-7.4-alpine.tar` - Redis 缓存镜像
- `nginx-1.27-alpine.tar` - Nginx 反向代理镜像
- `blog-backend-local.tar` - 后端 API 镜像
- `blog-frontend-local.tar` - 前端应用镜像

## 在服务器上部署

### 1. 上传到服务器

```bash
# 方法 1: 使用 scp
scp -r docker-images-export/ user@server:/path/to/project/

# 方法 2: 使用 rsync
rsync -avz docker-images-export/ user@server:/path/to/project/
```

### 2. 导入镜像

```bash
cd docker-images-export
bash import-images.sh
```

### 3. 部署应用

确保项目的 `docker-compose.yml` 配置为使用本地镜像：

```bash
cd /path/to/project
docker compose up -d
```

## 清理

部署完成后可以删除导出目录：

```bash
rm -rf docker-images-export
```
EOF

log_info "导入脚本和 README 已创建 ✓"
echo ""

log_info "导出完成！"
echo ""
echo -e "${YELLOW}下一步操作:${NC}"
echo "  1. 将 docker-images-export/ 目录上传到服务器"
echo "  2. 在服务器上运行: cd docker-images-export && bash import-images.sh"
echo ""
