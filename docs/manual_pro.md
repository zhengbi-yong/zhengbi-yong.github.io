# 企业级多设备环境开发部署手册

## 概述

本手册提供了一套完整的企业级多设备开发和部署方案，通过合理的设备分工、环境隔离和自动化流程，实现高安全性、高开发效率和高可用性的系统架构。

## 推荐设备清单

### 必需设备（现有）

1. **开发电脑** (Development Machine)
   - 作用：日常代码编写、本地开发、单元测试
   - 配置要求：32GB+ RAM, 1TB+ NVMe SSD, 多核CPU
   - 系统：macOS/Linux（推荐使用容器化开发）

2. **测试电脑** (Testing Machine)
   - 作用：集成测试、E2E测试、性能测试
   - 配置要求：16GB+ RAM, 512GB+ SSD
   - 系统：Ubuntu 22.04 LTS

### 推荐新增设备

3. **云端数据库服务器集群** (Database Cluster)
   - 主库：4核8GB，100GB SSD，PostgreSQL 15+
   - 从库1：2核4GB，100GB SSD（实时备份）
   - 从库2：2核4GB，100GB SSD（分析和报表）
   - 位置：云服务商VPC内网

4. **CI/CD专用服务器** (Build & Deploy Server)
   - 配置：8核16GB，200GB SSD
   - 作用：代码构建、自动化测试、部署流水线
   - 附加：Docker Registry, Artifactory

5. **监控和日志中心** (Monitoring Server)
   - 配置：4核8GB，500GB SSD
   - 作用：Prometheus, Grafana, ELK Stack
   - 附加：告警通知、性能分析

6. **生产环境服务器** (Production Cluster)
   - Web服务器1：4核8GB，负载均衡
   - Web服务器2：4核8GB，负载均衡
   - 应用服务器1：8核16GB，API服务
   - 应用服务器2：8核16GB，API服务

7. **灾备服务器** (Disaster Recovery Server)
   - 配置：与生产环境相同
   - 位置：不同地域的云服务商
   - 作用：灾难恢复、异地备份

8. **对象存储服务** (Object Storage)
   - 服务：AWS S3 / 阿里云OSS / 腾讯云COS
   - 用途：静态资源、备份文件、CDN源站

9. **开发测试服务器** (Dev/Test Server)
   - Docker Swarm/Kubernetes集群
   - 用于容器化部署测试

## 系统架构图

### 整体架构

```
                            ┌─────────────────┐
                            │   CDN + CDN     │
                            │  (静态资源分发)  │
                            └───────┬─────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │      负载均衡器 (Nginx/HAProxy) │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │     Web服务器集群 (2台)        │
                    │  ┌─────────┐   ┌─────────┐     │
                    │  │ Web-1   │   │ Web-2   │     │
                    │  └─────────┘   └─────────┘     │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │    应用服务器集群 (2台)        │
                    │  ┌─────────┐   ┌─────────┐     │
                    │  │ API-1   │   │ API-2   │     │
                    │  └─────────┘   └─────────┘     │
                    └───────────────┬───────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
        ┌───────┴───────┐   ┌───────┴───────┐   ┌───────┴───────┐
        │ Redis集群     │   │ PostgreSQL    │   │ 对象存储      │
        │ (缓存/会话)   │   │ 主从复制      │   │ (文件/备份)   │
        └───────────────┘   └───────┬───────┘   └───────────────┘
                                │
                ┌───────────────┼────────────────┐
                │               │                │
        ┌───────┴───────┐ ┌─────┴─────┐ ┌──────┴──────┐
        │ 主库(写)      │ │ 从库1(读) │ │ 从库2(分析) │
        └───────────────┘ └───────────┘ └─────────────┘

        ┌──────────────────────────────────────────────┐
        │            监控和日志中心                    │
        │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
        │  │Prometheus│ │ Grafana │ │ ELK Stack│       │
        │  └─────────┘ └─────────┘ └─────────┘       │
        └──────────────────────────────────────────────┘

        ┌──────────────────────────────────────────────┐
        │           CI/CD 服务器                       │
        │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
        │  │Jenkins  │ │Docker Reg│ │Artifactory│      │
        │  └─────────┘ └─────────┘ └─────────┘       │
        └──────────────────────────────────────────────┘
```

### 开发环境架构

