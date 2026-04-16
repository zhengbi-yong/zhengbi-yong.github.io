.PHONY: help dev build test clean install setup-db dev-backend dev-shell dev-migrate dev-create-admin lint-docs deploy-prod-validate deploy-prod-up deploy-prod-up-build deploy-prod-migrate print-version-metadata render-release-assets validate-k8s-apply generate-prod-env generate-ci-prod-env verify-api-contract smoke-prod-compose smoke-prod-compose-fast bootstrap-remote-host deploy-remote-compose refresh-remote-compose provision-remote-compose

# 默认目标
help:
	@echo "Blog Platform - 可用命令:"
	@echo ""
	@echo "  make setup         - 初始化开发环境"
	@echo "  make dev           - 启动前后端开发服务器"
	@echo "  make build         - 构建前后端"
	@echo "  make test          - 运行所有测试"
	@echo "  make lint-docs     - 校验维护中的 Markdown 文档与链接"
	@echo "  make clean         - 清理所有构建文件"
	@echo "  make install       - 安装所有依赖"
	@echo "  make setup-db      - 启动数据库服务"
	@echo "  make generate-api  - 生成API类型"
	@echo "  make print-version-metadata - 输出当前发布元数据"
	@echo "  make render-release-assets - 生成版本化部署资产"
	@echo "  make validate-k8s-apply - 在本地 kind 集群验证 kubectl apply"
	@echo "  make generate-prod-env - 生成带安全默认值的生产环境文件"
	@echo "  make generate-ci-prod-env - 生成 CI/冒烟测试用生产环境文件"
	@echo "  make verify-api-contract - 校验 OpenAPI 与前端类型产物无漂移"
	@echo "  make smoke-prod-compose - 构建并冒烟验证 production Compose 栈"
	@echo "  make smoke-prod-compose-fast - 复用当前镜像快速冒烟验证 production Compose 栈"
	@echo "  make bootstrap-remote-host - 远程安装 Docker/Compose 部署前置条件"
	@echo "  make deploy-remote-compose - 通过 SSH 将 Compose 运行时发布到服务器"
	@echo "  make refresh-remote-compose - 复用远端 env 并只重启受影响服务的快速更新部署"
	@echo "  make provision-remote-compose - 一条命令生成 env、引导服务器并部署"
	@echo "  make deploy-prod-validate - 校验生产环境变量"
	@echo "  make deploy-prod-up - 按标准生产栈部署"
	@echo ""

# 初始化开发环境
setup:
	@echo "🚀 初始化开发环境..."
	@echo "📦 安装仓库级工具..."
	pnpm install
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

lint-docs:
	@echo "📝 校验维护中的文档..."
	pnpm docs:check

# 清理所有构建文件
clean:
	@echo "🧹 清理后端..."
	cd backend && cargo clean
	@echo "🧹 清理前端..."
	cd frontend && rm -rf .next out node_modules/.cache
	@echo "✅ 清理完成！"

# 安装所有依赖
install:
	@echo "📦 安装仓库级工具..."
	pnpm install
	@echo "📦 安装后端依赖..."
	cd backend && cargo fetch
	@echo "📦 安装前端依赖..."
	cd frontend && pnpm install
	@echo "✅ 依赖安装完成！"

# 启动数据库服务
setup-db:
	@echo "🗄️  启动数据库服务..."
	docker compose -f deployments/docker/compose-files/dev/docker-compose.yml up -d postgres redis
	@echo "✅ 数据库服务已启动！"
	@echo ""
	@echo "💡 数据库连接:"
	@echo "   PostgreSQL: localhost:5432"
	@echo "   Redis: localhost:6379"

# 生成API类型（直接从源码导出）
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
	docker compose -f deployments/docker/compose-files/dev/docker-compose.yml logs -f

# 停止所有服务
stop:
	@echo "🛑 停止所有服务..."
	docker compose -f deployments/docker/compose-files/dev/docker-compose.yml down
	@echo "✅ 服务已停止！"

# 重启所有服务
restart: stop setup-db
	@echo "✅ 服务已重启！"

# =============================================================================
# 本地开发命令
# =============================================================================

dev-backend:
	@echo "🚀 启动开发基础设施并运行后端..."
	docker compose -f deployments/docker/compose-files/dev/docker-compose.yml up -d postgres redis meilisearch minio
	cd backend && cargo run --bin api

