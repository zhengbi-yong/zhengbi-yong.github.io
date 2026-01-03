#!/bin/bash
# 批量更新模块文档
# 用法: ./batch_update_modules.sh <layer> <start_index> <end_index>

LAYER=$1
START_INDEX=$2
END_INDEX=$3

if [ -z "$LAYER" ] || [ -z "$START_INDEX" ] || [ -z "$END_INDEX" ]; then
  echo "用法: $0 <layer> <start_index> <end_index>"
  exit 1
fi

# 定义模块路径
case $LAYER in
  3)
    MODULES=(
      "frontend/src/app/admin/posts/show/[slug]"
      "frontend/src/app/tags/[tag]/page/[page]"
      "frontend/src/app/admin/monitoring/health"
      "frontend/src/app/admin/monitoring/metrics"
      "backend/crates/api/src/metrics"
      "backend/crates/api/src/middleware"
      "backend/crates/api/src/routes"
      "backend/crates/api/src/utils"
      "backend/crates/db/src/models"
      "backend/crates/shared/src/middleware"
      "frontend/src/app/admin/analytics"
      "frontend/src/app/admin/comments"
      "frontend/src/app/admin/monitoring"
      "frontend/src/app/admin/posts"
      "frontend/src/app/admin/posts-refine"
      "frontend/src/app/admin/posts-simple"
      "frontend/src/app/admin/settings"
      "frontend/src/app/admin/test"
      "frontend/src/app/admin/users"
      "frontend/src/app/admin/users-refine"
      "frontend/src/app/api/newsletter"
      "frontend/src/app/api/visitor"
      "frontend/src/app/api/visitors"
      "frontend/src/app/music/[name]"
      "frontend/src/app/tags/[tag]"
      "frontend/src/components/media/Image"
      "frontend/src/components/navigation/TableOfContents"
      "frontend/src/components/shadcn/ui"
      "frontend/src/components/ui/Skeleton"
      "frontend/src/components/ui/Toast"
      "frontend/src/lib/store/core"
      "backend/crates/api/src"
      "backend/crates/api/tests"
      "backend/crates/core/src"
      "backend/crates/db/src"
      "backend/crates/shared/src"
      "backend/crates/worker/src"
      "docs/deployment/guides/docker"
      "docs/deployment/guides/low-resource"
      "docs/deployment/guides/scripts"
      "docs/deployment/guides/server"
      "docs/development/guides/backend-development"
      "docs/development/guides/frontend-development"
      "docs/development/guides/testing"
      "frontend/src/app/about"
      "frontend/src/app/admin"
      "frontend/src/app/analytics"
      "frontend/src/app/excalidraw"
      "frontend/src/app/experiment"
      "frontend/src/app/music"
      "frontend/src/app/offline"
      "frontend/src/app/projects"
      "frontend/src/app/simple-test"
      "frontend/src/app/tags"
      "frontend/src/app/visitors"
      "frontend/src/components/admin"
      "frontend/src/components/animations"
      "frontend/src/components/audio"
      "frontend/src/components/auth"
      "frontend/src/components/book"
      "frontend/src/components/charts"
      "frontend/src/components/chemistry"
      "frontend/src/components/debug"
      "frontend/src/components/Excalidraw"
      "frontend/src/components/header"
      "frontend/src/components/home"
      "frontend/src/components/hooks"
      "frontend/src/components/layouts"
      "frontend/src/components/lib"
      "frontend/src/components/loaders"
      "frontend/src/components/magazine"
      "frontend/src/components/maps"
      "frontend/src/components/MDXComponents"
      "frontend/src/components/post"
      "frontend/src/components/search"
      "frontend/src/components/sections"
      "frontend/src/components/seo"
      "frontend/src/components/social-icons"
      "frontend/src/components/three"
      "frontend/src/components/ui"
      "frontend/src/lib/api"
      "frontend/src/lib/cache"
      "frontend/src/lib/db"
      "frontend/src/lib/hooks"
      "frontend/src/lib/providers"
      "frontend/src/lib/security"
      "frontend/src/lib/store"
      "frontend/src/lib/types"
      "frontend/src/lib/ui"
      "frontend/src/lib/utils"
      "frontend/src/payload/collections"
      "backend/crates/api"
      "backend/crates/core"
      "backend/crates/db"
      "backend/crates/shared"
      "backend/crates/worker"
      "backend/scripts/data"
      "backend/scripts/database"
      "backend/scripts/deployment"
      "backend/scripts/development"
      "backend/scripts/openapi"
      "backend/scripts/testing"
      "docs/deployment/archive"
      "docs/deployment/best-practices"
      "docs/deployment/concepts"
      "docs/deployment/getting-started"
      "docs/deployment/guides"
      "docs/deployment/reference"
      "docs/development/archive"
      "docs/development/best-practices"
      "docs/development/concepts"
      "docs/development/getting-started"
      "docs/development/operations"
      "docs/development/reference"
      "docs/guides/technical"
      "frontend/data/authors"
      "frontend/scripts/dev"
      "frontend/scripts/generate"
      "frontend/scripts/test"
      "frontend/src/app"
      "frontend/src/components"
      "frontend/src/lib"
      "frontend/src/mocks"
      "frontend/src/styles"
      "frontend/styles/tokens"
    )
    STRATEGY="multi-layer"
    ;;
  2)
    MODULES=(
      "backend/.cargo"
      "backend/.sqlx"
      "backend/migrations"
      "backend/openapi"
      "backend/scripts"
      "docs/appendix"
      "docs/archive"
      "docs/configuration"
      "docs/deployment"
      "docs/development"
      "docs/getting-started"
      "docs/guides"
      "docs/migration"
      "docs/operations"
      "docs/reference"
      "docs/testing"
      "frontend/data"
      "frontend/e2e"
      "frontend/scripts"
      "frontend/src"
      "frontend/tests"
      "frontend/types"
      "scripts/archive"
      "scripts/backup"
      "scripts/data"
      "scripts/deployment"
      "scripts/dev"
      "scripts/export"
      "scripts/operations"
      "scripts/testing"
      "scripts/utils"
      "backend"
      "docs"
      "frontend"
      "scripts"
    )
    STRATEGY="single-layer"
    ;;
  1)
    MODULES=(".")
    STRATEGY="single-layer"
    ;;
  *)
    echo "无效的层级: $LAYER"
    exit 1
    ;;
esac

# 批量处理模块
for ((i=START_INDEX; i<=END_INDEX; i++)); do
  if [ $i -ge ${#MODULES[@]} ]; then
    break
  fi

  MODULE="${MODULES[$i]}"
  echo "处理模块 [$((i+1))/${#MODULES[@]}]: $MODULE"

  # 尝试工具回退链
  for TOOL in gemini qwen codex; do
    echo "  尝试工具: $TOOL"

    cd "$MODULE" && ccw tool exec update_module_claude "{\"strategy\":\"$STRATEGY\",\"path\":\".\",\"tool\":\"$TOOL\"}" 2>&1
    EXIT_CODE=$?

    cd - > /dev/null 2>&1

    if [ $EXIT_CODE -eq 0 ]; then
      echo "  ✅ $MODULE 更新成功 (工具: $TOOL)"
      break
    else
      echo "  ⚠️  $MODULE 更新失败 (工具: $TOOL)，尝试下一个工具..."
    fi
  done

  echo ""
done

echo "批次 $LAYER [$START_INDEX-$END_INDEX] 完成"