```
开发电脑
├─ Docker Desktop
│  ├─ Development Container 1 (Backend API)
│  ├─ Development Container 2 (Frontend Dev)
│  ├─ Development Container 3 (Database)
│  └─ Development Container 4 (Redis)
├─ VS Code + Remote Containers
├─ Git客户端
└─ 本地Kubernetes (可选)

测试电脑
├─ Docker Swarm / Kubernetes
├─ Selenium Grid (E2E测试)
├─ JMeter / K6 (性能测试)
└─ 自动化测试框架
```

### 环境分离策略

```
┌──────────────────────────────────────────────────────────┐
│                    开发环境 (本地)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  热重载开发  │  │  本地数据库  │  │  单元测试    │     │
│  │  服务器      │  │  (Docker)   │  │  (Jest)     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└────────────────────────┬────────────────────────────────┘
                         │ Git Push
┌────────────────────────┴────────────────────────────────┐
│                    测试环境 (云端)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  集成测试    │  │  E2E测试    │  │  性能测试    │     │
│  │  自动触发    │  │  Selenium   │  │  压力测试    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└────────────────────────┬────────────────────────────────┘
                         │ 手动/自动触发
┌────────────────────────┴────────────────────────────────┐
│                  预发布环境 (云端)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  生产镜像    │  │  灰度发布    │  │  用户验收    │     │
│  │  验证        │  │  测试        │  │  测试        │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└────────────────────────┬────────────────────────────────┘
                         │ 手动确认后
┌────────────────────────┴────────────────────────────────┐
│                  生产环境 (云端)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  高可用集群  │  │  实时监控    │  │  自动扩容    │     │
│  │  负载均衡    │  │  告警        │  │  备份        │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  灾备环境 (异地)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  热备份      │  │  数据同步    │  │  故障转移    │     │
│  │  站点        │  │  实时        │  │  自动切换    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└──────────────────────────────────────────────────────────┘
```

## 详细部署方案

### 一、容器化开发环境 (开发电脑)

#### 1. 开发环境准备

**系统要求**：
- macOS 13+ / Ubuntu 22.04+ / Windows 11 with WSL2
- 32GB+ RAM
- 1TB+ NVMe SSD
- Docker Desktop 4.20+
- VS Code with Remote Containers

**一键环境设置脚本** (`setup-dev.sh`):
```bash
#!/bin/bash

echo "Setting up enterprise development environment..."

# 1. 安装必要工具
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    brew install git rustup nvm docker gh jq
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    sudo apt update
    sudo apt install -y curl git build-essential
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
fi

# 2. 安装开发工具
source ~/.cargo/env
rustup component add rust-analyzer

# 3. 安装 Node.js 和 pnpm
source ~/.nvm/nvm.sh
nvm install 20
nvm use 20
npm install -g pnpm

# 4. 克隆项目
git clone git@github.com:zhengbi-yong/zhengbi-yong.github.io.git
cd zhengbi-yong.github.io

# 5. 启动开发容器
docker-compose -f docker-compose.dev.yml up -d

echo "Development environment ready!"
```

#### 2. DevContainer 配置

创建 `.devcontainer/devcontainer.json`:
```json
{
    "name": "Blog Development Environment",
    "dockerComposeFile": "../docker-compose.dev.yml",
    "service": "workspace",
    "workspaceFolder": "/workspace",
    "extensions": [
        "rust-lang.rust-analyzer",
        "ms-vscode.vscode-typescript-next",
        "bradlc.vscode-tailwindcss",
        "ms-azuretools.vscode-docker",
        "GitLab.gitlab-workflow"
    ],
    "settings": {
        "rust-analyzer.checkOnSave.command": "clippy",
        "typescript.preferences.importModuleSpecifier": "relative",
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
            "source.fixAll.eslint": true
        }
    },
    "forwardPorts": [3000, 3001, 5432, 6379, 8080],
    "postCreateCommand": "pnpm install && cargo build"
}
```

**开发环境 Docker Compose** (`docker-compose.dev.yml`):
```yaml
version: '3.8'

services:
  workspace:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/workspace:cached
      - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      - CARGO_TARGET_DIR=/workspace/target
      - NODE_ENV=development
    command: sleep infinity

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: blog_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data

volumes:
  postgres_dev_data:
  redis_dev_data:
```

#### 3. 开发容器 Dockerfile

