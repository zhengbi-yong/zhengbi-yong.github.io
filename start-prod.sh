#!/bin/bash

################################################################################
# Blog Platform - Production Deployment Script
#
# This script deploys the blog platform in production mode:
# - Builds optimized Docker images
# - Deploys with production configuration
# - Supports multiple deployment modes
#
# Usage: ./start-prod.sh [command] [options]
#
# Commands:
#   deploy      Full deployment (build + start)
#   start       Start services only
#   stop        Stop all services
#   restart     Restart all services
#   status      Show service status
#   logs        Show service logs
#   clean       Clean build artifacts and stopped containers
#   help        Show this help message
#
# Options:
#   --build-only     Build images without starting
#   --no-cache       Build without cache
#   --force          Force redeployment
#   --dry-run        Show what would be done without doing it
#
################################################################################

set -e

################################################################################
# Configuration
################################################################################

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Docker configuration
IMAGE_NAME="blog-platform"
BACKEND_IMAGE="${IMAGE_NAME}-backend"
FRONTEND_IMAGE="${IMAGE_NAME}-frontend"
NETWORK_NAME="blog-network"

# Service names
BACKEND_SERVICE="blog-backend"
FRONTEND_SERVICE="blog-frontend"

# Flags
BUILD_ONLY=false
NO_CACHE=false
FORCE=false
DRY_RUN=false

################################################################################
# Helper Functions
################################################################################

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}========================================${NC}"
    echo ""
}

print_banner() {
    clear
    echo -e "${CYAN}"
    cat << "EOF"
 _                    _         ___  ___
| |                  | |       |  \/  |
| |_ _ __ _   _ ___  | |_ ___  | . . |
| __| '__| | | / __| | __/ _ \ | |\/| |
| |_| |  | |_| \__ \ |_|| (_) || |  | |
 \__|_|   \__,_|___/ \__\___/ \_|  |_/

           Production Deployment
EOF
    echo -e "${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
check_dependencies() {
    print_header "Checking Dependencies"

    local missing_deps=()

    if ! command_exists docker; then
        missing_deps+=("docker")
    fi

    if ! command_exists docker compose; then
        missing_deps+=("docker-compose")
    fi

    if ! command_exists cargo; then
        missing_deps+=("cargo/rust")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        echo ""
        echo "Please install missing dependencies"
        exit 1
    fi

    print_success "All dependencies installed"
}

# Dry run check
run_cmd() {
    local cmd="$1"

    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY-RUN]${NC} $cmd"
    else
        eval "$cmd"
    fi
}

################################################################################
# Configuration Functions
################################################################################

check_production_config() {
    print_header "Checking Production Configuration"

    local config_ok=true

    # Check backend .env.production
    if [ ! -f "$BACKEND_DIR/.env.production" ]; then
        print_error "Backend .env.production not found"
        echo "Please create $BACKEND_DIR/.env.production from .env.example"
        config_ok=false
    else
        print_success "Backend configuration found"
    fi

    # Check frontend .env.production
    if [ ! -f "$FRONTEND_DIR/.env.production" ]; then
        print_error "Frontend .env.production not found"
        echo "Please create $FRONTEND_DIR/.env.production from .env.example"
        config_ok=false
    else
        print_success "Frontend configuration found"
    fi

    # Check for production secrets
    if grep -q "dev-secret-key" "$BACKEND_DIR/.env.production" 2>/dev/null; then
        print_warning "JWT_SECRET contains default value! Please use a secure secret."
        config_ok=false
    fi

    if grep -q "dev-pepper" "$BACKEND_DIR/.env.production" 2>/dev/null; then
        print_warning "PASSWORD_PEPPER contains default value!"
        config_ok=false
    fi

    if [ "$config_ok" = false ]; then
        print_error "Production configuration is not properly set up"
        exit 1
    fi

    echo ""
}

################################################################################
# Build Functions
################################################################################

build_backend() {
    print_header "Building Backend"

    cd "$BACKEND_DIR"

    local build_cmd="docker build -f Dockerfile"

    if [ "$NO_CACHE" = true ]; then
        build_cmd="$build_cmd --no-cache"
    fi

    build_cmd="$build_cmd -t ${BACKEND_IMAGE}:latest --target production ."

    print_info "Building backend image..."
    if run_cmd "$build_cmd"; then
        print_success "Backend image built: ${BACKEND_IMAGE}:latest"
    else
        print_error "Backend build failed"
        exit 1
    fi
    echo ""
}

build_frontend() {
    print_header "Building Frontend"

    cd "$FRONTEND_DIR"

    # Check if pnpm is available
    if ! command_exists pnpm; then
        print_error "pnpm is not installed. Please run: npm install -g pnpm"
        exit 1
    fi

    # Install dependencies
    print_info "Installing dependencies..."
    run_cmd "pnpm install --frozen-lockfile"

    # Build frontend
    print_info "Building frontend..."
    local build_cmd="pnpm build"

    if run_cmd "$build_cmd"; then
        print_success "Frontend build completed"
    else
        print_error "Frontend build failed"
        exit 1
    fi

    # Build Docker image
    print_info "Building frontend Docker image..."

    local docker_cmd="docker build"
    if [ "$NO_CACHE" = true ]; then
        docker_cmd="$docker_cmd --no-cache"
    fi
    docker_cmd="$docker_cmd -t ${FRONTEND_IMAGE}:latest ."

    if run_cmd "$docker_cmd"; then
        print_success "Frontend image built: ${FRONTEND_IMAGE}:latest"
    else
        print_error "Frontend image build failed"
        exit 1
    fi
    echo ""
}

