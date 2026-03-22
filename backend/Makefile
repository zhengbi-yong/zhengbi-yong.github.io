.PHONY: help build run test clean export-spec watch-spec db-migrate db-shell

# 默认目标
help:
	@echo "Blog Backend - 可用命令:"
	@echo ""
	@echo "  make build         - 构建项目"
	@echo "  make run           - 运行开发服务器"
	@echo "  make test          - 运行测试"
	@echo "  make clean         - 清理构建文件"
	@echo "  make export-spec    - 导出OpenAPI规范"
	@echo "  make watch-spec    - 监听OpenAPI变化自动导出"
	@echo "  make db-migrate    - 运行数据库迁移"
	@echo "  make db-shell      - 进入数据库shell"
	@echo ""

# 构建项目
build:
	@echo "🔨 构建后端..."
	cargo build --release

# 运行开发服务器
run:
	@echo "🚀 启动开发服务器..."
	cargo run --bin api

# 运行测试
test:
	@echo "🧪 运行测试..."
	cargo test --workspace

# 清理构建文件
clean:
	@echo "🧹 清理构建文件..."
	cargo clean

# 导出OpenAPI规范（直接从源码生成）
export-spec:
	@echo "📝 导出OpenAPI规范..."
	cargo run --locked --bin export_openapi

# 监听OpenAPI变化并自动导出
watch-spec:
	@echo "👀 监听OpenAPI变化（Ctrl+C 退出）..."
	@while true; do \
		sleep 5; \
		$(MAKE) export-spec > /dev/null 2>&1 || true; \
	done

# 数据库迁移
db-migrate:
	@echo "🗄️  运行数据库迁移..."
	cargo run --bin api -- migrate

# 进入数据库shell
db-shell:
	@echo "🐘 进入PostgreSQL shell..."
	docker-compose exec postgres psql -U blog_user -d blog_db

# 安装依赖
deps:
	@echo "📦 安装Rust依赖..."
	cargo fetch

# 格式化代码
fmt:
	@echo "🎨 格式化代码..."
	cargo fmt --all

# 检查代码（不构建）
check:
	@echo "🔍 检查代码..."
	cargo check --workspace

# Lint代码
lint:
	@echo "🔎 Lint代码..."
	cargo clippy --workspace -- -D warnings
