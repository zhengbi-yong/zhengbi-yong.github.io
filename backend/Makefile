# =============================================================================
# Docker Makefile for Blog Backend
# =============================================================================

.PHONY: help build dev prod up down logs clean test shell

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development targets
dev-build: ## Build the development Docker image
	docker build -f Dockerfile --target development -t blog-api:dev .

dev-up: ## Start development environment with hot reload
	docker-compose -f docker-compose.dev.yml up --build

dev-down: ## Stop development environment
	docker-compose -f docker-compose.dev.yml down

dev-logs: ## Show development logs
	docker-compose -f docker-compose.dev.yml logs -f

dev-shell: ## Open shell in development container
	docker-compose -f docker-compose.dev.yml exec api bash

# Production targets
prod-build: ## Build the production Docker image
	docker build -f Dockerfile --target production -t blog-api:latest .

prod-up: ## Start production environment
	cp .env.production .env
	docker-compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production environment
	docker-compose -f docker-compose.prod.yml down

prod-logs: ## Show production logs
	docker-compose -f docker-compose.prod.yml logs -f

prod-shell: ## Open shell in production container
	docker-compose -f docker-compose.prod.yml exec api bash

# Database targets
db-up: ## Start only database services
	docker-compose -f docker-compose.dev.yml up -d postgres redis

db-down: ## Stop database services
	docker-compose -f docker-compose.dev.yml down

db-reset: ## Reset database (WARNING: This will delete all data)
	docker-compose -f docker-compose.dev.yml down -v
	docker volume rm blog-backend_postgres_data || true

# Utility targets
build: dev-build prod-build ## Build all images

clean: ## Remove all Docker images and volumes
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose -f docker-compose.prod.yml down -v
	docker system prune -f
	docker volume prune -f

logs: ## Show logs from all services
	docker-compose -f docker-compose.dev.yml logs -f

test: ## Run tests in development container
	docker-compose -f docker-compose.dev.yml run --rm api cargo test

shell: dev-shell ## Open shell (alias for dev-shell)

# Local development targets
local-run: ## Run local development server
	./run-local.sh

local-build: ## Try to build the actual API locally
	cargo check

db-status: ## Show database status
	./deploy.sh status

env-setup: ## Setup environment variables
	@echo "Setting up environment variables..."
	export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
	export REDIS_URL=redis://localhost:6379
	@echo "Environment variables set. Use 'make local-run' to start the server."

# Quick start commands
quick-start: ## Quick start for development (build and run)
	@echo "Docker build has compatibility issues. Using local development instead."
	./run-working-api.sh

quick-prod: ## Quick start for production
	make prod-build
	make prod-up