build_images() {
    print_header "Building Production Images"

    build_backend
    build_frontend

    print_success "All images built successfully"
    echo ""
}

################################################################################
# Deployment Functions
################################################################################

prepare_deployment() {
    print_header "Preparing Deployment"

    # Create Docker network if not exists
    if ! docker network ls --format '{{.Name}}' | grep -q "^${NETWORK_NAME}$"; then
        print_info "Creating Docker network: ${NETWORK_NAME}"
        run_cmd "docker network create ${NETWORK_NAME}"
    fi

    # Stop existing services if force is enabled
    if [ "$FORCE" = true ]; then
        print_warning "Force mode enabled, stopping existing services..."
        stop_services
    fi

    print_success "Deployment prepared"
    echo ""
}

deploy_backend() {
    print_header "Deploying Backend"

    # Use docker compose for production
    cd "$BACKEND_DIR"

    # Check if production compose file exists
    if [ ! -f "docker-compose.prod.yml" ]; then
        print_error "docker-compose.prod.yml not found"
        return 1
    fi

    # Copy production env
    run_cmd "cp .env.production .env"

    # Start services
    print_info "Starting backend services..."
    run_cmd "docker compose -f docker-compose.prod.yml up -d postgres redis"

    # Wait for databases
    print_info "Waiting for databases to be ready..."
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker exec blog-postgres pg_isready -U blog_user -d blog_db >/dev/null 2>&1; then
            break
        fi
        attempt=$((attempt + 1))
        sleep 1
    done

    # Start backend
    print_info "Starting backend API..."
    run_cmd "docker compose -f docker-compose.prod.yml up -d api"

    print_success "Backend deployed"
    echo ""
}

deploy_frontend() {
    print_header "Deploying Frontend"

    cd "$FRONTEND_DIR"

    # Check if production compose file exists
    if [ ! -f "docker-compose.prod.yml" ]; then
        print_warning "No docker-compose.prod.yml found, using Docker directly"

        # Stop existing container
        docker stop ${FRONTEND_SERVICE} 2>/dev/null || true
        docker rm ${FRONTEND_SERVICE} 2>/dev/null || true

        # Run new container
        print_info "Starting frontend container..."
        run_cmd "docker run -d \
            --name ${FRONTEND_SERVICE} \
            --network ${NETWORK_NAME} \
            -p 3001:3000 \
            --env-file .env.production \
            --restart unless-stopped \
            ${FRONTEND_IMAGE}:latest"
    else
        # Use docker compose
        print_info "Starting frontend services..."
        run_cmd "docker compose -f docker-compose.prod.yml up -d"
    fi

    print_success "Frontend deployed"
    echo ""
}

deploy_all() {
    print_header "Deploying to Production"

    check_production_config
    prepare_deployment

    if [ "$BUILD_ONLY" = false ]; then
        deploy_backend
        deploy_frontend
    fi

    print_success "Deployment completed"
    echo ""
}

################################################################################
# Service Management Functions
################################################################################

start_services() {
    print_header "Starting Services"

    cd "$BACKEND_DIR"
    run_cmd "docker compose -f docker-compose.prod.yml up -d"

    print_success "Services started"
    echo ""
}

stop_services() {
    print_header "Stopping Services"

    cd "$BACKEND_DIR"
    run_cmd "docker compose -f docker-compose.prod.yml down"

    # Also stop frontend if running separately
    docker stop ${FRONTEND_SERVICE} 2>/dev/null || true
    docker rm ${FRONTEND_SERVICE} 2>/dev/null || true

    print_success "Services stopped"
    echo ""
}

restart_services() {
    print_header "Restarting Services"

    stop_services
    sleep 2
    deploy_all
}

show_status() {
    print_header "Service Status"

    echo "Docker Containers:"
    docker ps --filter "name=blog-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""

    echo "Network:"
    docker network ls --filter "name=${NETWORK_NAME}" --format "table {{.Name}}\t{{.Driver}}"
    echo ""

    echo "Images:"
    docker images --filter "reference=${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    echo ""

    # Health checks
    echo "Health Checks:"

    # Backend health
    if curl -s http://localhost:3000/healthz >/dev/null 2>&1; then
        echo -e "Backend API:    ${GREEN}✓ Healthy${NC}"
    else
        echo -e "Backend API:    ${RED}✗ Unhealthy${NC}"
    fi

    # Frontend health
    if curl -s http://localhost:3001 >/dev/null 2>&1; then
        echo -e "Frontend:       ${GREEN}✓ Healthy${NC}"
    else
        echo -e "Frontend:       ${RED}✗ Unhealthy${NC}"
    fi

    # Database health
    if docker exec blog-postgres pg_isready -U blog_user -d blog_db >/dev/null 2>&1; then
        echo -e "PostgreSQL:     ${GREEN}✓ Healthy${NC}"
    else
        echo -e "PostgreSQL:     ${RED}✗ Unhealthy${NC}"
    fi

    # Redis health
    if docker exec blog-redis redis-cli ping >/dev/null 2>&1; then
        echo -e "Redis:          ${GREEN}✓ Healthy${NC}"
    else
        echo -e "Redis:          ${RED}✗ Unhealthy${NC}"
    fi

    echo ""
}

