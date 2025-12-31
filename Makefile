.PHONY: help dev build test clean install setup-db dev-backend dev-shell dev-migrate dev-create-admin

# 默认目标
help:
	@echo "Blog Platform - 可用命令:"
	@echo ""
	@echo "  make setup         - 初始化开发环境"
	@echo "  make dev           - 启动前后端开发服务器"
	@echo "  make build         - 构建前后端"
	@echo "  make test          - 运行所有测试"
	@echo "  make clean         - 清理所有构建文件"
	@echo "  make install       - 安装所有依赖"
	@echo "  make setup-db      - 启动数据库服务"
	@echo "  make generate-api  - 生成API类型"
	@echo ""

# 初始化开发环境
setup:
	@echo "🚀 初始化开发环境..."
	@echo "📦 安装后端依赖..."
	cd backend && cargo fetch
	@echo "📦 安装前端依赖..."
	cd frontend && pnpm install
	@echo "✅ 开发环境初始化完成！"
	@echo ""
	@echo "💡 下一步:"
	@echo "   1. 启动数据库: make setup-db"
	@echo "   2. 启动后端: cd backend && make run"
	@echo "   3. 启动前端: cd frontend && make dev"

# 启动前后端开发服务器
dev:
	@echo "🚀 启动前后端开发服务器..."
	@echo "💡 在新终端窗口中运行:"
	@echo "   - 后端: cd backend && make run"
	@echo "   - 前端: cd frontend && make dev"

# 构建前后端
build:
	@echo "🔨 构建后端..."
	cd backend && cargo build --release
	@echo "🔨 构建前端..."
	cd frontend && pnpm build
	@echo "✅ 构建完成！"

# 运行所有测试
test:
	@echo "🧪 运行后端测试..."
	cd backend && cargo test
	@echo "🧪 运行前端测试..."
	cd frontend && pnpm test

# 清理所有构建文件
clean:
	@echo "🧹 清理后端..."
	cd backend && cargo clean
	@echo "🧹 清理前端..."
	cd frontend && rm -rf .next out node_modules/.cache
	@echo "✅ 清理完成！"

# 安装所有依赖
install:
	@echo "📦 安装后端依赖..."
	cd backend && cargo fetch
	@echo "📦 安装前端依赖..."
	cd frontend && pnpm install
	@echo "✅ 依赖安装完成！"

# 启动数据库服务
setup-db:
	@echo "🗄️  启动数据库服务..."
	docker-compose up -d postgres redis
	@echo "✅ 数据库服务已启动！"
	@echo ""
	@echo "💡 数据库连接:"
	@echo "   PostgreSQL: localhost:5432"
	@echo "   Redis: localhost:6379"

# 生成API类型（后端必须运行）
generate-api:
	@echo "📝 生成API类型..."
	cd backend && make export-spec
	cd frontend && make generate-types
	@echo "✅ API类型生成完成！"

# 运行数据库迁移
db-migrate:
	@echo "🗄️  运行数据库迁移..."
	cd backend && make db-migrate

# 查看日志
logs:
	docker-compose logs -f

# 停止所有服务
stop:
	@echo "🛑 停止所有服务..."
	docker-compose down
	@echo "✅ 服务已停止！"

# 重启所有服务
restart: stop setup-db
	@echo "✅ 服务已重启！"

# =============================================================================
# Docker 开发环境命令
# =============================================================================

# 启动开发环境后端
dev-backend:
	@echo "🚀 启动开发环境后端..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d backend
	@echo "✅ 开发后端已启动"
	@echo "💡 使用 'make dev-shell' 进入容器"

# 进入开发容器
dev-shell:
	@echo "🐚 进入开发容器..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend bash

# 运行迁移（开发环境）
dev-migrate:
	@echo "🗄️  运行数据库迁移（开发环境）..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend cargo run --bin api -- migrate

# 创建管理员（开发环境）
dev-create-admin:
	@echo "👤 创建管理员账户（开发环境）..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend cargo run --bin create_admin

# 停止开发环境
dev-stop:
	@echo "🛑 停止开发环境..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down
	@echo "✅ 开发环境已停止"
