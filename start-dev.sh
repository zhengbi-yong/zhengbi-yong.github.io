#!/bin/bash

################################################################################
# Blog Platform - Development Startup Script
#
# This script starts the entire blog platform in development mode:
# - PostgreSQL database (port 5432)
# - Redis cache (port 6379)
# - Backend API (port 3000)
# - Frontend (port 3001)
#
# Usage: ./start-dev.sh [options]
#
# Options:
#   --no-backend    Skip starting the backend
#   --no-frontend   Skip starting the frontend
#   --no-db         Skip starting databases
#   --clean         Clean build before starting
#   --help          Show this help message
#
################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# PIDs for tracking processes
BACKEND_PID=""
FRONTEND_PID=""

# Flags
START_BACKEND=true
START_FRONTEND=true
START_DB=true
CLEAN_BUILD=false

################################################################################
# Helper Functions
################################################################################

# Print colored message
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
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}========================================${NC}"
}

# Print banner
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

           Development Environment
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

    # Check required commands
    if ! command_exists docker; then
        missing_deps+=("docker")
    fi

    if ! command_exists docker compose; then
        missing_deps+=("docker-compose")
    fi

    if ! command_exists cargo; then
        missing_deps+=("cargo/rust")
    fi

    if ! command_exists pnpm; then
        missing_deps+=("pnpm")
    fi

    # Report missing dependencies
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        echo ""
        echo "Please install missing dependencies:"
        echo "  - Docker: https://docs.docker.com/get-docker/"
        echo "  - Rust: https://rustup.rs/"
        echo "  - pnpm: npm install -g pnpm"
        exit 1
    fi

    print_success "All dependencies installed"
    echo ""
}

# Cleanup function
cleanup() {
    echo ""
    print_header "Stopping Services"

    if [ -n "$BACKEND_PID" ]; then
        print_info "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
    fi

    if [ -n "$FRONTEND_PID" ]; then
        print_info "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    # Wait for processes to terminate
    sleep 2

    print_success "All services stopped"
    exit 0
}

# Trap signals for cleanup
trap cleanup SIGINT SIGTERM

################################################################################
# Database Functions
################################################################################

start_databases() {
    print_header "Starting Databases"

    cd "$BACKEND_DIR"

    # Check if containers are already running
    if docker ps --format '{{.Names}}' | grep -q 'blog-postgres'; then
        print_warning "PostgreSQL is already running"
    else
        print_info "Starting PostgreSQL..."
        docker compose up -d postgres
        print_success "PostgreSQL started"
    fi

    if docker ps --format '{{.Names}}' | grep -q 'blog-redis'; then
        print_warning "Redis is already running"
    else
        print_info "Starting Redis..."
        docker compose up -d redis
        print_success "Redis started"
    fi

    echo ""

    # Wait for PostgreSQL to be ready
    print_info "Waiting for PostgreSQL to be ready..."
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker exec blog-postgres pg_isready -U blog_user -d blog_db >/dev/null 2>&1; then
            print_success "PostgreSQL is ready"
            echo ""
            return 0
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 1
    done

    print_error "PostgreSQL failed to start"
    exit 1
}

stop_databases() {
    print_header "Stopping Databases"

    cd "$BACKEND_DIR"
    docker compose down

    print_success "Databases stopped"
    echo ""
}

################################################################################
# Backend Functions
################################################################################

setup_backend_env() {
    print_info "Setting up backend environment..."

    # Create .env if not exists
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        cat > "$BACKEND_DIR/.env" << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=dev-secret-key-for-testing-only

# Server Configuration
HOST=127.0.0.1
PORT=3000

# Environment
RUST_LOG=debug
ENVIRONMENT=development

# Security
PASSWORD_PEPPER=dev-pepper
CORS_ORIGIN=http://localhost:3001

# Rate Limiting
RATE_LIMIT_PER_MINUTE=1000

# Session Configuration
SESSION_SECRET=dev-session-secret
SESSION_TIMEOUT_HOURS=24

# Monitoring
PROMETHEUS_ENABLED=true
EOF
        print_success "Created .env file"
    else
        print_info ".env file already exists"
    fi
}

build_backend() {
    cd "$BACKEND_DIR"

    if [ "$CLEAN_BUILD" = true ]; then
        print_info "Cleaning previous build..."
        cargo clean
    fi

    print_info "Building backend (this may take a while)..."

    # Build with database connected for SQLx compile-time checks
    if SQLX_OFFLINE=false cargo build; then
        print_success "Backend built successfully"
    else
        print_error "Backend build failed"
        exit 1
    fi
    echo ""
}

start_backend() {
    print_header "Starting Backend"

    setup_backend_env
    build_backend

    cd "$BACKEND_DIR"

    print_info "Starting backend server..."
    print_info "Backend will be available at: http://localhost:3000"
    print_info "Swagger UI: http://localhost:3000/swagger-ui/"
    echo ""

    # Load environment variables from .env file
    if [ -f ".env" ]; then
        set -a
        source .env
        set +a
    fi

    # Start backend in background
    cargo run &
    BACKEND_PID=$!

    # Wait a moment for backend to start
    sleep 3

    # Check if backend is running
    if ps -p $BACKEND_PID > /dev/null; then
        print_success "Backend started (PID: $BACKEND_PID)"
    else
        print_error "Backend failed to start"
        return 1
    fi
    echo ""
}