创建 `Dockerfile.dev`:
```dockerfile
FROM rust:1.70-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    pkg-config \
    libssl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 安装 Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# 安装 pnpm
RUN npm install -g pnpm

# 安装 Rust 组件
RUN rustup component add rustfmt clippy rust-analyzer

# 设置工作目录
WORKDIR /workspace

# 创建非root用户
RUN useradd -m -s /bin/bash developer
USER developer

# 设置环境变量
ENV PATH="/home/developer/.cargo/bin:${PATH}"
```

#### 4. 开发流程自动化

**Makefile**:
```makefile
.PHONY: dev build test clean deploy

# 启动开发环境
dev:
	docker-compose -f docker-compose.dev.yml up -d
	docker-compose -f docker-compose.dev.yml exec workspace make dev-internal

# 内部开发命令
dev-internal:
	cd backend && cargo run &
	cd frontend && pnpm dev &
	wait

# 运行所有测试
test:
	docker-compose -f docker-compose.dev.yml exec workspace make test-internal

test-internal:
	cd backend && cargo test --all
	cd frontend && pnpm test && pnpm test:e2e

# 代码格式化
fmt:
	docker-compose -f docker-compose.dev.yml exec workspace make fmt-internal

fmt-internal:
	cd backend && cargo fmt
	cd frontend && pnpm format

# 代码检查
lint:
	docker-compose -f docker-compose.dev.yml exec workspace make lint-internal

lint-internal:
	cd backend && cargo clippy -- -D warnings
	cd frontend && pnpm lint

# 清理环境
clean:
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f

# 部署到测试环境
deploy-test:
	./scripts/deploy-to-test.sh

# 部署到生产环境
deploy-prod:
	./scripts/deploy-to-prod.sh
```

#### 5. 本地开发配置

**前端开发配置** (frontend/.env.local):
```env
# 开发环境配置
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_DEV_MODE=true

# 开发工具配置
NEXT_PUBLIC_ANALYTICS_ID=dev-analytics
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_DEBUG=true

# 功能开关
NEXT_PUBLIC_ENABLE_SW=true
NEXT_PUBLIC_ENABLE_MOCK=false
```

**后端开发配置** (backend/.env):
```env
# 数据库配置
DATABASE_URL=postgresql://dev_user:dev_password@postgres:5432/blog_dev
REDIS_URL=redis://redis:6379

# 开发配置
RUST_LOG=debug
ENVIRONMENT=development
HOST=0.0.0.0
PORT=3000

# 开发用密钥（仅本地使用）
JWT_SECRET=dev-jwt-secret-key-local-only-do-not-use-in-production
PASSWORD_PEPPER=dev-pepper-local
CORS_ORIGIN=http://localhost:3001,http://localhost:3000

# 开发特性
ENABLE_HOT_RELOAD=true
ENABLE_DEBUG_ROUTES=true
ENABLE_PROFILING=true

# 外部服务（开发环境可使用模拟服务）
SMTP_HOST=mailhog
SMTP_PORT=1025
STORAGE_TYPE=local
```

### 二、测试环境设置 (测试电脑)

#### 1. 环境配置

**系统要求**:
- Ubuntu 22.04 LTS
- 16GB+ RAM
- Docker & Docker Compose
- Kubernetes (minikube或k3s)
- Selenium Grid
- 性能测试工具

#### 2. 测试环境部署

**Docker Compose for Testing** (`docker-compose.test.yml`):
```yaml
version: '3.8'

services:
  # 应用服务
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      DATABASE_URL: postgresql://test_user:test_pass@postgres:5432/blog_test
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${TEST_JWT_SECRET}
      ENVIRONMENT: testing
    depends_on:
      - postgres
      - redis
    ports:
      - "3000:3000"

  # 数据库
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: blog_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_pass
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
      - ./test-data:/docker-entrypoint-initdb.d

  # Redis
  redis:
    image: redis:7-alpine
    volumes:
      - redis_test_data:/data

  # Selenium Grid
  selenium-hub:
    image: selenium/hub:4.0
    ports:
      - "4444:4444"

  chrome-node:
    image: selenium/node-chrome:4.0
    environment:
      - SE_EVENT_BUS_HOST=selenium-hub
      - SE_EVENT_BUS_PUBLISH_PORT=4442
      - SE_EVENT_BUS_SUBSCRIBE_PORT=4443
    depends_on:
      - selenium-hub

  firefox-node:
    image: selenium/node-firefox:4.0
    environment:
      - SE_EVENT_BUS_HOST=selenium-hub
      - SE_EVENT_BUS_PUBLISH_PORT=4442
      - SE_EVENT_BUS_SUBSCRIBE_PORT=4443
    depends_on:
      - selenium-hub

  # 性能测试
  k6:
    image: loadimpact/k6:latest
    volumes:
      - ./tests/performance:/scripts
    command: "run --out json=/results/results.json /scripts/load-test.js"

volumes:
  postgres_test_data:
  redis_test_data:
```

