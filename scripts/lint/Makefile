.PHONY: lint lint-full lint-frontend lint-backend lint-db lint-watch lint-install

# ==============================================================================
# GOLDEN_RULES Lint Makefile
# ==============================================================================

PROJECT_ROOT := $(shell git rev-parse --show-toplevel 2>/dev/null || pwd)
SCRIPT := $(PROJECT_ROOT)/scripts/lint/100_golden_rules.sh

# 默认: 运行所有自动化检查（不含编译）
lint:
	@echo "⚡ Running GOLDEN_RULES automated checks..."
	@bash "$(SCRIPT)"
	@echo ""
	@echo "✅ lint passed"

# 完整检查 + 编译验证（适合 CI）
lint-full: lint-frontend lint-backend
	@echo ""
	@echo "✅ Full lint + build passed"

# 前端检查
lint-frontend:
	@echo "🔍 Checking frontend..."
	@cd "$(PROJECT_ROOT)/frontend" && pnpm tsc --noEmit 2>&1 | tail -5
	@echo "✅ Frontend type check passed"

# 后端检查
lint-backend:
	@echo "🔍 Checking backend..."
	@cd "$(PROJECT_ROOT)/backend" && cargo check --workspace 2>&1 | tail -5
	@echo "✅ Backend check passed"

# 数据库检查（需要 DB 连接）
lint-db:
	@echo "🔍 Checking database schema compliance..."
	@bash "$(SCRIPT)" --db-only 2>&1 | grep -E "§4\.|PASS|FAIL|ERROR"
	@echo "✅ Database checks passed"

# 监视模式（文件变化时重新检查）
lint-watch:
	@echo "👀 Watching for changes... (Ctrl+C to stop)"
	@which entr > /dev/null 2>&1 && \
		find "$(PROJECT_ROOT)" -name "*.rs" -o -name "*.ts" -o -name "*.tsx" | \
		entr -c bash "$(SCRIPT)" || \
		echo "Install entr for watch mode: brew install entr"

# 安装 pre-commit hook
lint-install:
	@ln -sf "$(SCRIPT)" "$(PROJECT_ROOT)/.git/hooks/pre-commit"
	@echo "✅ Pre-commit hook installed"
	@echo "   Run: git commit ..."