################################################################################
# Frontend Functions
################################################################################

setup_frontend_env() {
    print_info "Setting up frontend environment..."

    # Create .env.local if not exists
    if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
        cat > "$FRONTEND_DIR/.env.local" << 'EOF'
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3001
EOF
        print_success "Created .env.local file"
    else
        print_info ".env.local file already exists"
    fi
}

install_frontend_deps() {
    cd "$FRONTEND_DIR"

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_info "Installing frontend dependencies..."
        pnpm install
        print_success "Dependencies installed"
    else
        print_info "Dependencies already installed"
    fi
}

start_frontend() {
    print_header "Starting Frontend"

    setup_frontend_env
    install_frontend_deps

    cd "$FRONTEND_DIR"

    print_info "Starting frontend development server..."
    print_info "Frontend will be available at: http://localhost:3001"
    echo ""

    # Start frontend in background
    PORT=3001 pnpm dev &
    FRONTEND_PID=$!

    # Wait a moment for frontend to start
    sleep 3

    # Check if frontend is running
    if ps -p $FRONTEND_PID > /dev/null; then
        print_success "Frontend started (PID: $FRONTEND_PID)"
    else
        print_error "Frontend failed to start"
        return 1
    fi
    echo ""
}

################################################################################
# Health Check
################################################################################

health_check() {
    print_header "Health Check"

    local all_healthy=true

    # Check PostgreSQL
    if docker exec blog-postgres pg_isready -U blog_user -d blog_db >/dev/null 2>&1; then
        echo -e "PostgreSQL:     ${GREEN}✓ Healthy${NC}"
    else
        echo -e "PostgreSQL:     ${RED}✗ Unhealthy${NC}"
        all_healthy=false
    fi

    # Check Redis
    if docker exec blog-redis redis-cli ping >/dev/null 2>&1; then
        echo -e "Redis:          ${GREEN}✓ Healthy${NC}"
    else
        echo -e "Redis:          ${RED}✗ Unhealthy${NC}"
        all_healthy=false
    fi

    # Check Backend
    if curl -s http://localhost:3000/healthz >/dev/null 2>&1; then
        echo -e "Backend API:    ${GREEN}✓ Healthy${NC}"
    else
        echo -e "Backend API:    ${YELLOW}⊘ Starting...${NC}"
    fi

    # Check Frontend
    if curl -s http://localhost:3001 >/dev/null 2>&1; then
        echo -e "Frontend:       ${GREEN}✓ Healthy${NC}"
    else
        echo -e "Frontend:       ${YELLOW}⊘ Starting...${NC}"
    fi

    echo ""

    if [ "$all_healthy" = true ]; then
        print_success "All services are healthy!"
    else
        print_warning "Some services may not be ready yet"
    fi
}

################################################################################
# Show Info
################################################################################

show_info() {
    echo ""
    print_header "Development Environment Ready!"

    cat << EOF
${GREEN}Services:${NC}
  → Backend API:    http://localhost:3000
  → Frontend:       http://localhost:3001
  → PostgreSQL:     localhost:5432
  → Redis:          localhost:6379

${GREEN}Documentation:${NC}
  → Swagger UI:     http://localhost:3000/swagger-ui/
  → API Docs:       http://localhost:3000/api-docs/openapi.json
  → Health Check:   http://localhost:3000/healthz
  → Metrics:        http://localhost:3000/metrics

${GREEN}Database Access:${NC}
  → PostgreSQL:     docker exec -it blog-postgres psql -U blog_user -d blog_db
  → Redis:          docker exec -it blog-redis redis-cli

${GREEN}Commands:${NC}
  → View logs:      tail -f logs/*.log (if configured)
  → Stop all:       Press Ctrl+C
  → Restart:        Run this script again

${YELLOW}Press Ctrl+C to stop all services${NC}
EOF
    echo ""
}

################################################################################
# Parse Arguments
################################################################################

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-backend)
                START_BACKEND=false
                shift
                ;;
            --no-frontend)
                START_FRONTEND=false
                shift
                ;;
            --no-db)
                START_DB=false
                shift
                ;;
            --clean)
                CLEAN_BUILD=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
Usage: ./start-dev.sh [options]

Start the blog platform in development mode.

Options:
  --no-backend    Skip starting the backend
  --no-frontend   Skip starting the frontend
  --no-db         Skip starting databases
  --clean         Clean build before starting
  --help          Show this help message

Examples:
  ./start-dev.sh              # Start all services
  ./start-dev.sh --no-db      # Start without databases (if already running)
  ./start-dev.sh --clean      # Clean and rebuild everything
EOF
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

    # Start databases
    if [ "$START_DB" = true ]; then
        start_databases
    fi

    # Start backend
    if [ "$START_BACKEND" = true ]; then
        start_backend
    fi

    # Start frontend
    if [ "$START_FRONTEND" = true ]; then
        start_frontend
    fi

    # Run health check
    sleep 2
    health_check

    # Show info
    show_info

    # Wait for user interrupt
    print_info "All services are running. Press Ctrl+C to stop..."
    wait
}

# Run main function
main "$@"
