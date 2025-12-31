.PHONY: help dev build test clean generate-types watch-types lint

# 默认目标
help:
	@echo "Blog Frontend - 可用命令:"
	@echo ""
	@echo "  make dev            - 启动开发服务器"
	@echo "  make build          - 构建生产版本"
	@echo "  make test           - 运行测试"
	@echo "  make clean          - 清理构建文件"
	@echo "  make generate-types - 生成API类型"
	@echo "  make watch-types    - 监听OpenAPI变化自动生成类型"
	@echo "  make lint           - Lint代码"
	@echo ""

# 启动开发服务器
dev:
	@echo "🚀 启动开发服务器..."
	pnpm dev

# 构建生产版本
build:
	@echo "🔨 构建生产版本..."
	pnpm build

# 运行测试
test:
	@echo "🧪 运行测试..."
	pnpm test

# 清理构建文件
clean:
	@echo "🧹 清理构建文件..."
	rm -rf .next out node_modules/.cache

# 生成API类型
generate-types:
	@echo "📝 生成API类型..."
	pnpm generate:api-types

# 监听OpenAPI变化并自动生成类型
watch-types:
	@echo "👀 监听OpenAPI变化（Ctrl+C 退出）..."
	@while true; do \
		if [ -f openapi.json ]; then \
			MODIFIED=$$(stat -c %Y openapi.json 2>/dev/null || stat -f %m openapi.json); \
			if [ "$$MODIFIED" != "$$LAST_MODIFIED" ]; then \
				echo "📝 OpenAPI spec changed, regenerating types..."; \
				$(MAKE) generate-types; \
				LAST_MODIFIED=$$MODIFIED; \
			fi; \
		fi; \
		sleep 2; \
	done

# Lint代码
lint:
	@echo "🔎 Lint代码..."
	pnpm lint

# 修复lint问题
lint:fix:
	@echo "🔧 修复lint问题..."
	pnpm lint --fix

# 安装依赖
deps:
	@echo "📦 安装依赖..."
	pnpm install