#### 3. 自动化测试流水线

**测试脚本** (`run-tests.sh`):
```bash
#!/bin/bash

echo "Running comprehensive test suite..."

# 1. 启动测试环境
docker-compose -f docker-compose.test.yml up -d

# 2. 等待服务就绪
echo "Waiting for services to be ready..."
sleep 30

# 3. 运行数据库迁移
docker-compose exec api sqlx migrate run

# 4. 运行后端单元测试
echo "Running backend unit tests..."
docker-compose exec api cargo test --all-features

# 5. 运行前端单元测试
echo "Running frontend unit tests..."
cd frontend
pnpm test --coverage

# 6. 运行集成测试
echo "Running integration tests..."
docker-compose exec api cargo test --test integration

# 7. 运行E2E测试
echo "Running E2E tests..."
pnpm test:e2e

# 8. 运行性能测试
echo "Running performance tests..."
docker-compose run --rm k6 run /scripts/smoke-test.js
docker-compose run --rm k6 run /scripts/load-test.js

# 9. 生成测试报告
echo "Generating test reports..."
docker-compose exec api cargo test --features report > test-report.txt

# 10. 清理环境
docker-compose -f docker-compose.test.yml down -v

echo "All tests completed!"
```

### 三、CI/CD 服务器配置

#### 1. Jenkins Pipeline

**Jenkinsfile**:
```groovy
pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'your-registry.com'
        DOCKER_CREDENTIALS = credentials('docker-creds')
        KUBECONFIG = credentials('kubeconfig')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                script {
                    docker.build('blog-api:latest', './backend')
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'pnpm install'
                    sh 'pnpm build'
                    docker.build('blog-frontend:latest', '.')
                }
            }
        }

        stage('Run Tests') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        script {
                            docker.image('blog-api:latest').inside {
                                sh 'cargo test --all'
                            }
                        }
                    }
                }
                stage('Integration Tests') {
                    steps {
                        sh './scripts/run-integration-tests.sh'
                    }
                }
                stage('E2E Tests') {
                    steps {
                        sh './scripts/run-e2e-tests.sh'
                    }
                }
            }
        }

        stage('Security Scan') {
            steps {
                sh 'trivy image blog-api:latest'
                sh 'trivy image blog-frontend:latest'
            }
        }

        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                sh './scripts/deploy-to-staging.sh'
            }
        }

        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            input {
                message "Deploy to production?"
            }
            steps {
                sh './scripts/deploy-to-production.sh'
            }
        }
    }

    post {
        always {
            junit 'test-results/**/*.xml'
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'coverage',
                reportFiles: 'index.html',
                reportName: 'Coverage Report'
            ])
        }
        success {
            slackSend(
                color: 'good',
                message: "Build succeeded: ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
            )
        }
        failure {
            slackSend(
                color: 'danger',
                message: "Build failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}"
            )
        }
    }
}
```

#### 2. GitHub Actions 配置

**`.github/workflows/ci-cd.yml`**:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: blog_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Set up Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          override: true
          components: rustfmt, clippy

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: frontend/pnpm-lock.yaml

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Run backend tests
        run: |
          cd backend
          cargo test --all-features

      - name: Run frontend tests
        run: |
          cd frontend
          pnpm install
          pnpm test
          pnpm test:e2e

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  build:
    needs: [test, security]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta-backend
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend

      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ steps.meta-backend.outputs.tags }}
          labels: ${{ steps.meta-backend.outputs.labels }}

      - name: Extract metadata for frontend
        id: meta-frontend
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend

      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ${{ steps.meta-frontend.outputs.tags }}
          labels: ${{ steps.meta-frontend.outputs.labels }}

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment..."
          # 这里添加实际的部署脚本

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: |
          echo "Deploying to production environment..."
          # 这里添加实际的部署脚本
```

### 四、生产环境部署

#### 1. Kubernetes 部署配置

**`k8s/namespace.yaml`**:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: blog-prod
```