dev-shell:
	@echo "🐚 打开后端工作目录 shell..."
	cd backend && $$SHELL

dev-migrate:
	@echo "🗄️  启动基础设施并运行迁移..."
	docker compose -f deployments/docker/compose-files/dev/docker-compose.yml up -d postgres redis
	cd backend && cargo run --bin migrate

dev-create-admin:
	@echo "👤 启动基础设施并创建管理员账户..."
	docker compose -f deployments/docker/compose-files/dev/docker-compose.yml up -d postgres redis
	cd backend && cargo run --bin create_admin

dev-stop:
	@echo "🛑 停止开发环境..."
	docker compose -f deployments/docker/compose-files/dev/docker-compose.yml down
	@echo "✅ 开发环境已停止"

# =============================================================================
# 标准生产部署命令
# =============================================================================

deploy-prod-validate:
	@bash scripts/deployment/validate-production-env.sh .env.production

deploy-prod-up:
	@bash scripts/deployment/deploy-compose-stack.sh --env-file .env.production

deploy-prod-up-build:
	@bash scripts/deployment/deploy-compose-stack.sh --env-file .env.production --build

deploy-prod-migrate:
	@docker compose --env-file .env.production -f deployments/docker/compose-files/prod/docker-compose.yml --profile ops run --rm migrate

print-version-metadata:
	@bash scripts/release/oci-metadata.sh

render-release-assets:
	@bash scripts/release/render-release-assets.sh \
		$(if $(VERSION),--version $(VERSION),) \
		$(if $(REPOSITORY),--repository $(REPOSITORY),) \
		$(if $(REGISTRY),--registry $(REGISTRY),) \
		$(if $(BACKEND_DIGEST),--backend-digest $(BACKEND_DIGEST),) \
		$(if $(FRONTEND_DIGEST),--frontend-digest $(FRONTEND_DIGEST),) \
		$(if $(GITOPS_REPO_URL),--gitops-repo-url $(GITOPS_REPO_URL),) \
		$(if $(GITOPS_TARGET_REVISION),--gitops-target-revision $(GITOPS_TARGET_REVISION),) \
		$(if $(GITOPS_BASE_PATH),--gitops-base-path $(GITOPS_BASE_PATH),) \
		$(if $(ARGOCD_NAMESPACE),--argocd-namespace $(ARGOCD_NAMESPACE),) \
		$(if $(ARGOCD_PROJECT),--argocd-project $(ARGOCD_PROJECT),)

validate-k8s-apply:
	@bash scripts/deployment/validate-kubernetes-apply.sh \
		$(if $(RELEASE_VERSION),--release-version $(RELEASE_VERSION),) \
		$(if $(RELEASE_DIR),--release-dir $(RELEASE_DIR),) \
		$(if $(KIND_CLUSTER_NAME),--cluster-name $(KIND_CLUSTER_NAME),) \
		$(if $(KUBECONFIG_PATH),--kubeconfig $(KUBECONFIG_PATH),) \
		$(if $(TOOLS_DIR),--tools-dir $(TOOLS_DIR),) \
		$(if $(ARGOCD_NAMESPACE),--argocd-namespace $(ARGOCD_NAMESPACE),)

generate-prod-env:
	@bash scripts/deployment/generate-production-env.sh \
		$(if $(OUTPUT_FILE),--output $(OUTPUT_FILE),) \
		$(if $(PUBLIC_HOST),--public-host $(PUBLIC_HOST),) \
		$(if $(SITE_URL),--site-url $(SITE_URL),) \
		$(if $(SCHEME),--scheme $(SCHEME),) \
		$(if $(RELEASE_VERSION),--release-version $(RELEASE_VERSION),) \
		$(if $(REPOSITORY),--repository $(REPOSITORY),) \
		$(if $(REGISTRY),--registry $(REGISTRY),) \
		$(if $(BACKEND_IMAGE),--backend-image $(BACKEND_IMAGE),) \
		$(if $(FRONTEND_IMAGE),--frontend-image $(FRONTEND_IMAGE),) \
		$(if $(ENABLE_MEILISEARCH),--enable-bundled-meilisearch,) \
		$(if $(ENABLE_MINIO),--enable-bundled-minio,) \
		$(if $(ENABLE_MAILPIT),--enable-bundled-mailpit,) \
		$(if $(SMTP_MODE),--smtp-mode $(SMTP_MODE),)