show_logs() {
    local service="${1:-}"

    if [ -z "$service" ]; then
        print_header "Service Logs"
        echo "Available services: backend, frontend, postgres, redis"
        echo "Usage: $0 logs [service]"
        echo ""
        return
    fi

    case "$service" in
        backend|api)
            echo "Showing backend logs (Ctrl+C to exit)..."
            docker logs -f blog-api 2>/dev/null || docker logs -f ${BACKEND_SERVICE}
            ;;
        frontend)
            echo "Showing frontend logs (Ctrl+C to exit)..."
            docker logs -f ${FRONTEND_SERVICE}
            ;;
        postgres)
            echo "Showing PostgreSQL logs (Ctrl+C to exit)..."
            docker logs -f blog-postgres
            ;;
        redis)
            echo "Showing Redis logs (Ctrl+C to exit)..."
            docker logs -f blog-redis
            ;;
        *)
            print_error "Unknown service: $service"
            echo "Available services: backend, frontend, postgres, redis"
            ;;
    esac
}

clean_artifacts() {
    print_header "Cleaning Build Artifacts"

    print_info "Removing Docker images..."
    docker rmi ${BACKEND_IMAGE}:latest 2>/dev/null || true
    docker rmi ${FRONTEND_IMAGE}:latest 2>/dev/null || true

    print_info "Removing stopped containers..."
    docker container prune -f

    print_info "Removing dangling images..."
    docker image prune -f

    # Clean frontend build
    if [ -d "$FRONTEND_DIR/.next" ]; then
        print_info "Cleaning frontend build..."
        rm -rf "$FRONTEND_DIR/.next"
    fi

    # Clean backend build
    if [ -d "$BACKEND_DIR/target" ]; then
        print_info "Cleaning backend build..."
        rm -rf "$BACKEND_DIR/target"
    fi

    print_success "Cleanup completed"
    echo ""
}

################################################################################
# Show Info
################################################################################

show_deployment_info() {
    echo ""
    print_header "Production Deployment Complete!"

    cat << EOF
${GREEN}Services:${NC}
  → Backend API:    http://localhost:3000
  → Frontend:       http://localhost:3001

${GREEN}Documentation:${NC}
  → Swagger UI:     http://localhost:3000/swagger-ui/
  → API Docs:       http://localhost:3000/api-docs/openapi.json
  → Health Check:   http://localhost:3000/healthz
  → Metrics:        http://localhost:3000/metrics

${GREEN}Management Commands:${NC}
  → View status:    $0 status
  → View logs:     $0 logs [service]
  → Restart:       $0 restart
  → Stop:          $0 stop
  → Clean:         $0 clean

${GREEN}Database Access:${NC}
  → PostgreSQL:     docker exec -it blog-postgres psql -U blog_user -d blog_db
  → Redis:          docker exec -it blog-redis redis-cli

${YELLOW}Note: Make sure to configure proper HTTPS and firewall rules for production!${NC}
EOF
    echo ""
}

################################################################################
# Parse Arguments
################################################################################

show_help() {
    cat << 'EOF'
Blog Platform - Production Deployment Script

Usage: ./start-prod.sh [command] [options]

Commands:
  deploy              Full deployment (build + start)
  start               Start services only
  stop                Stop all services
  restart             Restart all services
  status              Show service status
  logs [service]      Show service logs (backend|frontend|postgres|redis)
  clean               Clean build artifacts and stopped containers
  help                Show this help message

Options:
  --build-only        Build images without starting
  --no-cache          Build without cache
  --force             Force redeployment (stop existing services)
  --dry-run           Show what would be done without doing it

Examples:
  ./start-prod.sh deploy              # Full deployment
  ./start-prod.sh deploy --no-cache   # Deploy without cache
  ./start-prod.sh restart            # Restart services
  ./start-prod.sh logs backend        # View backend logs
  ./start-prod.sh status             # Show service status
EOF
}

parse_arguments() {
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi

    COMMAND="$1"
    shift

    while [[ $# -gt 0 ]]; do
        case $1 in
            --build-only)
                BUILD_ONLY=true
                shift
                ;;
            --no-cache)
                NO_CACHE=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

################################################################################
# Main Execution
################################################################################

main() {
    # Parse arguments
    parse_arguments "$@"

    # Print banner
    print_banner

    # Check dependencies
    check_dependencies

    # Execute command
    case "$COMMAND" in
        deploy)
            build_images
            if [ "$BUILD_ONLY" = false ]; then
                deploy_all
                show_deployment_info
            fi
            ;;
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$@"
            ;;
        clean)
            clean_artifacts
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