**`k8s/configmap.yaml`**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: blog-config
  namespace: blog-prod
data:
  ENVIRONMENT: "production"
  RUST_LOG: "warn"
  HOST: "0.0.0.0"
  PORT: "3000"
```

**`k8s/secret.yaml`**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: blog-secrets
  namespace: blog-prod
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  REDIS_URL: <base64-encoded-redis-url>
  JWT_SECRET: <base64-encoded-jwt-secret>
  PASSWORD_PEPPER: <base64-encoded-pepper>
```

**`k8s/backend-deployment.yaml`**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blog-api
  namespace: blog-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: blog-api
  template:
    metadata:
      labels:
        app: blog-api
    spec:
      containers:
      - name: api
        image: ghcr.io/zhengbi-yong/zhengbi-yong.github.io-backend:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: blog-config
        - secretRef:
            name: blog-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /healthz
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /readyz
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: blog-api-service
  namespace: blog-prod
spec:
  selector:
    app: blog-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

**`k8s/frontend-deployment.yaml`**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blog-frontend
  namespace: blog-prod
spec:
  replicas: 2
  selector:
    matchLabels:
      app: blog-frontend
  template:
    metadata:
      labels:
        app: blog-frontend
    spec:
      containers:
      - name: frontend
        image: ghcr.io/zhengbi-yong/zhengbi-yong.github.io-frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: blog-frontend-service
  namespace: blog-prod
spec:
  selector:
    app: blog-frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP
```

**`k8s/ingress.yaml`**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: blog-ingress
  namespace: blog-prod
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - blog.yourdomain.com
    secretName: blog-tls
  rules:
  - host: blog.yourdomain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: blog-api-service
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: blog-frontend-service
            port:
              number: 80
```

#### 2. Helm Charts

**`helm/Chart.yaml`**:
```yaml
apiVersion: v2
name: blog
description: A Helm chart for Blog Platform
type: application
version: 1.0.0
appVersion: "1.0.0"

dependencies:
  - name: postgresql
    version: 12.1.9
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
  - name: redis
    version: 17.3.7
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
```

**`helm/values.yaml`**:
```yaml
# Global values
global:
  imageRegistry: ghcr.io
  imagePullSecrets:
    - name: ghcr-secret

# Backend configuration
backend:
  replicaCount: 3
  image:
    repository: zhengbi-yong/zhengbi-yong.github.io-backend
    tag: latest
  resources:
    requests:
      memory: 256Mi
      cpu: 250m
    limits:
      memory: 512Mi
      cpu: 500m

# Frontend configuration
frontend:
  replicaCount: 2
  image:
    repository: zhengbi-yong/zhengbi-yong.github.io-frontend
    tag: latest
  resources:
    requests:
      memory: 128Mi
      cpu: 100m
    limits:
      memory: 256Mi
      cpu: 200m

# PostgreSQL
postgresql:
  enabled: true
  auth:
    postgresPassword: "secure-password"
    database: "blog_prod"
  primary:
    persistence:
      enabled: true
      size: 100Gi

# Redis
redis:
  enabled: true
  auth:
    enabled: true
    password: "secure-redis-password"
  master:
    persistence:
      enabled: true
      size: 20Gi

# Ingress
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: blog.yourdomain.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: blog-tls
      hosts:
        - blog.yourdomain.com

# Autoscaling
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

### 五、监控和日志系统

#### 1. Prometheus 配置

**`monitoring/prometheus.yml`**:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'blog-api'
    kubernetes_sd_configs:
      - role: endpoints
        namespaces:
          names:
            - blog-prod
    relabel_configs:
      - source_labels: [__meta_kubernetes_service_name]
        action: keep
        regex: blog-api-service
      - source_labels: [__meta_kubernetes_endpoint_port_name]
        action: keep
        regex: metrics

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

**`monitoring/alert_rules.yml`**:
```yaml
groups:
  - name: blog-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "95th percentile latency is {{ $value }} seconds"

      - alert: DatabaseConnectionsHigh
        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
          description: "Database has {{ $value }} active connections"

      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Pod is crash looping"
          description: "Pod {{ $labels.pod }} is crashing"