generate-ci-prod-env:
	@bash scripts/deployment/generate-ci-production-env.sh \
		$(if $(OUTPUT_FILE),--output $(OUTPUT_FILE),) \
		$(if $(PROJECT_NAME),--project-name $(PROJECT_NAME),) \
		$(if $(SITE_URL),--site-url $(SITE_URL),) \
		$(if $(EDGE_PORT),--edge-port $(EDGE_PORT),) \
		$(if $(BACKEND_PORT),--backend-port $(BACKEND_PORT),) \
		$(if $(FRONTEND_PORT),--frontend-port $(FRONTEND_PORT),) \
		$(if $(POSTGRES_PORT),--postgres-port $(POSTGRES_PORT),) \
		$(if $(REDIS_PORT),--redis-port $(REDIS_PORT),)

verify-api-contract:
	@bash scripts/testing/verify-api-contract.sh

smoke-prod-compose:
	@bash scripts/testing/smoke-production-compose.sh \
		$(if $(ENV_FILE),--env-file $(ENV_FILE),) \
		$(if $(KEEP_RUNNING),--keep-running,) \
		$(if $(SKIP_BUILD),--skip-build,)

smoke-prod-compose-fast:
	@bash scripts/testing/smoke-production-compose.sh \
		$(if $(ENV_FILE),--env-file $(ENV_FILE),) \
		$(if $(KEEP_RUNNING),--keep-running,) \
		--skip-build

bootstrap-remote-host:
	@bash scripts/deployment/bootstrap-remote-host.sh \
		$(if $(TARGET),--target $(TARGET),) \
		$(if $(SSH_PORT),--ssh-port $(SSH_PORT),) \
		$(if $(SSH_KEY),--identity-file $(SSH_KEY),) \
		$(if $(CONFIGURE_FIREWALL),--configure-firewall,)

deploy-remote-compose:
	@bash scripts/deployment/deploy-remote-compose.sh \
		$(if $(TARGET),--target $(TARGET),) \
		$(if $(ENV_FILE),--env-file $(ENV_FILE),) \
		$(if $(REMOTE_DIR),--remote-dir $(REMOTE_DIR),) \
		$(if $(SSH_PORT),--ssh-port $(SSH_PORT),) \
		$(if $(SSH_KEY),--identity-file $(SSH_KEY),) \
		$(if $(BOOTSTRAP),--bootstrap,) \
		$(if $(SKIP_MIGRATE),--skip-migrate,) \
		$(if $(DRY_RUN),--dry-run,)

refresh-remote-compose:
	@bash scripts/deployment/refresh-remote-compose.sh \
		$(if $(TARGET),--target $(TARGET),) \
		$(if $(REMOTE_DIR),--remote-dir $(REMOTE_DIR),) \
		$(if $(SSH_PORT),--ssh-port $(SSH_PORT),) \
		$(if $(SSH_KEY),--identity-file $(SSH_KEY),) \
		$(if $(BUILD_LOCAL_IMAGES),--build-local-images,) \
		$(if $(SKIP_MIGRATE),--skip-migrate,) \
		$(if $(RUN_MIGRATE),--run-migrate,)

provision-remote-compose:
	@bash scripts/deployment/provision-compose-host.sh \
		$(if $(TARGET),--target $(TARGET),) \
		$(if $(PUBLIC_HOST),--public-host $(PUBLIC_HOST),) \
		$(if $(SITE_URL),--site-url $(SITE_URL),) \
		$(if $(SCHEME),--scheme $(SCHEME),) \
		$(if $(RELEASE_VERSION),--release-version $(RELEASE_VERSION),) \
		$(if $(REPOSITORY),--repository $(REPOSITORY),) \
		$(if $(REGISTRY),--registry $(REGISTRY),) \
		$(if $(REMOTE_DIR),--remote-dir $(REMOTE_DIR),) \
		$(if $(SSH_PORT),--ssh-port $(SSH_PORT),) \
		$(if $(SSH_KEY),--identity-file $(SSH_KEY),) \
		$(if $(SMTP_MODE),--smtp-mode $(SMTP_MODE),) \
		$(if $(ENABLE_MEILISEARCH),--enable-bundled-meilisearch,) \
		$(if $(ENABLE_MINIO),--enable-bundled-minio,) \
		$(if $(ENABLE_MAILPIT),--enable-bundled-mailpit,) \
		$(if $(DRY_RUN),--dry-run,)
