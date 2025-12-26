#!/bin/bash

# Blog Backend Deployment Script
# Usage: ./deploy.sh [dev|prod|stop]

set -e

MODE=${1:-dev}

echo "=== Blog Backend Deployment Script ==="
echo "Mode: $MODE"
echo

# Function to start development environment
start_dev() {
    echo "Starting development environment..."

    # Create .env file for development
    cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=dev-secret-key-for-testing-only-x

# Server Configuration
HOST=127.0.0.1
PORT=3000

# Environment
RUST_LOG=debug
ENVIRONMENT=development

# Security
PASSWORD_PEPPER=dev-pepper
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_PER_MINUTE=1000

# Session Configuration
SESSION_SECRET=dev-session-secret
SESSION_TIMEOUT_HOURS=24

# Monitoring
PROMETHEUS_ENABLED=true
EOF

    # Start databases
    echo "Starting PostgreSQL and Redis..."
    docker compose -f docker-compose.simple.yml up -d

    echo
    echo "=== Services Started ==="
    echo "PostgreSQL: localhost:5432"
    echo "Redis: localhost:6379"
    echo
    echo "To build and run the backend:"
    echo "  export DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db"
    echo "  export REDIS_URL=redis://localhost:6379"
    echo "  cargo run --bin blog-api"
    echo
    echo "To stop services:"
    echo "  ./deploy.sh stop"
}

# Function to start production environment
start_prod() {
    echo "Starting production environment..."

    # Check if .env.production exists
    if [ ! -f .env.production ]; then
        echo "Error: .env.production file not found!"
        echo "Please copy .env.production.example to .env.production and configure it."
        exit 1
    fi

    # Copy production env
    cp .env.production .env

    # Build production image
    echo "Building production image..."
    docker build -f Dockerfile --target production -t blog-api:latest .

    # Start production stack
    echo "Starting production stack..."
    docker compose -f docker-compose.prod.yml up -d

    echo
    echo "=== Production Services Started ==="
    echo "API: http://localhost:3000"
    echo "Health: http://localhost:3000/health"
    echo "Swagger UI: http://localhost:3000/swagger-ui/"
}

# Function to stop services
stop_services() {
    echo "Stopping all services..."

    # Stop dev services
    docker compose -f docker-compose.simple.yml down 2>/dev/null || true

    # Stop prod services
    docker compose -f docker-compose.prod.yml down 2>/dev/null || true

    # Stop any running API containers
    docker stop blog-api 2>/dev/null || true
    docker rm blog-api 2>/dev/null || true

    echo "All services stopped."
}

# Function to show status
show_status() {
    echo "=== Service Status ==="
    echo
    echo "Docker Containers:"
    docker ps -a --filter "name=blog-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo
    echo "Environment Variables:"
    echo "DATABASE_URL: ${DATABASE_URL:-not set}"
    echo "REDIS_URL: ${REDIS_URL:-not set}"
}

# Function to setup database
setup_db() {
    echo "Setting up database..."

    # Wait for PostgreSQL to be ready
    echo "Waiting for PostgreSQL to be ready..."
    until docker exec blog-postgres pg_isready -U blog_user -d blog_db; do
        echo "PostgreSQL is not ready yet..."
        sleep 2
    done

    echo "PostgreSQL is ready!"

    # Run migrations if they exist
    if [ -d "migrations" ]; then
        echo "Running database migrations..."
        # You would need to have sqlx-cli installed for this
        # sqlx migrate run --database-url "postgresql://blog_user:blog_password@localhost:5432/blog_db"
        echo "Note: Please run migrations manually with sqlx CLI"
    fi
}

# Main execution
case $MODE in
    dev)
        start_dev
        ;;
    prod)
        start_prod
        ;;
    stop)
        stop_services
        ;;
    status)
        show_status
        ;;
    setup-db)
        setup_db
        ;;
    *)
        echo "Usage: $0 [dev|prod|stop|status|setup-db]"
        echo
        echo "Commands:"
        echo "  dev      - Start development environment (databases only)"
        echo "  prod     - Start production environment (full stack)"
        echo "  stop     - Stop all services"
        echo "  status   - Show service status"
        echo "  setup-db - Setup database and run migrations"
        exit 1
        ;;
esac