```

#### 2. Grafana 仪表板

**`monitoring/grafana/dashboards/blog-dashboard.json`** (部分):
```json
{
  "dashboard": {
    "title": "Blog Platform Overview",
    "tags": ["blog"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (method, path)",
            "legendFormat": "{{method}} {{path}}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests/sec"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100"
          }
        ],
        "valueMaps": [
          {
            "value": "null",
            "text": "N/A"
          }
        ],
        "thresholds": "1,5,10"
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          },
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "99th percentile"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_activity_count",
            "legendFormat": "Active connections"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "container_memory_usage_bytes / 1024 / 1024",
            "legendFormat": "{{pod}}"
          }
        ],
        "yAxes": [
          {
            "label": "MB"
          }
        ]
      },
      {
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(container_cpu_usage_seconds_total[5m]) * 100",
            "legendFormat": "{{pod}}"
          }
        ],
        "yAxes": [
          {
            "label": "Percent"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
```

#### 3. ELK Stack 配置

**`logging/elasticsearch.yml`**:
```yaml
cluster.name: "blog-logs"
network.host: 0.0.0.0
discovery.type: single-node
xpack.security.enabled: false
xpack.monitoring.collection.enabled: true
```

**`logging/logstash.conf`**:
```ruby
input {
  beats {
    port => 5044
  }
  tcp {
    port => 5000
  }
}

filter {
  if [fields][service] == "blog-api" {
    json {
      source => "message"
    }

    date {
      match => [ "timestamp", "ISO8601" ]
    }

    if [level] == "ERROR" {
      mutate {
        add_tag => [ "error" ]
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "blog-logs-%{+YYYY.MM.dd}"
  }

  if "error" in [tags] {
    email {
      to => "alerts@yourdomain.com"
      subject => "Blog Error Alert"
      body => "Error in service %{[fields][service]}: %{message}"
    }
  }
}
```

### 六、灾备和高可用方案

#### 1. 数据库主从复制

**`database/postgresql-master.conf`**:
```ini
# 主库配置
wal_level = replica
max_wal_senders = 3
max_replication_slots = 3
wal_keep_size = 1GB
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'
```

**`database/postgresql-slave.conf`**:
```ini
# 从库配置
hot_standby = on
max_standby_streaming_delay = 30s
max_standby_archive_delay = 30s
```

#### 2. 自动故障转移

**`failover/failover.sh`**:
```bash
#!/bin/bash

# 检查主库状态
check_master() {
    pg_isready -h $MASTER_HOST -p $MASTER_PORT -U postgres
    if [ $? -ne 0 ]; then
        echo "Master is down, initiating failover..."
        promote_slave
    fi
}

# 提升从库为主库
promote_slave() {
    # 1. 停止所有应用连接
    kubectl scale deployment blog-api --replicas=0 -n blog-prod

    # 2. 提升从库
    psql -h $SLAVE_HOST -p $SLAVE_PORT -U postgres -c "SELECT pg_promote();"

    # 3. 更新配置
    kubectl patch secret blog-secrets -n blog-prod -p '{"data":{"DATABASE_URL":"'$(base64 <<< $NEW_DB_URL)'"}}'

    # 4. 重启应用
    kubectl scale deployment blog-api --replicas=3 -n blog-prod

    # 5. 发送告警
    send_alert "Database failover completed"
}

# 监控循环
while true; do
    check_master
    sleep 10
done
```

#### 3. 跨地域备份

**`backup/backup-script.sh`**:
```bash
#!/bin/bash

# 本地备份
backup_local() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)

    # 数据库备份
    pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > backup_db_$TIMESTAMP.sql.gz

    # 上传到对象存储
    aws s3 cp backup_db_$TIMESTAMP.sql.gz s3://$BACKUP_BUCKET/database/

    # 清理本地文件
    rm backup_db_$TIMESTAMP.sql.gz
}

# 跨地域复制
replicate_remote() {
    # 同步到异地存储
    aws s3 sync s3://$BACKUP_BUCKET/ s3://$REMOTE_BACKUP_BUCKET/ --delete

    # 同步到灾备服务器
    rsync -avz -e "ssh -i $SSH_KEY" /data/ $REMOTE_USER@$REMOTE_HOST:/backup/
}

# 执行备份
backup_local
replicate_remote

# 清理旧备份
aws s3 ls s3://$BACKUP_BUCKET/database/ | while read -r line; do
    createDate=$(echo $line | awk '{print $1" "$2}')
    createDate=$(date -d "$createDate" +%s)
    olderThan=$(date -d "30 days ago" +%s)

    if [[ $createDate -lt $olderThan ]]; then
        fileName=$(echo $line | awk '{print $4}')
        aws s3 rm s3://$BACKUP_BUCKET/database/$fileName
    fi
done
```

### 七、安全最佳实践

#### 1. 网络安全

**`network/network-policy.yaml`**:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: blog-network-policy
  namespace: blog-prod
spec:
  podSelector:
    matchLabels:
      app: blog-api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: blog-frontend
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
  - to: []
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 443
```

#### 2. Pod Security Policy

**`security/pod-security-policy.yaml`**:
```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: blog-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
```

#### 3. RBAC 配置

**`security/rbac.yaml`**:
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: blog-sa
  namespace: blog-prod

---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: blog-prod
  name: blog-role
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: blog-rolebinding
  namespace: blog-prod
subjects:
- kind: ServiceAccount
  name: blog-sa
  namespace: blog-prod
roleRef:
  kind: Role
  name: blog-role
  apiGroup: rbac.authorization.k8s.io
```

### 八、自动化脚本集

#### 1. 一键部署脚本

**`scripts/deploy-all.sh`**:
```bash
#!/bin/bash

# 企业级一键部署脚本

set -e

echo "🚀 Starting enterprise deployment..."

# 检查必要工具
check_requirements() {
    command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required" >&2; exit 1; }
    command -v helm >/dev/null 2>&1 || { echo "helm is required" >&2; exit 1; }
    command -v aws >/dev/null 2>&1 || { echo "aws cli is required" >&2; exit 1; }
}

# 初始化集群
init_cluster() {
    echo "📦 Creating namespace..."
    kubectl create namespace blog-prod --dry-run=client -o yaml | kubectl apply -f -

    echo "🔐 Adding Helm repositories..."
    helm repo add bitnami https://charts.bitnami.com/bitnami
    helm repo update

    echo "🔑 Installing certificates..."
    helm install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --version v1.11.0 \
        --set installCRDs=true
}

# 部署应用
deploy_app() {
    echo "🏗️ Deploying application..."

    # 创建密钥
    kubectl create secret generic blog-secrets \
        --from-env-file=secrets.env \
        --namespace blog-prod \
        --dry-run=client -o yaml | kubectl apply -f -

    # 使用 Helm 部署
    helm upgrade --install blog ./helm \
        --namespace blog-prod \
        --values helm/values.prod.yaml \
        --timeout 10m
}

# 部署监控
deploy_monitoring() {
    echo "📊 Deploying monitoring..."

    kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

    helm install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --values monitoring/prometheus.values.yaml \
        --set grafana.adminPassword=$GRAFANA_PASSWORD
}

# 运行测试
run_tests() {
    echo "🧪 Running post-deployment tests..."

    # 等待服务就绪
    kubectl wait --for=condition=ready pod -l app=blog-api -n blog-prod --timeout=300s

    # 运行健康检查
    kubectl run health-check --image=curlimages/curl \
        --rm -i --restart=Never \
        --namespace blog-prod \
        -- curl -f http://blog-api-service/healthz

    echo "✅ All tests passed!"
}

# 主流程
main() {
    check_requirements
    init_cluster
    deploy_app
    deploy_monitoring
    run_tests

    echo "🎉 Deployment completed successfully!"
    echo "📈 Grafana: https://grafana.yourdomain.com"
    echo "🔍 Prometheus: https://prometheus.yourdomain.com"
    echo "🌐 Blog: https://blog.yourdomain.com"
}

main "$@"
```

#### 2. 灾备恢复脚本

**`scripts/disaster-recovery.sh`**:
```bash
#!/bin/bash

# 灾难恢复脚本

set -e

DR_REGION=${1:-us-west-2}
PRIMARY_REGION=${2:-us-east-1}

echo "🚨 Initiating disaster recovery from $DR_REGION to $PRIMARY_REGION..."

# 1. 检查灾备状态
check_dr_status() {
    echo "📋 Checking disaster recovery status..."

    # 检查数据库同步状态
    REPLICATION_LAG=$(psql -h $DR_DB_HOST -U $DB_USER -d $DB_NAME \
        -c "SELECT pg_last_wal_receive_lsn() - pg_last_wal_replay_lsn() AS lag;" \
        -t | tr -d ' ')

    if [ "$REPLICATION_LAG" -gt "1048576" ]; then
        echo "⚠️ Replication lag is high: $REPLICATION_LAG bytes"
    else
        echo "✅ Replication is up to date"
    fi
}

# 2. 启动灾备站点
activate_dr_site() {
    echo "🔄 Activating disaster recovery site..."

    # 更新 DNS 指向灾备站点
    aws route53 change-resource-record-sets \
        --hosted-zone-id $HOSTED_ZONE_ID \
        --change-batch '{
            "Changes": [{
                "Action": "UPSERT",
                "ResourceRecordSet": {
                    "Name": "blog.yourdomain.com",
                    "Type": "A",
                    "AliasTarget": {
                        "DNSName": "'$DR_LOAD_BALANCER'",
                        "EvaluateTargetHealth": false,
                        "HostedZoneId": "'$DR_ZONE_ID'"
                    }
                }
            }]
        }'

    # 启动灾备环境服务
    aws eks --region $DR_REGION update-nodegroup-config \
        --cluster-name $DR_CLUSTER_NAME \
        --nodegroup-name $DR_NODEGROUP \
        --scaling-config desiredSize=3,minSize=2,maxSize=10

    echo "✅ Disaster recovery site activated"
}

# 3. 同步最新数据
sync_latest_data() {
    echo "💾 Syncing latest data..."

    # 从对象存储恢复最新备份
    LATEST_BACKUP=$(aws s3 ls s3://$BACKUP_BUCKET/database/ \
        --region $PRIMARY_REGION \
        | sort | tail -n 1 | awk '{print $4}')

    aws s3 cp s3://$BACKUP_BUCKET/database/$LATEST_BACKUP \
        /tmp/latest_backup.sql.gz \
        --region $DR_REGION

    gunzip -c /tmp/latest_backup.sql.gz | \
        psql -h $DR_DB_HOST -U $DB_USER -d $DB_NAME

    rm /tmp/latest_backup.sql.gz
}

# 4. 验证服务
verify_services() {
    echo "🔍 Verifying services..."

    # 检查应用状态
    kubectl --region $DR_REGION get pods -n blog-prod

    # 运行健康检查
    curl -f https://blog.yourdomain.com/healthz

    # 运行冒烟测试
    ./scripts/smoke-tests.sh https://blog.yourdomain.com

    echo "✅ All services are healthy"
}

# 主流程
main() {
    check_dr_status
    sync_latest_data
    activate_dr_site
    verify_services

    echo "🎉 Disaster recovery completed!"
    echo "📧 Sending notifications..."

    # 发送通知
    send_sns_notification "Disaster recovery completed successfully"
    slack_notify "✅ Disaster recovery completed. Blog is now running on DR site."
}

main "$@"
```

### 九、成本优化策略

#### 1. 资源优化

**使用 Spot Instances for non-critical workloads**:
```yaml
# k8s/spot-node-pool.yaml
apiVersion: v1
kind: Node
metadata:
  name: spot-node-pool
  labels:
    node-lifecycle: spot
spec:
  taints:
  - key: spot-instance
    value: "true"
    effect: NoSchedule
```

**HPA (Horizontal Pod Autoscaler)**:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: blog-api-hpa
  namespace: blog-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: blog-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### 2. 成本监控

**Prometheus 成本监控规则**:
```yaml
# monitoring/cost-alerts.yml
groups:
  - name: cost-alerts
    rules:
      - alert: HighCostSpike
        expr: rate(aws_cost_total[1h]) > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High cost spike detected"
          description: "Cost increased by ${{ $value }} in the last hour"
```

## 总结

这套企业级多设备开发和部署方案提供了：

### 核心优势
1. **高可用性** - 多层容错，自动故障转移
2. **可扩展性** - 水平扩展，自动伸缩
3. **安全性** - 多层安全防护，RBAC权限控制
4. **开发效率** - 容器化开发，自动化CI/CD
5. **监控完善** - 全方位监控，实时告警
6. **灾备保障** - 跨地域备份，快速恢复

### 设备采购建议
1. **优先级1** - CI/CD服务器 + 数据库集群
2. **优先级2** - 监控中心 + 负载均衡集群
3. **优先级3** - 灾备服务器 + 对象存储

### 部署路径
1. **第一阶段** - 搭建基础开发和测试环境
2. **第二阶段** - 部署生产环境和监控系统
3. **第三阶段** - 实施灾备和高可用方案

这套方案能够支持企业级的开发和运维需求，确保系统的稳定、安全和高性能运行。